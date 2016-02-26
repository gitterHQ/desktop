

// http://dl.nwjs.io/v0.11.6/node-webkit-v0.11.6-linux-x64.tar.gz
var nwappGlob = require('./nwapp-glob');


var install = function(gulp) {
  gulp.task('linux64', ['linux64:deb', 'linux64:latest-redirect'], function() {});


  gulp.task('linux64:deb', ['linux64:bin',
                            'linux64:desktop-manifest',
                            'linux64:after-install-script',
                            'linux64:after-remove-script',
                            'linux64:icon'],
    shell('fpm -s dir ' +
              '-t deb ' +
              '--architecture amd64 ' +
              '--name gitter ' +
              '--category Utility ' +
              '--after-install ./opt/Gitter/linux<%= arch %>/after-install.sh ' +
              '--after-remove ./opt/Gitter/linux<%= arch %>/after-remove.sh ' +
              '--url "https://gitter.im" ' +
              '--description "Where developers come to talk" ' +
              '--maintainer "Troupe Technology <support@gitter.im>" ' +
              '--package output/update.gitter.im/linux64/gitter_' + version + '_amd64.deb ' +
              '-version ' + version + ' ' +
              './opt/Gitter/linux64/'));

  gulp.task('linux64:bin', ['linux64:app.nw.zip', 'linux64:get-node-webkit'], function(cb) {
    // combine app.nw zip and node-webkit binary
    var zipStream = fs.createReadStream(zipfile),
    writeStream = fs.createWriteStream(app, { flags:'a' });
  });

  gulp.task('linux64:app.nw', function(cb) {
    return gulp.src(nwappGlob)
      .pipe(zip(app.nw))
      .pipe(gulp.dest('output/linux64/Gitter.app/Contents/Resources/app.nw'));
  });
  

  var catsed = gutil.template('cat ./linux/<%= file %> | sed "s/{{arch}}/linux<%= arch %>/g" > ./opt/Gitter/linux<%= arch %>/<%= file %>');




};

module.exports {
  install: install
};
