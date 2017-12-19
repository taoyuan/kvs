var fs = require('fs');

exports.store =
  exports.Store = require('./lib/store');

exports.__defineGetter__('version', function () {
  return JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
});
