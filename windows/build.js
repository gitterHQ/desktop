var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var argv = require('yargs').argv;
var Promise = require('bluebird');

var nwappManifest = require('../nwapp/package.json');
var appVersion = nwappManifest.version;

var stat = Promise.promisify(fs.stat);

var possibleProgramFilePaths = [
  'C:\\Program Files (x86)',
  'C:\\Program Files'
];

var possibleSignToolPaths = [
  'Microsoft SDKs\\Windows\\v7.1\\Bin\\signtool.exe',
  'Microsoft SDKs\\Windows\\v7.1A\\Bin\\signtool.exe',
  'Windows Kits\\8.1\\bin\\x64\\signtool.exe',
  'Windows Kits\\8.1\\bin\\x86\\signtool.exe',
  'Windows Kits\\8.0\\bin\\x64\\signtool.exe',
  'Windows Kits\\8.0\\bin\\x86\\signtool.exe'
];

var statResults = possibleProgramFilePaths.reduce(function(statResults, programFilePath) {
  return statResults.concat(possibleSignToolPaths.map(function(signToolPath) {
    var fullSignToolPath = path.join(programFilePath, signToolPath);
    return stat(fullSignToolPath)
      .then(function() {
        return fullSignToolPath;
      })
  }));
}, []);


Promise.any(statResults)
  .then(function(signToolPath) {
    var certPassword = argv.password || argv.p || '';

    var commandList = [
      '"' + signToolPath + '" sign /f "' + path.resolve(__dirname, '..\\certificates\\troupe-cert.pfx') + '" /p ' + certPassword + ' "' + path.resolve(__dirname, '..\\opt\\Gitter\\win32\\Gitter.exe') + '"',
      '"C:\\Program Files (x86)\\Inno Setup 5\\ISCC.exe" "' + path.resolve(__dirname, 'gitter.iss') + '"',
      '"' + signToolPath + '" sign /f "' + path.resolve(__dirname, '..\\certificates\\troupe-cert.pfx') + '" /p ' + certPassword + ' "' + path.resolve(__dirname, '..\\artefacts\\GitterSetup*') + '"',
      'rename "' + path.resolve(__dirname, '..\\artefacts\\GitterSetup.exe') + '" "GitterSetup-' + appVersion + '.exe"',
    ];

    var commandRunner = function(command) {
      return new Promise(function(resolve, reject) {
        var child = exec(command, function(err, stdout, stderr) {
          //console.log('stdout', stdout, 'e', err, 'stderr', stderr);
          resolve({
            command: command,
            stdout: stdout,
            stderr: stderr,
            error: err
          });
        });
      });
    };

    // Run the commands in series
    commandList.reduce(function(seriesCommandChain, command) {
      return seriesCommandChain.then(function(commandResult) {
        if(commandResult.command) {
          console.log('> ' + commandResult.command);
        }
        if(commandResult.stdout) {
          console.log(commandResult.stdout);
        }
        if(commandResult.error) {
          console.log(commandResult.stderr);
          throw commandResult.error;
        }

        // Keep the chain going
        return commandRunner(command);
      });
    }, Promise.resolve({}));
  })
  .catch(Promise.AggregateError, function(err) {
    // ignore any failed checks
    console.log('Could not find the `signtool.exe`, try installing the Microsoft SDK and check that we are looking in the right place: open this file and look at `possibleSignToolPaths`');
  });
