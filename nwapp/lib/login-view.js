'use strict';

var log = require('loglevel');
var config = require('../utils/config');
var OAuth2 = require('oauth').OAuth2;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var oauthKey = config.OAUTH_KEY;
var oauthSecret = config.OAUTH_SECRET;

var clientId = config.OAUTH_KEY;
var clientSecret = config.OAUTH_SECRET;
var baseSite = config.basepath;
var authorizePath = 'login/oauth/authorize';
var accessTokenPath = 'login/oauth/token';
var redirectUri = 'app://gitter/oauth.html';


var LoginView = function(rootWindow) {
  var self = this;
  var auth = new OAuth2(clientId, clientSecret, baseSite, authorizePath, accessTokenPath);
  var authUrl = auth.getAuthorizeUrl({ redirect_uri: redirectUri, response_type: 'code' });

  // new window for login/oauth
  this.oauthWindow = rootWindow.open(authUrl, {
    // hide page loading
    show: false,
    toolbar: false,

    // just big enough to show github login without scrollbars
    width: 1024,
    height: 640,
  });

  this.oauthWindow.on('document-end', function(accessToken) {
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
        log('oauth error: ' + JSON.stringify(err));
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
