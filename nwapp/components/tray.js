/* jshint node: true, browser: true */
'use strict';
var gui = window.require('nw.gui');
var settings = require('../utils/settings');
var log = require('../utils/log');
var events = require('../utils/custom-events');

var CLIENT_TYPE = require('../utils/client-type');
var icon = require('../icons.json')[CLIENT_TYPE];
var tray = new gui.Tray({ icon: icon.disconnected, alticon: icon.selected, iconsAreTemplates: false });

function setIcon(icon) {
  tray.icon = icon;
}

var controls = {
  get: function () {
    return tray;
  },
  disconnect: function () {
    setIcon(icon.disconnected);
  },
  connect: function () {
    if (!settings.token) return; // user is signed out
    setIcon(icon.connected);
  },
  unread: function () {
    setIcon(icon.unread);
  }
};

events.on('user:signedOut', controls.disconnect);
events.on('user:signedIn', controls.connect);
events.on('traymenu:read', controls.connect);
events.on('traymenu:unread', controls.unread);

module.exports = controls;
