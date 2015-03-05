'use strict';

var log = require('loglevel');
var notifier = require('./notifier');
var pkg = require('../package.json');
var gui = window.require('nw.gui');

var CLIENT = require('./client-type');

var Updater = require('node-webkit-updater');
var updater = new Updater(pkg);

// Promise wrapper for udpater.checkForNewVersion
function checkForNewVersion() {
  return new Promise(function (resolve, reject) {
    log.info('Checking for updates');
    updater.checkNewVersion(function (err, newVersionExists, newManifest) {
      log.info('newVersionExists? ' + newVersionExists);
      if (err || !newVersionExists) return reject();
      resolve(newManifest);
    });
  });
}

// Promise wrapper for updater.download
function download(newManifest) {
  return new Promise(function (resolve, reject) {
    if (CLIENT === 'linux') {
      notifier({
        title: 'Update Available',
        message: 'Head over to gitter.im/apps to get it.'
      });
      reject(new Error('Should not download auto update for ' + CLIENT));
      return;
    }
    log.info('Downloading update');
    updater.download(function (err, filename) {
      return err ? reject(err) : resolve({filename: filename, newManifest: newManifest});
    }, newManifest);
  });
}

// Promise wrapper for updater.unpack
function unpack(filename, newManifest) {
  return new Promise(function (resolve, reject) {
    log.info('Unpacking update');
    updater.unpack(filename, function (err, newAppPath) {
      return err ? reject(err) : resolve(newAppPath);
    }, newManifest);
  });
}

// Promise wrapper for updater.install
function install(copyPath) {
  return new Promise(function (resolve, reject) {
    log.info('Installing at' + copyPath);
    updater.install(copyPath, function (err) {
      return err ? reject(err) : resolve();
    });
  });
}

// Check if CLI arguments where passed during startup
function isInProgress() {
  return gui.App.argv.length ? true : false;
}

// Poll S3 for updates and show a notification
function pollForUpdates() {
  // FIXME: we shouldn't do this in the same way for linux as it doesn't have auto-update. Notify of new update with link to update.gitter.im/linux/latest
  checkForNewVersion()
    .then(function (newManifest) {
      return download(newManifest);
    })
    .then(function (downloadData) {
      return unpack(downloadData.filename, downloadData.newManifest);
    })
    .then(function (newAppPath) {

      function restart() {
        log.info('Running Installer');
        updater.runInstaller(newAppPath, [updater.getAppPath(), updater.getAppExec()], {});
        log.info('Quitting outdated app');
        gui.App.quit();
      }

      // FIXME Find a way of making this notifications persistent
      function restartNotification() {
        notifier({
          title: 'Update Ready',
          message: 'Click here to reload the app now.',
          click: function () { restart(); }
        });
      }

      restartNotification();
      setInterval(restartNotification, 30 * 1000);
    })
    .catch(function (err) {
      log.error('[Update Error]: ' + err.stack);
    });
}

// Will take CLI arguments and copy itself
function finishUpdate() {
  var copyPath = gui.App.argv[0];
  var execPath = gui.App.argv[1];

  // Replace old app, Run updated app from original location and close installer instance
  return install(copyPath)
  .then(function () {

    // The recommended updater.run(execPath, null) [1] doesn't work properly on Window.
    // It spawns a new child process but it doesn't detach so when the installer app quits the new version also quits. :poop:
    // [1] https://github.com/edjafarov/node-webkit-updater/blob/master/examples/basic.js#L29
    // https://github.com/edjafarov/node-webkit-updater/blob/master/app/updater.js#L404-L416

    log.info('Running new version: ' + execPath);
    updater.run(execPath, [], {});
    //gui.Shell.openItem(execPath);

    function quitInstaller() {
      log.info('Quitting the Installer app');
      gui.App.quit();
    }

    setTimeout(quitInstaller, 5*1000);
  })
  .catch(function (err) {
    log.error('Something went wrong with the update: ' + err.stack);
  });
}

module.exports = {
  isInProgress:   isInProgress,
  finishUpdate:   finishUpdate,
  pollForUpdates: pollForUpdates
};
