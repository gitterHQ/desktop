'use strict';

var gui = window.require('nw.gui');
var pkg = require('../package.json');
var settings = require('../utils/settings');
var events = require('../utils/custom-events');
var quitApp = require('../utils/quit-app');

var SOUNDS = require('../utils/sounds');

module.exports = [
  {
    label: 'Gitter v' + pkg.version,
    enabled: false,
    support: ['linux', 'win']
  },
  {
    label: 'Show in Menu Bar',
    type: 'checkbox',
    checked: settings.showInMacMenuBar,
    support: ['osx'],
    click: function () {
      settings.showInMacMenuBar = !settings.showInMacMenuBar;
    }
  },
  {
    label: 'Launch on startup',
    type: 'checkbox',
    checked: settings.launchOnStartup,
    click: function () {
      settings.launchOnStartup = !settings.launchOnStartup;
    },
    support: ['linux', 'win', 'osx']
  },
  {
    type: 'separator',
  },
  {
    label: 'Show Notifications',
    type: 'checkbox',
    checked: settings.showNotifications,
    click: function () {
      settings.showNotifications = !settings.showNotifications;
    },
    auth: true
  },
  {
    label: 'Notification Sound',
    auth: true,
    content: SOUNDS
  },
  {
    label: 'Gitter Next',
    type: 'checkbox',
    checked: settings.next,
    click: events.emit.bind(events, 'menu:toggle:next')
  },
  {
    type: 'separator',
  },
  {
    label: 'Developer Tools',
    click: events.emit.bind(events, 'menu:toggle:devtools')
  },
  {
    type: 'separator',
  },
  {
    label: 'Sign Out',
    click: events.emit.bind(events, 'menu:signout'),
    auth: true
  },
  {
    label: 'Exit',
    click: quitApp,
    support: ['linux', 'win']
  }
].map(function (item, index) {
  item.index = index; // FIXME: unsure whether this is a good way to add index
  return item;
});
