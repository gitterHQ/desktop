'use strict';

var gui = window.require('nw.gui');
var settings = require('../utils/settings');
var events = require('../utils/custom-events');

var CLIENT_TYPE = require('../utils/client-type');
var icon = require('../icons.json')[CLIENT_TYPE];

function CustomTray() {
  this.tray = new gui.Tray({
    icon: icon.disconnected,
    alticon: icon.selected,
    iconsAreTemplates: false
  });

  events.on('user:signedOut', this.disconnect.bind(this));
  events.on('user:signedIn', this.connect.bind(this));
  events.on('traymenu:read', this.connect.bind(this));
  events.on('traymenu:unread', this.unread.bind(this));
}

CustomTray.prototype.setIcon = function(icon) {
  this.tray.icon = icon;
};

CustomTray.prototype.get = function() {
  return this.tray;
};
CustomTray.prototype.disconnect = function() {
  this.setIcon(icon.disconnected);
};
CustomTray.prototype.connect = function() {
  if (!settings.token) return; // user is signed out
  this.setIcon(icon.connected);
};
CustomTray.prototype.unread = function() {
  this.setIcon(icon.unread);
};


module.exports = CustomTray;
