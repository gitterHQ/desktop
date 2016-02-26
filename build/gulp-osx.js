/*jshint globalstrict:true, trailing:false, unused:true, node:true */
"use strict";

var rimraf = require('rimraf');
var fs = require('fs');
var nwDownloader = require('./node-webkit-downloader');
var copy = require('ncp');
var shell = require('gulp-shell');
var zip = require('gulp-zip');
var template = require('gulp-template');
var rename = require('gulp-rename');
var plist = require('plist');
var version = require('../nwapp/package.json').version;

var install = function(gulp) {
  gulp.task('osx:clean', ['osx:clean:buildDir', 'osx:clean:uploadDir']);

  gulp.task('osx:clean:buildDir', function(cb) {
    rimraf('output/osx', cb);
  });

  gulp.task('osx:clean:uploadDir', function(cb) {
    rimraf('output/update.gitter.im/osx', cb);
  });



  gulp.task('osx', ['osx:dmg', 'osx:autoupdate-zip', 'osx:latest-redirect']);

  gulp.task('osx:dmg', ['osx:app', 'osx:clean:uploadDir'], shell.task([
    'mkdir -p output/update.gitter.im/osx',
    'build/create-dmg/create-dmg --icon "Gitter" 311 50 ' +
                          '--icon-size 32 ' +
                          '--app-drop-link 311 364 ' +
                          '--window-size 622 683 ' +
                          '--volname "Gitter" ' +
                          '--volicon "build/icons/AppIcon.icns" ' +
                          '--background "build/icons/dmg-bg.png" ' +
                          '"output/update.gitter.im/osx/Gitter-' + version + '.dmg" ' +
                          '"output/osx/Gitter.app"'
  ]));

  gulp.task('osx:autoupdate-zip', ['osx:app', 'osx:clean:uploadDir'], function() {
    return gulp.src('output/osx/Gitter.app')
      .pipe(zip('osx.zip'))
      .pipe(gulp.dest('output/update.gitter.im/osx'));
  });

  gulp.task('osx:latest-redirect', ['osx:clean:uploadDir'],  function() {
    return gulp.src('build/latest-template.html')
      .pipe(template({ pathname: '/osx/Gitter-' + version + '.dmg' }))
      .pipe(rename('latest'))
      .pipe(gulp.dest('output/update.gitter.im/osx'));
  });

  gulp.task('osx:app', ['osx:app.nw', 'osx:icons', 'osx:plist'], shell.task([
    'codesign --force ' +
             '--sign "Developer ID Application: Troupe Technology Limited (A86QBWJ43W)" ' +
             'output/osx/Gitter.app/Contents/Frameworks/* ' +
             'output/osx/Gitter.app',
    'codesign --verify "output/osx/Gitter.app"'
  ]));

  gulp.task('osx:app.nw', ['osx:app-stub'], function() {
    return gulp.src('nwapp/**/*')
      .pipe(gulp.dest('output/osx/Gitter.app/Contents/Resources/app.nw'));
  });

  gulp.task('osx:icons', ['osx:app-stub'], function(cb) {
    copy('build/icons/AppIcon.icns', 'output/osx/Gitter.app/Contents/Resources/nw.icns', cb);
  });

  gulp.task('osx:plist', ['osx:app-stub'], function(cb) {
    fs.readFile('output/osx/Gitter.app/Contents/Info.plist', { encoding: 'utf8' }, function(err, xml) {
      if(err) return cb(err);

      var info = plist.parse(xml);
      info.CFBundleDisplayName = 'Gitter';
      info.CFBundleName = 'Gitter';
      info.CFBundleVersion = version;
      info.CFBundleShortVersionString = version;
      info.NSHumanReadableCopyright = 'Copyright © 2013-' + new Date().getFullYear() + ' Troupe Technology Limited. All rights reserved.';
      info.CFBundleIdentifier = 'com.gitter.desktop';
      info.CFBundleDocumentTypes = [];
      info.UTExportedTypeDeclarations = [];

      fs.writeFile('output/osx/Gitter.app/Contents/Info.plist', plist.build(info), cb);

    });
  });

  gulp.task('osx:app-stub', ['osx:get-node-webkit', 'osx:clean:buildDir'], function() {
    return gulp.src('output/node-webkit/node-webkit-v0.11.6-osx-x64/node-webkit.app/**/*')
      .pipe(gulp.dest('output/osx/Gitter.app'));
  });

  gulp.task('osx:get-node-webkit', function(cb) {
    nwDownloader('http://dl.nwjs.io/v0.11.6/node-webkit-v0.11.6-osx-x64.zip', 'output/node-webkit', cb);
  });
};

module.exports = {
  install: install
};
