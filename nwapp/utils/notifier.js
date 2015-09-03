'use strict';

var settings = require('./settings');

var gui = window.require('nw.gui');
var win = gui.Window.get();

var CLIENT = require('./client-type');
var SOUNDS_ITEMS = require('../components/sound-items');

// TODO: Resize images because GitHub is not resizing default avatars and it creates inconsistent avatar size
// TODO: Deal with other platforms
function getNotificationImageForUri(uri) {
  if (!uri) return "";
  if (CLIENT.match(/^osx|^win/)) return "https://avatars.githubusercontent.com/" + uri.split("/")[1] + "?s=32";
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

  var notification = new window.Notification(spec.title, {
    body: spec.message,
    icon: getNotificationImageForUri(spec.link)
  });

  notification.addEventListener('click', spec.click);
};
