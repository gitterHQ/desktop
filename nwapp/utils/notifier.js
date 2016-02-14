'use strict';

var log = require('loglevel');

var Promise = require('bluebird');
var os = require('os');
var fs = require('fs-extra');
var ensureDir = Promise.promisify(fs.ensureDir);
var path = require('path');
var temp = require('temp');
var rimraf = Promise.promisify(require('rimraf'));
var request = require('request');
var notifier = require('node-notifier');
var objectAssign = require('object-assign');

var settings = require('./settings');
var events = require('./custom-events');

var gui = window.require('nw.gui');
var win = gui.Window.get();

var CLIENT = require('./client-type');
var SOUNDS_ITEMS = require('../components/sound-items');

function getFullUrlNotificationImageForUri(uri) {
  if (!uri) return '';
  if (CLIENT.match(/^osx|^win/)) return 'https://avatars.githubusercontent.com/' + uri.split('/')[1] + '?s=32';
}

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
  rimraf(tempAvatarDirectory)
    .then(function() {
      log.info('Finished avatar cleanup');
    });
});
function getFileAtUrl(url) {
  return ensureTempAvatarDirectory.then(function() {
      var cachedFilePath = urlFilePathCacheMap.get(url);
      if(!cachedFilePath) {
        throw new Error('Avatar is not in the cache');
      }
      return cachedFilePath;
    })
    .catch(function(cachedFilePath) {
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
    })
    .then(function(filePath) {
      return 'file://' + filePath;
    });
}


var notifierDefaults = {
  title: '',
  message: '',
  link: undefined,
  click: undefined
};

module.exports = function (options) {
  var opts = objectAssign({}, notifierDefaults, options);

  if (!settings.showNotifications) return;

  var avatarImageUrl = getFullUrlNotificationImageForUri(opts.link);

  getFileAtUrl(avatarImageUrl)
    // We are not worried if they couldn't fetch the image
    // as we fallback to the URL itself
    .catch(function(err) {
      log.error('Trouble getting avatar for notification' + err.message + err.stack);
      return undefined;
    })
    .then(function(tempAvatarFilePath) {
      playNotificationSound();

      // use the local file version if available, otherwise fallback to the URL
      var imagePath = tempAvatarFilePath || avatarImageUrl;

      // We use this instead of `new window.Notification(...)` because we can disable the native sound
      notifier.notify({
        title: opts.title,
        message: opts.message,
        // absolute path
        icon: imagePath,
        // Only Notification Center or Windows Toasters
        // We handle the sound outside of this above
        // And we set to false because Windows 10 by default makes a separate sound
        sound: false,
        // wait with callback until user action is taken on notification
        wait: false
      }, function (err) {
        if(err) throw err;
      });
      notifier.on('click', function (notifierObject, options) {
        if(opts.click) opts.click();
      });
    })
    .catch(function(err) {
      log.error('Problem with notification', err, err.stack);
    });

};
