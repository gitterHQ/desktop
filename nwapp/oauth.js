/* jshint node: true, browser: true */
'use strict';

var log = window.require('./utils/log');
var CONFIG = window.require('./utils/config');
var gui = window.require('nw.gui');
var win = gui.Window.get();

var OAuth2 = require('oauth').OAuth2;
var auth = new OAuth2(CONFIG.OAUTH_KEY, CONFIG.OAUTH_SECRET, CONFIG.basepath, 'login/oauth/authorize', 'login/oauth/token');

var code = win.window.location.search.match(/code=(\w+)$/);

if (code) {
  var params = { redirect_uri: CONFIG.redirect_uri, grant_type: 'authorization_code'} ;
  auth.getOAuthAccessToken(code[1], params, function (err, access_token, refresh_token) {
    if (err) {
      return win.emit('oauth:error', { token: access_token });
    }
    win.emit('oauth:success', { token: access_token });
    code = null; // FIXME: this is necessary, but why?
  });
} else {
  var url = auth.getAuthorizeUrl({ redirect_uri: CONFIG.redirect_uri, response_type: 'code' }); // FIXME: if Gitter is down, a blank screen shows.
  win.window.location = url;
}
