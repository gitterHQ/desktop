'use strict';

var log = require('loglevel');
log.setLevel('debug');

// @CONST
var CLIENT = require('./utils/client-type');

var manifest = require('./package.json');
var gui = require('nw.gui');
var pkg = require('./package.json');
var Gitter = require('gitter-realtime-client');
var os = require('os');
var path = require('path');

var argv = require('yargs')(gui.App.argv).argv;
var Promise = require('bluebird');
var semver = require('semver');
var autoUpdate = require('./utils/auto-update');
var AutoLaunch = require('auto-launch');
var fs = require('fs');
var deleteFile = Promise.promisify(fs.unlink);

var settings = require('./utils/settings');
var notifier = require('./utils/notifier');
var events = require('./utils/custom-events');
var quitApp = require('./utils/quit-app');

// components
var MENU_ITEMS = require('./components/menu-items');
var CustomTray = require('./components/tray');
var CustomMenu = require('./components/menu');
var TrayMenu = require('./components/tray-menu');

var LoginView = require('./lib/login-view');

var checkFileExistSync = function(target) {
  try {
    return !!fs.statSync(target);
  }
  catch(err) {
    // swallow the error
  }

  return false;
};

process.on('uncaughtException', function (err) {
  log.error('Caught exception: ' + err);
  log.error(err.stack);
  process.exit(1);
});

var win;
var mainWindow; // this is the chat window (logged in)
var mainWindowFocused = false; // Focus tracker. NWK doesn't have a way to query if the window is in focus
var loginView; // log in form



// Remove the legacy v2.4.0- startup location
// so that we don't have duplicates
// FIXME: remove after August 2016
if(CLIENT === 'win') {
  var windowsStartupPathPiece = 'Microsoft/Windows/Start Menu/Programs/Startup';
  var startupBasePaths = [];
  if(process.env.SYSTEMDRIVE) {
    startupBasePaths.push(path.join(process.env.SYSTEMDRIVE, './ProgramData', windowsStartupPathPiece));
  }
  if(process.env.APPDATA) {
    startupBasePaths.push(path.join(process.env.APPDATA, windowsStartupPathPiece));
  }
  if(process.env.LOCALAPPDATA) {
    startupBasePaths.push(path.join(process.env.LOCALAPPDATA, windowsStartupPathPiece));
  }

  startupBasePaths.forEach(function(startupBasePath) {
    var startupPath = path.join(startupBasePath, './Gitter.lnk');

    deleteFile(startupPath)
      .then(function() {
        log.info('Deleted legacy startup file:', startupPath);
      })
      .catch(function(err) {
        // Ignore the file not being found
        if(err.code !== 'ENOENT') {
          log.error('Failed to cleanup legacy startup file:', startupPath, err, err.stack);
        }
      });
  });
}
var autoLauncher = new AutoLaunch({
  name: 'Gitter'
});


(function () {
  log.info('execPath:', process.execPath);
  log.info('argv:', argv);
  log.info('version:', pkg.version);

  var legacyCurrentInstallPath;
  var legacyNewUpdaterExecutablePath;
  if (argv._.length === 2 && checkFileExistSync(argv._[0]) && checkFileExistSync(argv._[1])) {
    // This only happens if we have a pre v3.0.0 desktop app attempting to update to v3+
    // FIXME: remove after August 2016
    legacyCurrentInstallPath = argv._[0];
    legacyNewUpdaterExecutablePath = argv._[1];
  }

  var currentInstallPath = argv['current-install-path'] || legacyCurrentInstallPath;
  var newUpdaterExecutablePath = argv['new-executable'] || legacyNewUpdaterExecutablePath;

  var hasGoodParamsToUpdate = currentInstallPath && newUpdaterExecutablePath;
  log.info('Are we going into update mode? ' + (hasGoodParamsToUpdate ? 'Yes' : 'No') + '.', currentInstallPath, newUpdaterExecutablePath);
  if(hasGoodParamsToUpdate) {
    log.info('I am a new app in a temp dir');
    log.info('I will overwrite the old app with myself and then restart it');

    return autoUpdate.overwriteOldApp(currentInstallPath, newUpdaterExecutablePath);
  }

  initGUI(); // intialises menu and tray, setting up event listeners for both
  initApp();
  autoUpdate.poll();

  autoLauncher.isEnabled(function(enabled) {
    if(enabled !== settings.launchOnStartup) {
      autoLauncher[(settings.launchOnStartup ? 'enable' : 'disable')](function(err) {
        if(err) {
          throw err;
        }
      });
    }
  });

})();

// reopen window when they are all closed
function reopen() {
  if (!mainWindow) {
    if (!settings.token) {
      return showAuth();
    }
    return showLoggedInWindow();
  }
}

function setupTray(win) {
  var customTray = new CustomTray();
  win.tray = customTray.get();

  var roomMenu = new TrayMenu();
  win.tray.menu = roomMenu.get();

  // FIXME: temporary fix, needs to be repainted
  events.on('traymenu:updated', function() {
    win.tray.menu = roomMenu.get();
  });

  // Set unread badge
  events.on('traymenu:unread', function(unreadCount) {
    win.setBadgeLabel(unreadCount.toString());
  });

  // Remove badge
  events.on('traymenu:read', function() {
    win.setBadgeLabel('');
  });

  if (CLIENT !== 'osx') {
    win.tray.on('click', reopen);
  }
}

// initialises and adds listeners to the top level components of the UI
function initGUI() {
  log.trace('initGUI()');
  win = gui.Window.get();

  // Set up tray(OSX)/menu bar(Windows)
  if(settings.showInMacMenuBar) {
    setupTray(win);
  }

  events.on('settings:change:showInMacMenuBar', function(newValue) {
    if(newValue) {
      setupTray(win);
    }
    else if(win.tray) {
      win.tray.remove();
    }
  });

  gui.App.on('reopen', reopen); // When someone clicks on the dock icon, show window again.

  win.on('close', function (evt) {
    log.trace('win:close');
    if (evt === 'quit') {
      quitApp();
    } else {
      this.close(true);
    }
  });
}

// establishes faye connection and manages signing in/out flow
function initApp() {

  var token = settings.token;

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

  events.on('settings:change:launchOnStartup', function(newValue) {
    autoLauncher[(newValue ? 'enable' : 'disable')](function(err) {
      if(err) throw err;
    });
  });

  // Realtime client to keep track of the user rooms.
  var client = new Gitter.RealtimeClient({
    authProvider: function(cb) {
      return cb({ token: token, client: CLIENT });
    }
  });

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
          title: msg.title,
          message: msg.text,
          icon: msg.icon,
          click: function() {
            log.info('Notification user_notification clicked. Moving to', msg.link);
            navigateWindowTo(msg.link);
          }
        });
      }
    });
  });

  if (settings.launchHidden !== true) {
    showLoggedInWindow();
  }
}

function showAuth() {
  if (loginView) return;

  // whitelists app:// protocol used for the oAuth callback
  gui.App.addOriginAccessWhitelistEntry('https://gitter.im/', 'app', 'gitter', true);

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
    // When a mac app starts up, it doesn't have focus
    // When a Windows or Linux app starts up, it has focus
    if(CLIENT !== 'osx') {
      mainWindowFocused = true;
    }

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
