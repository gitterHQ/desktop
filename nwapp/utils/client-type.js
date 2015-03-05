'use strict';

var os = require('os');

module.exports = (function () {
  var platform = os.platform();
  if (platform.match(/darwin/)) return 'osx';
  if (platform.match(/^win/)) return 'win';
  if (platform.match(/linux/)) return 'linux';
  return os;
})();
