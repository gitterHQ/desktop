/* jslint node: true */
"use strict";

var gulp = require('gulp');
var glob = require('glob');
var rimraf = require('rimraf');
var version = require('./nwapp/package.json').version;
var async = require('async');
var fs = require('fs');
var s3 = require('s3');

require('./build/gulp-osx').install(gulp);

gulp.task('clean', function(cb) {
  rimraf('output', cb);
});

gulp.task('clean:autoupdate-manifest', function(cb) {
  rimraf('output/update.gitter.im/desktop', cb);
});

gulp.task('default', ['osx', 'autoupdate-manifest']);

gulp.task('autoupdate-manifest', ['clean:autoupdate-manifest'], function() {
  return gulp.src('package.json')
    .pipe(gulp.dest('output/update.gitter.im/desktop/package.json'));
});


var filesToPublish = [
  'output/update.gitter.im/osx/Gitter-' + version + '.dmg',
  'output/update.gitter.im/osx/osx.zip',
  // 'output/update.gitter.im/osx/latest',

  'output/update.gitter.im/win/GitterSetup-' + version + '.exe',
  'output/update.gitter.im/win/win32.zip',
  'output/update.gitter.im/win/latest',

  'output/update.gitter.im/linux32/gitter_' + version + '_i386.deb',
  'output/update.gitter.im/linux32/latest',
  'output/update.gitter.im/linux64/gitter_' + version + '_amd64.deb',
  'output/update.gitter.im/linux64/latest',

  'output/update.gitter.im/desktop/package.json'
];


gulp.task('publish', ['publish:check'], function(cb) {
  var s3Client = s3.createClient();
  var progressPercent = -1;

  var uploader = s3Client.uploadDir({
    localDir: 'output/update.gitter.im',
    deleteRemoved: false,
    s3Params: {
      Bucket: 'update.gitter.im',
      Prefix: 'nwdev/trevorah/update_gitter_im/',
      CacheControl: 'public, max-age=0, no-cache',
      ACL: 'public-read'
    }
  });

  process.stdout.write('Uploading...');

  uploader.on('progress', function() {
    var percent = Math.round(uploader.progressAmount / uploader.progressTotal * 100);

    if (percent % 5 === 0 && percent > progressPercent) {
      progressPercent = percent;
      process.stdout.write(' ' + progressPercent + '%');
    }
  });

  uploader.on('error', cb);

  uploader.on('end', function(/*results*/) {
    process.stdout.write(' done!\n');
    cb();
  });
});

gulp.task('publish:check', ['publish:remove-cruft'], function(cb) {
  return async.parallel(filesToPublish.map(function(file) {
    return function(cb) {
      fs.stat(file, function(err) {
        if(err) return cb(new Error(file + ' missing. Nothing can be published without this file.'));
        
        cb();
      });
    };
  }), cb);
});

gulp.task('publish:remove-cruft', function(cb) {
  glob('output/update.gitter.im/**/*', { nodir: true, dot: true }, function(err, files) {
    if (err) return cb(err);

    var cruft = files.filter(function(file) {
      return filesToPublish.indexOf(file) === -1;
    });

    return async.parallel(cruft.map(function(file) {
      return function(cb) {
        console.log('Removing cruft: rm', file);
        fs.unlink(file, cb);
      };
    }), cb);
  });
});
