'use strict';

var notifier = require('node-notifier');

var settings = require('./settings');

var gui = window.require('nw.gui');
var win = gui.Window.get();


var CLIENT = require('./client-type');
var SOUNDS_ITEMS = require('../components/sound-items');

// TODO: Resize images because GitHub is not resizing default avatars and it creates inconsistent avatar size
// TODO: Deal with other platforms
function getNotificationImageForUri(uri) {
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

module.exports = function (spec) {
  if (!settings.showNotifications) return;
  playNotificationSound();

  // We use this instead of `new window.Notification(...)` because we can disable the native sound
  notifier.notify({
    title: spec.title,
    message: spec.message,
    // absolute path
    icon: getNotificationImageForUri(spec.link),
    // Only Notification Center or Windows Toasters
    // We handle the sound outside of this above
    // And we set to false because Windows 10 by default makes a separate sound
    sound: false,
    // wait with callback until user action is taken on notification
    wait: false
  }, function (err, response) {
    // response is response from notification
  });
  notifier.on('click', function (notifierObject, options) {
    spec.click();
  });

};
