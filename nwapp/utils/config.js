/* global OAUTH: true */
'use strict';

var gui = window.require('nw.gui');

/*
 * The `OAUTH` object is defined in a nwsnapshot binary that is only
 * added during the production build. Used for obfuscation.
 */
try {
  OAUTH = OAUTH;
} catch (refErr) {

}

var key = (process.env.OAUTH_KEY || typeof OAUTH !== 'undefined' && OAUTH.key || '').trim();
var secret = (process.env.OAUTH_SECRET || typeof OAUTH !== 'undefined' && OAUTH.secret || '').trim();

if (!key || !secret) {
  /*var win = */gui.Window.get(window.open('../welcome.html')); // WC: instructions for developers
  throw new Error('You must provide a key. Keys can be obtained from https://developer.gitter.im');
}

module.exports = {
  OAUTH_KEY:     key,
  OAUTH_SECRET:  secret,
  basepath:      'https://gitter.im/',
  redirect_uri:  'app://gitter/oauth.html',
};
