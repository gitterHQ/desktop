'use strict';

var gui = window.require('nw.gui');
var manifest = require('../package.json');
var log = require('loglevel');
var argv = require('yargs')(gui.App.argv).argv;
var os = require('./client-type');

var urlParse = require('url-parse');
var rimraf = require('rimraf');
var path = require('path');
var temp = require('temp');
var request = require('request');
var extract = require('extract-zip');
var Updater = require('node-webkit-updater');

var notifier = require('./notifier');
var quitApp = require('./quit-app');



// You can change the place we use to check and download updates with this CLI parameter `--update-url=192.168.0.58:3010`
// We use this for testing a release
var updateUrlOption = argv['update-url'];
var transposeUpdateUrl = function(targetUrl) {
  var parsedTargetUrl = urlParse(targetUrl);
  var parsedUpdateUrl = urlParse(updateUrlOption);
  parsedTargetUrl.protocol = parsedUpdateUrl.protocol || 'http:';
  parsedTargetUrl.auth = parsedUpdateUrl.auth;
  parsedTargetUrl.hostname = parsedUpdateUrl.hostname;
  parsedTargetUrl.port = parsedUpdateUrl.port;

  var newUrl = parsedTargetUrl.toString();
  return newUrl;
};


var MANIFEST_URLS = {
  win: 'https://update.gitter.im/win/package.json',
  osx: 'https://update.gitter.im/osx/package.json',
  linux: 'https://update.gitter.im/linux/package.json'
};
Object.keys(MANIFEST_URLS).forEach(function(key) {
  MANIFEST_URLS[key] = transposeUpdateUrl(MANIFEST_URLS[key]);
});



var currentManifest = {
  name: manifest.name,
  version: manifest.version,
  manifestUrl: MANIFEST_URLS[os]
};

var updater = new Updater(currentManifest);


// Because nw.js doesn't pass along the `--remote-debugging-port` to the child app
// we need to use a separate variable name
var passthroughRemoteDebuggingPort = function() {
  // If we were debugging before, be sure to allow them to see the install
  var remoteDebuggingPort = argv['passthrough-remote-debugging-port'];
  if(remoteDebuggingPort) {
    log.info('You will be able to monitor the new app launch with the same remote debugging port (just refresh to see new instances)', remoteDebuggingPort);
    return ['--remote-debugging-port=' + remoteDebuggingPort, '--passthrough-remote-debugging-port=' + remoteDebuggingPort];
  }

  return [];
};



function download(url, cb) {
  var tempFileStream = temp.createWriteStream('gitter-update-zip');

  tempFileStream.on('error', cb)
                .on('finish', function() {
                  cb(null, tempFileStream.path);
                });
  log.info('downloading update from', url, 'to', tempFileStream.path);

  request.get(url)
         .on('error', cb)
         .pipe(tempFileStream);
}

function unpack(zipPath, cb) {
  var dir = temp.path('gitter-update-app');

  log.info('unpacking update from', zipPath, 'to', dir);

  extract(zipPath, { dir: dir }, function(err) {
    if (err) return cb(err);

    cb(null, dir);
  });
}

function getUpdate(manifest, cb) {
  // node-webkit-updater logic from hell
  var platform = process.platform;
  platform = /^win/.test(platform)? 'win' : /^darwin/.test(platform)? 'mac' : 'linux' + (process.arch == 'ia32' ? '32' : '64');

  var updateBundleUrl = transposeUpdateUrl(manifest.packages[platform].url);

  log.info('Downloading bundle from:', updateBundleUrl);
  download(updateBundleUrl, function(err, zipPath) {
    if (err) return cb(err);

    unpack(zipPath, function(err, appDir) {
      if (err) return cb(err);

      // clean up the zip, but we have no way to track
      // the temp appDir, so that cant be cleaned
      rimraf(zipPath, function(err) {
        if (err) return cb(err);

        cb(null, appDir);
      });
    });
  });
}

function notifyLinuxUser(version) {

  function notify() {
    notifier({
      title: 'Gitter ' + version + ' Available',
      message: 'Head over to gitter.im/apps to update.'
    });
  }

  notify();

  // every 30 mins, as it requires the user to manually go to gitter.im/apps
  // so it could get annoying
  setInterval(notify, 30 * 60 * 1000);
}

function notifyWinOsxUser(version, newAppExecutable) {

  function notify() {
    notifier({
      title: 'Gitter ' + version + ' Available',
      message: 'Click to restart and apply update.',
      click: function() {

        var installerArgs = [
          '--current-install-path=' + updater.getAppPath(),
          '--new-executable=' + updater.getAppExec()
        ];
        // If we were debugging before, be sure to allow them to see the install
        installerArgs = installerArgs.concat(passthroughRemoteDebuggingPort());

        log.info('Starting new app to install itself', newAppExecutable, installerArgs);
        updater.runInstaller(newAppExecutable, installerArgs, {});

        log.info('Quitting outdated app');
        quitApp();
      }
    });
  }

  notify();

  setInterval(notify, 5 * 60 * 1000);
}


function poll() {

  function update() {
    log.info('checking', currentManifest.manifestUrl, 'for app updates');
    updater.checkNewVersion(function (err, newVersionExists, newManifest) {
      if (err) {
        log.error('request for app update manifest failed', err);
        return tryAgainLater();
      }

      if (!newVersionExists) {
        log.info('app currently at latest version');
        return tryAgainLater();
      }

      // Update available!
      var version = newManifest.version;
      log.info('app update ' + version + ' available');

      if (os === 'linux') {
        // linux cannot autoupdate (yet)
        return notifyLinuxUser(version);
      }

      getUpdate(newManifest, function(err, newAppDir) {
        if (err) {
          log.error('app update ' + version + ' failed to download and unpack', err.message);
          return tryAgainLater();
        }

        var executable = newManifest.name + (os === 'win' ? '.exe' : '.app');
        var newAppExecutable = path.join(newAppDir, executable);

        return notifyWinOsxUser(version, newAppExecutable);
      });
    });
  }

  // polling with setInterval can cause multiple downloads
  // to occur if left unattended, so its best to wait for the updater
  // to finish each poll before triggering a new request.
  function tryAgainLater() {
    log.info('trying app update again in 30 mins');
    setTimeout(update, 30 * 60 * 1000);
  }

  // update() retries on failure, so only call once.
  update();
}

function overwriteOldApp(oldAppDir, executable) {
  updater.install(oldAppDir, function(err) {
    if (err) {
      log.error('update failed, shutting down installer', err.stack);
      return quitApp();
    }

    // The recommended updater.run(execPath, null) [1] doesn't work properly on Windows.
    // It spawns a new child process but it doesn't detach so when the installer app quits the new version also quits. :poop:
    // [1] https://github.com/edjafarov/node-webkit-updater/blob/master/examples/basic.js#L29
    // https://github.com/edjafarov/node-webkit-updater/blob/master/app/updater.js#L404-L416
    var newAppArgs = [];
    // If we were debugging before, be sure to allow them to see the new app
    newAppArgs = newAppArgs.concat(passthroughRemoteDebuggingPort());
    log.info('starting new version', executable, newAppArgs);
    updater.run(executable, newAppArgs, {});

    // wait for new version to get going...
    setTimeout(function() {
      log.info('shutting down installer');
      quitApp();
    }, 5000);
  });
}

module.exports = {
  poll: poll,
  overwriteOldApp: overwriteOldApp
};
