'use strict';

var gui = window.require('nw.gui');
var log = require('loglevel');
var Gitter = require('gitter-realtime-client');
var settings = require('../utils/settings');
var events = require('../utils/custom-events');

function TrayMenu() {
  this.menu = new gui.Menu();
  this.unsetRooms();

  events.on('user:signedOut', function () {
    this.unsetRooms();
    this.build();
  }.bind(this));

  events.on('realtime:connected', this.setRooms.bind(this));
  this.build();

  return this;
}

TrayMenu.prototype.unsetRooms = function () {
  if (this.rooms && this.rooms.unlisten) {
    this.rooms.unlisten(); // TODO: this may NOT be necessary
  }
  this.rooms = [];
  this.favourites = [];
  this.recents = [];
  this.unreads = [];
};

TrayMenu.prototype.setRooms = function (rooms) {
  log.debug('TrayMenu: Rooms collection set');

  // TODO: the existing listeners need to be cleared properly...
  this.rooms = rooms;
  this.favourites = Gitter.filteredRooms.favourites(rooms);
  this.recents = Gitter.filteredRooms.recents(rooms);
  this.unreads = Gitter.filteredRooms.unreads(rooms);

  this.rooms.on('reset', function () {
    this.build();
  }.bind(this));

  [this.favourites, this.recents, this.unreads].forEach(function (collection) {
    collection.on('add remove', this.build.bind(this)); // Quite wasteful, trashing and regenerating menu everytime.
  }.bind(this));
};

TrayMenu.prototype.clear = function () {
  for (var i = this.menu.items.length - 1; i >= 0; i--) {
    this.menu.removeAt(i);
  }
};

TrayMenu.prototype.addDefaults = function () {
  if (settings.token) {
    this.menu.append(new gui.MenuItem({ label: 'Sign Out', click: events.emit.bind(events, 'traymenu:signout') }));
  }
  this.menu.append(new gui.MenuItem({ label: 'Exit Gitter', click: gui.App.quit }));
};

TrayMenu.prototype.build = function () {
  log.debug('Rebuilding tray menu');
  this.clear();

  if (this.unreads.length > 0) {
    events.emit('traymenu:unread', this.unreads.length);
  } else {
    events.emit('traymenu:read');
  }

  [{ collection: this.unreads, label: 'unread' },
    { collection: this.favourites, label: 'favourites' },
    { collection: this.recents, label: 'recents' }
  ].forEach(this.addSection.bind(this));

  this.addDefaults();
  events.emit('traymenu:updated');
};

TrayMenu.prototype.addSection = function (spec) {
  if (spec.collection.length <= 0) return;

  var appendRoom = function (room) {
    this.menu.append(this.toMenuItem(room));
  }.bind(this);

  this.menu.append(this.toLabel(spec.label));
  spec.collection.slice(0, 5).forEach(appendRoom);
  this.menu.append(new gui.MenuItem({ type: 'separator' }));
};

TrayMenu.prototype.toMenuItem = function (room) {
  return new gui.MenuItem({
    label: room.get('name'),
    click: function () {
      events.emit('traymenu:clicked', room.get('url'));
    }
  });
};

TrayMenu.prototype.toLabel = function (name) {
  return new gui.MenuItem({
    label: name.toUpperCase(),
    enabled: false
  });
};

TrayMenu.prototype.get = function () {
  return this.menu;
};

module.exports = TrayMenu;
