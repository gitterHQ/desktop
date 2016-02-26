/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var devDependencies = Object.keys(require('../package.json').devDependencies);
var skipDevDependencies = devDependencies.map(function(devDependency) {
  return '!node_modules/' + devDependency;
});

module.exports = ['**/*', '!build', '!output', '!secrets', '!node_modules/.bin'].concat(skipDevDependencies);