/* jshint node: true, browser: true */
'use strict';
var log = require('../utils/log');
var events = require('../utils/custom-events');
var settings = require('../utils/settings');
var SOUNDS = require('../utils/sounds');

// this array will be MenuItems thus the mapping is to add defaults values
var SOUND_ITEMS = SOUNDS
  .map(function (sound, index) {
    sound.type = 'checkbox';
    sound.checked = settings.notificationSound === index;
    sound.click = function (e) {
      settings.notificationSound = index;
    };
    return sound;
  });

// update the checked sounds on change
events.on('settings:change:notificationSound', function () {
  SOUND_ITEMS.forEach(function (sound, index) {
    sound.checked = settings.notificationSound === index;
  });
});

module.exports = SOUND_ITEMS;
