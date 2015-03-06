'use strict';

/* Utility class for tracing calls */
var log = require('loglevel');

function wrapFunction(name, fn) {
  if (typeof fn !== 'function') throw new Error('Cannot wrap ' + fn);
  return function traceWrapper() {
    log.trace('enter::' + name);
    try {
      var args = Array.prototype.slice.apply(arguments);
      return fn.apply(this, args);
    } catch(e) {
      log.trace('error::' + e);
      throw e;
    } finally {
      log.trace('exit::' + name);
    }
  };
}

function wrapObject(object, name) {
  if (object.___traced) return object;

  // Attempt to figure out the name
  if (!name) name = object.constructor && object.constructor.name;

  Object.defineProperty(object, '___traced', { configurable: true, enumerable: false, value: true });
  var o = {}; // Base object

  Object.keys(object).forEach(function(k) {
    if (o.hasOwnProperty(k)) return;

    if (typeof object[k] === 'function') {
      object[k] = wrapFunction(name + '::' + k, object[k]);
    }
  });
  if (object.prototype) {
    wrapObject(object.prototype, name);
  }

  return object;
}

module.exports = {
  wrapFunction: wrapFunction,
  wrapObject: wrapObject,
};
