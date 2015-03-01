// module.exports = function () {
//   var args = JSON.stringify([].slice.call(arguments));
//   process.stdout.write('[Gitter]: ' + args + '\n');
//   // fs.appendFileSync('/tmp/nwconsole.log', args + "\r\n"); // Pipe console to a file
// };

module.exports = console.log.bind(console);
