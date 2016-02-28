'use strict';

var log = require('loglevel');
var oauthJson = { osx: {}, win: {}, linux: {} };
try {
  oauthJson = require('../oauth.json');
} catch (e) {
  log.warn('nwapp/oauth.json not found. Hopefully OAUTH_KEY and OAUTH_SECRET are set...');
}

// See https://github.com/nwjs/nw.js/wiki/window#synopsis
var gui = global.window.nwDispatcher.requireNwGui();
var os = require('../utils/client-type');
var OAuth2 = require('oauth').OAuth2;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var clientId = process.env.OAUTH_KEY || oauthJson[os].key || '';
var clientSecret = process.env.OAUTH_SECRET || oauthJson[os].secret || '';
var baseSite = 'https://gitter.im/';
var authorizePath = 'login/oauth/authorize';
var accessTokenPath = 'login/oauth/token';
var redirectUri = 'app://gitter/oauth.html';


var LoginView = function(rootWindow) {
  var self = this;

  if (!clientId) throw new Error('You must provide an oauth key. Keys can be obtained from https://developer.gitter.im');

  var auth = new OAuth2(clientId, clientSecret, baseSite, authorizePath, accessTokenPath);
  var authUrl = auth.getAuthorizeUrl({ redirect_uri: redirectUri, response_type: 'code' });

  // new window for login/oauth
  this.oauthWindow = rootWindow.open(authUrl, {
    // hide page loading
    show: false,
    toolbar: false,
    icon: 'img/logo.png',

    // just big enough to show github login without scrollbars
    width: 1024,
    height: 640
  });
  var mb = new gui.Menu({
    type: 'menubar'
  });
  if(os === 'osx') {
    mb.createMacBuiltin('Gitter', {
      hideEdit: false
    });
  }
  gui.Window.get().menu = mb;

  this.oauthWindow.on('document-end', function() {
    // gitter login page finished loading visible bits
    self.oauthWindow.show();
    self.oauthWindow.focus();
  });

  this.oauthWindow.on('close', function() {
    self.destroy();
  });

  this.oauthWindow.on('error', function(err) {
    log.error('oauth error: ' + JSON.stringify(err));
    self.destroy();
  });


  this.oauthWindow.on('codeReceived', function(code) {
    // login page no longer needed
    self.oauthWindow.hide();

    auth.getOAuthAccessToken(code, { redirect_uri: redirectUri, grant_type: 'authorization_code' }, function(err, accessToken) {
      if (err) {
        log.error('oauth error: ' + JSON.stringify(err));
        self.destroy();
        return;
      }

       self.emit('accessTokenReceived', accessToken);
    });
  });
};

util.inherits(LoginView, EventEmitter);

LoginView.prototype.destroy = function() {
  // skips all on close listeners
  this.oauthWindow.close(true);
  this.emit('destroy');
};

module.exports = LoginView;
