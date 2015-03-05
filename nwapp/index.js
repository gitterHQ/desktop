'use strict';

var log = require('loglevel');
log.setLevel('debug');

// @CONST
var CLIENT = require('./utils/client-type');
var CONFIG = require('./utils/config');

var gui = require('nw.gui');
var pkg = require('./package.json');
var Gitter = require('gitter-realtime-client');

var settings = require('./utils/settings');
var notifier = require('./utils/notifier');
var events = require('./utils/custom-events');
var autoUpdate = require('./utils/auto-update');

// components
var MENU_ITEMS = require('./components/menu-items');
var CustomTray = require('./components/tray');
var CustomMenu = require('./components/menu');
var TrayMenu = require('./components/tray-menu');

var LoginView = require('./lib/login-view');

process.on('uncaughtException', function (err) {
  log.error('Caught exception: ' + err);
  log.error(err.stack);
  process.exit(1);
});

var win;
var mainWindow; // this is the chat window (logged in)
var mainWindowFocused; // Focus tracker. Yes, that's right, NWK doesn't have a way to query if the window is in focus
var loginView; // log in form

// initialisation as a IIFE
(function () {
  log.info('Gitter' + pkg.version);
  gui.App.addOriginAccessWhitelistEntry(CONFIG.basepath, 'app', 'gitter', true); // whitelists app:// protocol used for the oAuth callback
  // gui.App.setCrashDumpDir(gui.App.dataPath);

  if (autoUpdate.isInProgress()) {
    log.info('Update in progress...');
    return autoUpdate.finishUpdate();
  }

  initGUI(); // intialises menu and tray, setting up event listeners for both

  if (changedEnvironment()) { // TODO: maybe move this out, it will only be true in dev mode
    flushCookies()
      .then(function () {
        settings.token = null;
        settings.lastrun = CONFIG.OAUTH_KEY; // FIXME
        initApp();
      });
  } else {
    initApp();
  }
})();

// returns a boolean representing whether we are still on the
function changedEnvironment() {
  return settings.lastrun !== CONFIG.OAUTH_KEY;
}

// reopen window when they are all closed
function reopen() {
  if (!mainWindow) {
    if (!settings.token) {
      return showAuth();
    }
    return showLoggedInWindow();
  }
}

// initialises and adds listeners to the top level components of the UI
function initGUI() {
  log.trace('initGUI()');
  win = gui.Window.get();
  win.tray = CustomTray.get();

  var roomMenu = new TrayMenu();
  win.tray.menu = roomMenu.get();

  // FIXME: temporary fix, needs to be repainted
  events.on('traymenu:updated', function () {
    win.tray.menu = roomMenu.get();
  });

  // Set unread badge
  events.on('traymenu:unread', function (unreadCount) {
    win.setBadgeLabel(unreadCount.toString());
  });

  // Remove badge
  events.on('traymenu:read', function () {
    win.setBadgeLabel('');
  });

  if (CLIENT !== 'osx') {
    win.tray.on('click', reopen);
  }

  gui.App.on('reopen', reopen); // When someone clicks on the dock icon, show window again.

  win.on('close', function (evt) {
    log.trace('win:close');
    if (evt === 'quit') {
      gui.App.quit();
    } else {
      this.close(true);
    }
  });
}

// establishes faye connection and manages signing in/out flow
function initApp() {

  var token = settings.token;

  if (!CONFIG.OAUTH_KEY || !CONFIG.OAUTH_SECRET) {
    return;
  }

  // user not logged in
  if (!token) {
    showAuth();
    return;
  }

  events.emit('user:signedIn');
  events.on('traymenu:clicked', navigateWindowTo);
  events.on('traymenu:signout', signout);
  events.on('menu:signout', signout);

  events.on('menu:toggle:next', function () {
    if (!mainWindow) return;
    var target = mainWindow.window.document.getElementById('mainframe');
    var nextActive = mainWindow.eval(target, "document.cookie.indexOf('gitter_staging=staged');") >= 0;
    if (nextActive) {
      settings.next = false;
      mainWindow.eval(target, "document.cookie='gitter_staging=none;domain=.gitter.im;path=/;expires=' + new Date(Date.now() + 31536000000).toUTCString(); location.reload();");
    } else {
      settings.next = true;
      mainWindow.eval(target, "document.cookie='gitter_staging=staged;domain=.gitter.im;path=/;expires=' + new Date(Date.now() + 31536000000).toUTCString(); location.reload();");
    }
  });

  events.on('menu:toggle:devtools', toggleDeveloperTools);

  events.on('user:signedOut', function () {
    client.disconnect();
    client = null;
  });

  // Realtime client to keep track of the user rooms.
  var client = new Gitter.RealtimeClient({ authProvider: function(cb) {
    return cb({ token: token, client: CLIENT });
  }});
  var rooms = new Gitter.RoomCollection([], { client: client, listen: true });

  client.on('change:userId', function (userId) {
    events.emit('realtime:connected', rooms);
    log.trace('realtime connected()');

    if (!client) return;
    log.trace('attempting to subscribe()');
    var subscription = client.subscribe('/v1/user/' + userId, function (msg) {
      if (mainWindowFocused || !msg.notification) return;

      if (msg.notification === 'user_notification') {
        notifier({
          title:   msg.title,
          message: msg.text,
          roomId:  msg.troupeId,
          link:    msg.link,
          click: function () {
            navigateWindowTo(msg.link);
          }
        });
      }
    });
  });

  showLoggedInWindow();
}

