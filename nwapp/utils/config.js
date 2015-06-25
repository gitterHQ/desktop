/* global OAUTH: true */
'use strict';

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
  throw new Error('You must provide a key. Keys can be obtained from https://developer.gitter.im');
}

module.exports = {
  OAUTH_KEY:     key,
  OAUTH_SECRET:  secret
};
