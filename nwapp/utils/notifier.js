'use strict';

var log = require('loglevel');

var Promise = require('bluebird');
var os = require('os');
var fs = require('fs-extra');
var ensureDir = Promise.promisify(fs.ensureDir);
var path = require('path');
var temp = require('temp');
var rimraf = require('rimraf');
var request = require('request');
var notifier = require('node-notifier');
var objectAssign = require('object-assign');

var settings = require('./settings');
var events = require('./custom-events');

var win = nw.Window.get();

var CLIENT = require('./client-type');
var SOUNDS_ITEMS = require('../components/sound-items');


function playNotificationSound() {
  var audio = win.window.document.createElement('audio');
  var sound = SOUNDS_ITEMS[settings.notificationSound];

  if (!sound.path) {
    return;
  }

  audio.src = sound.path;
  audio.play();
  audio = null;
}

var checkActivationNotifierResponse = function(response) {
  // 'activated', `timeout'`
  var resp = response.trim().toLowerCase();
  if(resp.match(/^activate/)) {
    return true;
  }

  return false;
};


// Cache lookup
var urlFilePathCacheMap = new Map();
var tempAvatarDirectory = path.join(os.tmpDir(), 'gitter-notification-avatars_');
log.info('Saving notification avatars at: ' + tempAvatarDirectory);
var ensureTempAvatarDirectory = ensureDir(tempAvatarDirectory)
  .then(function() {
    return tempAvatarDirectory;
  });

events.on('app:quit', function() {
  log.info('App is quiting, cleanup avatars');
  try {
    rimraf.sync(tempAvatarDirectory);
  }
  catch(err) {
    log.error('Something went wrong while cleaning up the avatars: ' + err.message + err.stack);
  }
});

function downloadAndCache(url) {
  return new Promise(function(resolve, reject) {
    var tempFileStream = temp.createWriteStream({
      dir: tempAvatarDirectory
    });

    tempFileStream
      .on('finish', function() {
        var tempFilePath = tempFileStream.path;
        // Store it on our map as a cache lookup
        urlFilePathCacheMap.set(url, tempFilePath);
        resolve(tempFilePath);
      })
      .on('error', function(err) {
        reject(err);
      });

    request({
        url: url,
        method: 'GET',
        timeout: 750
      })
      .on('error', function(err) {
        reject(err);
      })
      .pipe(tempFileStream);
  });
}
function getFilePathForHttpUrl(url) {
  return ensureTempAvatarDirectory.then(function() {
      var cachedFilePath = urlFilePathCacheMap.get(url);
      return cachedFilePath || downloadAndCache(url);
    })
    .then(function(filePath) {
      return filePath;
    });
}


var notifierDefaults = {
  title: '',
  message: '',
  // gitterHQ logo
  icon: 'https://avatars.githubusercontent.com/u/5990364?s=60',
  click: undefined
};

module.exports = function (options) {
  var opts = objectAssign({}, notifierDefaults, options);

  if (!settings.showNotifications) return;

  getFilePathForHttpUrl(opts.icon)
    // We are not worried if they couldn't fetch the image
    // as we fallback to the URL itself
    .catch(function(err) {
      log.error('Trouble getting avatar for notification' + err.message + err.stack);
      return opts.icon;
    })
    .then(function(imagePath) {
      playNotificationSound();

      // We use this instead of `new window.Notification(...)` because we can disable the native sound
      notifier.notify({
        title: opts.title,
        message: opts.message,
        icon: imagePath,
        // Only Notification Center or Windows Toasters
        // We handle the sound outside of this above
        // And we set to false because Windows 10 by default makes a separate sound
        sound: false,
        // wait with callback until user action is taken on notification
        wait: true
      }, function(err, response) {
        log.info('Notification response', response);
        var didActivate = checkActivationNotifierResponse(response);

        if(err) {
          // If you are seeing errors on each notification on Windows,
          // it isn't really a issue because everything works normally and
          // we are blocked until it gets fixed: https://github.com/mikaelbr/node-notifier/issues/97
          log.error('Problem with notification', err, err.stack);
        }
        if(didActivate && opts.click) {
          opts.click();
        }
      });
    })
    .catch(function(err) {
      log.error('Problem initializing notification', err, err.stack);
    });

};
