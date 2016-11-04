var log = require('loglevel');
var events = require('./custom-events');

// We wrap their quit method as it doesn't emit a `quit` or `close` event that
//  we can listen to and do any proper cleanup
module.exports = function() {
	log.info('Quitting app, app:quit');
	events.emit('app:quit');

	nw.App.quit();
};
