'use strict';

var Store = require('jfs');
var events = require('./custom-events');
var log = require('loglevel');
var SOUNDS = require('./sounds');

function isBool(val) {
  return typeof val === "boolean";
}

// via http://stackoverflow.com/a/1830844/796832
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var DEFAULT_SETTINGS = {
  showInMacMenuBar: {
    value: true,
    validate: isBool
  },
  launchOnStartup: {
    value: true,
    validate: isBool
  },
  launchHidden: {
    value: false,
    validate: isBool
  },
  next: {
    value: false,
    validate: isBool
  },
  showNotifications: {
    value: true,
    validate: isBool
  },
  notificationSound: {
    value: 1,
    validate: function (val) {
      return val >= 0 && val <= SOUNDS.length;
    }
  }
};

var db = new Store(nw.App.dataPath + '/gitter_preferences.json', { pretty: true }); // FIXME: pretty Boolean - should be environment dependent

// initial load is done synchronously
var settings = db.getSync('settings');

// setting up observable
Object.observe(settings, function (changes) {
  // save settings everytime a change is made
  db.save('settings', settings, function (err) {
    // emit an event which indicates failure or success
    if (err) {
      log.error('ERROR: Could not save settings.');
      return events.emit('settings:failed', err);
    }
    events.emit('settings:saved');
  });

  // in case any component is interested on a particular setting change
  changes.forEach(function (change) {
    events.emit('settings:change:' + change.name, change.object[change.name]);
  });

  events.emit('settings:change');
});

// performs a check to guarantee health of settings
Object.keys(DEFAULT_SETTINGS)
  .forEach(function (key) {
    if (!settings.hasOwnProperty(key)) {
      settings[key] = DEFAULT_SETTINGS[key].value;
    }

    var isValid = DEFAULT_SETTINGS[key].validate(settings[key]);

    if (!isValid) {
      log.warn('ERROR: Invalid setting:' + key + '. restoring to default');
      settings[key] = DEFAULT_SETTINGS[key].value;
    }
  });

module.exports = settings;
