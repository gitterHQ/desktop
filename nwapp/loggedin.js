var gui = require('nw.gui');
var win = gui.Window.get();
var frame = win.window.document.getElementById('mainframe');
var settings = require('./utils/settings');
var version = require('./package.json').version;

// FIXME This is a hack that allows us to send auth token in the user-agent header.
// The nwUserAgent will be used for the iframe and all the requests that originate inside it
frame.nwUserAgent = navigator.userAgent + ' Gitter/' + version + ' Gitter Token/' + settings.token;

frame.src = 'https://gitter.im/';