// displays authentication window
function showAuth() {
  log.trace('showAuth()');
  if (loginView) return;

  loginView = new LoginView(gui.Window);

  loginView.on('accessTokenReceived', function(accessToken) {
    log.trace('authWindow:loaded');
    settings.token = accessToken;
    initApp(accessToken);
    loginView.destroy();
  });

  loginView.on('destroy', function() {
    loginView = null;
  });
}

function signout() {
  log.trace('signout()');

  flushCookies()
    .then(function () {
      settings.token = null;

      // only close the window if we can, otherwise app may crash
      if (mainWindow) {
        mainWindow.close(true);
      }

      showAuth();

      events.emit('user:signedOut');
    });
}

/**
 * showLoggedInWindow() handles the logic for displaying loggedin.html
 *
 * exec   - String, code to be evaluated once the iFrame has loaded.
 * @void
 */
function showLoggedInWindow(exec) {
  log.trace('showLoggedInWindow()');

  mainWindow = gui.Window.get(
    window.open('loggedin.html', {
      focus: true
    })
  );

  mainWindow.setMinimumSize(400, 200);

  var menu = new CustomMenu({
    items: MENU_ITEMS,
    label: 'Gitter',
    filter: function (item) {

      if (item.support && item.support.indexOf(CLIENT) < 0 ) {
        return false;
      }

      if (item.auth) {
        return item.auth && !!settings.token;
      }

      return true;
    }
  });

  mainWindow.menu = menu.get();

  // FIXME: temporary fix, needs to be repainted
  events.on('menu:updated', function () {
    if (mainWindow) {
      mainWindow.menu = menu.get();
    }
  });

  mainWindow.on('loaded', function () {
    mainWindowFocused = true;
    if (exec) {
      var iFrame = mainWindow.window.document.getElementById('mainframe');
      iFrame.onload = function () {
        mainWindow.eval(iFrame, exec);
      };
    }
  });

  mainWindow.on('closed', function () {
    log.trace('mainWindow:closed');
    mainWindow = null;
    mainWindowFocused = false;
  });

  mainWindow.on('focus', function () {
    log.trace('mainWindow:focus');
    mainWindowFocused = true;
    // TODO: Remove this hack
    var toExec = "var cf = document.getElementById('content-frame'); if (cf) cf.contentWindow.dispatchEvent(new Event('focus'));";
    mainWindow.eval(mainWindow.window.document.getElementById('mainframe'),toExec);
  });

  mainWindow.on('blur', function () {
    log.trace('mainWindow:blur');
    mainWindowFocused = false;
    // TODO: Remove this hack
    var toExec = "var cf = document.getElementById('content-frame'); if (cf) cf.contentWindow.dispatchEvent(new Event('blur'));";
    mainWindow.eval(mainWindow.window.document.getElementById('mainframe'),toExec);
  });

  mainWindow.on('new-win-policy', function (frame, url, policy) {
    gui.Shell.openExternal(url);
    policy.ignore();
  });
}

function toggleDeveloperTools() {
  log.trace('toggleDeveloperTools()');
  if (mainWindow.isDevToolsOpen()) {
    mainWindow.closeDevTools();
  } else {
    mainWindow.showDevTools();
  }
}

function navigateWindowTo(uri) {
  var toExec = "window.gitterLoader('" + uri + "');";

  if (!mainWindow) {
    // load window and then navigate
    return showLoggedInWindow(toExec);
  }

  // simply navigate as we have window
  mainWindow.eval(mainWindow.window.document.getElementById('mainframe'), toExec); // FIXME: this is dupe code
  mainWindow.focus();
  mainWindow.show();
}

function deleteCookie(cookie) {
  return new Promise(function (resolve, reject) {
    var cookie_url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;

    win.cookies.remove({ url: cookie_url, name: cookie.name }, function (result) {
      if (result) {
        result = result[0];
        log.info('cookie removed:' + result.name);
        resolve(result);
      } else {
        log.error('failed to remove cookie');
        reject(new Error('Failed to delete cookie.'));
      }
    });
  });
}

function fetchAllCookies() {
  log.trace('fetchAllCookies()');
  return new Promise(function (resolve) {
    win.cookies.getAll({}, function (cookies) {
      resolve(cookies);
    });
  });
}

function flushCookies() {
  return new Promise(function (resolve) {
    fetchAllCookies()
      .then(function (cookies) {
        log.debug('got ' + cookies.length + ' cookies');
        return Promise.all(cookies.map(deleteCookie));
      })
      .then(function () {
        log.info('deleted all cookies');
        resolve(true);
      })
      .catch(function (err) {
        log.error(err.stack);
      });
  });
}

autoUpdate.pollForUpdates();
setInterval(autoUpdate.pollForUpdates, 30*60*1000);
