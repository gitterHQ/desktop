'use strict';

var gui = window.require('nw.gui');
var menu = new gui.Menu();

function Menu(cutLabel, copyLabel, pasteLabel) {
    var cut = new gui.MenuItem({
      label: cutLabel || "Cut",
      click: function() {
        document.execCommand("cut");
      }
    });

    var copy = new gui.MenuItem({
      label: copyLabel || "Copy",
      click: function() {
        document.execCommand("copy");
      }
    });

    var paste = new gui.MenuItem({
      label: pasteLabel || "Paste",
      click: function() {
        document.execCommand("paste");
      }
    })
  ;

  menu.append(cut);
  menu.append(copy);
  menu.append(paste);

  return menu;
}


module.exports = new Menu();

