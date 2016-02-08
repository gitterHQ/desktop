

var argv = require('yargs').argv;
var Promise = require('bluebird');

var exec = require('child_process').exec;


var nwappManifest = require('./nwapp/package.json');
var appVersion = nwappManifest.version;



var projectPath = argv.projectPath || 'E:\\';

var commandList = [
	'"C:\Program Files (x86)\Microsoft SDKs\Windows\v8.1\Bin\signtool.exe" sign /f "Z:\certificates\troupe-cert.pfx" "Z:\opt\Gitter\win32\Gitter.exe"',
	'"C:\Program Files (x86)\Inno Setup 5\ISCC.exe" "E:\windows\gitter.iss"',
	'"C:\Program Files (x86)\Microsoft SDKs\Windows\v8.1\Bin\signtool.exe" sign /f "Z:\certificates\troupe-cert.pfx" "Z:\artefacts\GitterSetup*"',
	'rename "Z:\artefacts\GitterSetup.exe" "GitterSetup-' + appVersion + '.exe"',
];


var commandRunner = function(command) {
	return new Promise(function(resolve, reject) {
		var child = exec(command, function(err, stdout, stderr) {
			//console.log('stdout', stdout, 'e', err, 'stderr', stderr);
			resolve({
				stdout: stdout,
				stderr: stderr,
				error: err
			});
		});
	});
};



commandList.map(function(command) {
	console.log(command);
	//return commandRunner(command);
});
