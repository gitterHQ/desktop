'use strict';

var log = require('loglevel');
var notifier = require('./notifier');
var packageJson = require('../package.json');
var gui = window.require('nw.gui');
var os = require('./client-type');
var Updater = require('node-webkit-updater');
var temp = require('temp');
var request = require('request');
var extract = require('extract-zip');
var rimraf = require('rimraf');
var path = require('path');

var MANIFEST_URLS = {
  win: 'https://update.gitter.im/win/package.json',
  osx: 'https://update.gitter.im/osx/package.json',
  linux: 'https://update.gitter.im/linux/package.json'
};

var currentManifest = {
  name: packageJson.name,
  version: packageJson.version,
  manifestUrl: MANIFEST_URLS[os]
};

var updater = new Updater(currentManifest);

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

  var url = manifest.packages[platform].url;

  download(url, function(err, zipPath) {
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
        log.info('Starting new app to install itself', newAppExecutable, updater.getAppPath(), updater.getAppExec());

        updater.runInstaller(newAppExecutable, [updater.getAppPath(), updater.getAppExec()], {});

        log.info('Quitting outdated app');
        gui.App.quit();
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
      return gui.App.quit();
    }

    // The recommended updater.run(execPath, null) [1] doesn't work properly on Windows.
    // It spawns a new child process but it doesn't detach so when the installer app quits the new version also quits. :poop:
    // [1] https://github.com/edjafarov/node-webkit-updater/blob/master/examples/basic.js#L29
    // https://github.com/edjafarov/node-webkit-updater/blob/master/app/updater.js#L404-L416
    log.info('starting new version');
    updater.run(executable, [], {});

    // wait for new version to get going...
    setTimeout(function() {
      log.info('shutting down installer');
      gui.App.quit();
    }, 5000);
  });
}

module.exports = {
  poll: poll,
  overwriteOldApp: overwriteOldApp
};
