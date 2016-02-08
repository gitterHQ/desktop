'use strict';

var log = require('loglevel');

var temp = require('temp');
temp.track();
var request = require('request');
var notifier = require('node-notifier');
var Promise = require('bluebird');

var settings = require('./settings');

var gui = window.require('nw.gui');
var win = gui.Window.get();

var CLIENT = require('./client-type');
var SOUNDS_ITEMS = require('../components/sound-items');

// TODO: Resize images because GitHub is not resizing default avatars and it creates inconsistent avatar size
// TODO: Deal with other platforms
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
var urlFilePathMap = new Map();
function getFileAtUrl(url) {
  return new Promise(function(resolve, reject) {
    var cachedFilePath = urlFilePathMap.get(url);
    if(cachedFilePath) {
      resolve(cachedFilePath);
    }
    else {
      setTimeout(function() {
        reject(new Error('Took to long to request file', url));
      }, 750);

      var tempFileStream = temp.createWriteStream();
      tempFileStream
        .on('finish', function() {
          var tempFilePath = tempFileStream.path;
          // Store it on our map as a cache lookup
          urlFilePathMap.set(url, tempFilePath);
          resolve(tempFilePath);
        })
        .on('error', function(err) {
          reject(err);
        });

      request(url)
        .on('error', function(err) {
          reject(err);
        })
        .pipe(tempFileStream);
    }
  });
}

module.exports = function (spec) {
  if (!settings.showNotifications) return;

  var avatarImageUrl = getFullUrlNotificationImageForUri(spec.link);

  getFileAtUrl(avatarImageUrl)
    // We are not worried if they couldn't fetch the image
    // as we fallback to the URL itself
    .catch(function() {
      return undefined;
    })
    .then(function(tempAvatarFilePath) {
      playNotificationSound();

      // use the local file version if available, otherwise fallback to the URL
      var imagePath = avatarImageUrl;
      if(tempAvatarFilePath) {
        imagePath = 'file://' + tempAvatarFilePath;
      }

      // We use this instead of `new window.Notification(...)` because we can disable the native sound
      notifier.notify({
        title: spec.title,
        message: spec.message,
        // absolute path
        icon: imagePath,
        // Only Notification Center or Windows Toasters
        // We handle the sound outside of this above
        // And we set to false because Windows 10 by default makes a separate sound
        sound: false,
        // wait with callback until user action is taken on notification
        wait: false
      }, function (err, response) {
        // response is response from notification
        if(err) {
          throw err;
        }
      });
      notifier.on('click', function (notifierObject, options) {
        spec.click();
      });
    })
    .catch(function(err) {
      log.error('Problem with notification', err, err.stack);
    });

};
