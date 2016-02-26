/* jslint node: true */
"use strict";

var request = require('request');
var fs = require('fs');
var path = require('path');
var urlParser = require('url').parse;
var DecompressZip = require('decompress-zip');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = function(url, outputDir, cb) {
  var zip = outputDir + '/' + url.split('/').pop();
  var unpacked = zip.slice(0, -4);

  fs.stat(unpacked, function(err, stats) {
    if (!err && stats.isDirectory) {
    // if already unpacked, do nothing
      return cb();
    }

    mkdirp(outputDir, function(err) {
      if (err) return cb(err);

      download(url, zip, function(err) {
        if (err) return cb(err);

        unpack(zip, outputDir, cb);
      });
    });
  });
};

function download(url, zip, cb) {
  var writeStream = fs.createWriteStream(zip);

  writeStream.on('finish', function() {
    cb();
  });

  request(url).pipe(writeStream);
}

function unpack(zip, outputDir, cb) {
  var unzipper = new DecompressZip(zip);
  var files = [];

  unzipper.on('error', cb);

  unzipper.on('extract', function(log) {
    // fix exec permissions
    async.parallel(files.map(function(file) {
      return function(cb) {
        fs.chmod(path.join(outputDir, file.path), file.mode, cb);
      };
    }), cb);
  });

  unzipper.extract({
    path: outputDir,
    filter: function(file) {
      files.push(file);
      return true;
    }
  });
}
