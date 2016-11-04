'use strict';

var menu = new nw.Menu();

function Menu(cutLabel, copyLabel, pasteLabel) {
    var cut = new nw.MenuItem({
      label: cutLabel || "Cut",
      click: function() {
        document.execCommand("cut");
      }
    });

    var copy = new nw.MenuItem({
      label: copyLabel || "Copy",
      click: function() {
        document.execCommand("copy");
      }
    });

    var paste = new nw.MenuItem({
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
