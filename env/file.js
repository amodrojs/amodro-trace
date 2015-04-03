var fs = require('fs'),
    cbToPromise = require('../lib/cbToPromise'),
    readFile = cbToPromise(fs.readFile, fs);
    writeFile = cbToPromise(fs.writeFile, fs);


var file = {
  read: function(path, encoding) {
    encoding = encoding || 'utf8';
    return readFile(path, encoding);
  },

  write: function(path, contents, encoding) {
    encoding = encoding || 'utf8';
    return writeFile(path, encoding);
  }
};

module.exports = file;
