/* jshint node: true, browser: true */
'use strict';

var log = require('../utils/log');
var events = require('../utils/custom-events');
var gui = window.require('nw.gui');
var CLIENT = require('../utils/client-type');

// recursively assembles menus and sub-menus
function assembleMenu(items, parent) {
  // log('CustomMenu:assembleMenu() ==============');
  var fold;

  parent = parent ? parent : new gui.Menu();

  items.forEach(function (item) {
    // means that we have a submenu
    if (item.content && item.content.length > 0) {
      var submenu = new gui.Menu();
      fold = assembleMenu(item.content, submenu);
    } else {
      fold = new gui.MenuItem(item);
    }

    if (fold.type === 'contextmenu') {
      item.submenu = fold;
      fold = new gui.MenuItem(item);
    }

    if (item.index && CLIENT === 'osx') {
      parent.insert(fold, item.index); // inserting at specified index
    } else {
      parent.append(fold); // just append
    }
  });

  return parent;
}

function CustomMenu(spec) {

  this.menu = new gui.Menu({ type: 'menubar' });
  this.items = spec.items || [];
  this.filter = spec.filter;
  this.label = spec.label;

  events.on('user:signedIn', this.build.bind(this));
  events.on('user:signedOut', this.build.bind(this));
  events.on('settings:saved', this.build.bind(this));

  this.build(); // initial render

  return this;
}

// FIXME: this function will probably not work for all platforms
CustomMenu.prototype.clear = function () {
  // log('CustomMenu:clear() =================');
  for (var i = this.menu.items.length - 1; i >= 0; i--) {
    this.menu.removeAt(i);
  }
};

CustomMenu.prototype.build = function () {
  // log('CustomMenu:build() =================');
  this.clear(); // clear the menu on every "render"
  var filteredItems = this.items;

  if (this.filter && typeof this.filter === 'function') {
    filteredItems = this.items.filter(this.filter);
  }

  // note that we have different targets based on OS
  switch (CLIENT) {
    case 'osx':
      this.menu.createMacBuiltin(this.label);
      assembleMenu(filteredItems, this.menu.items[0].submenu);
      break;
    default:
      var sub = new gui.Menu();
      assembleMenu(filteredItems, sub);
      this.menu.append(new gui.MenuItem({
        label: this.label,
        submenu: sub
      }));
      break;
  }
  events.emit('menu:updated');
};

CustomMenu.prototype.get = function () {
  return this.menu;
};

module.exports = CustomMenu;
