/*global describe, it */
'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    trace = require('../trace'),
    backSlashRegExp = /\\/g,
    dir = __dirname;

function assertMatch(id, traced) {
  var expectedPath = path.join(dir, 'expected', 'trace', id + '.json');
  var expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));

  // Clean traced to match across platform/file systems
  traced = traced.map(function(filePath) {
    return filePath
           // Remove file system specific prefix.
           .replace(dir, '')
           // Remove starting path separator.
           .substring(1)
           // Normalize for *nix front slashes.
           .replace(backSlashRegExp, '/');
  });

  assert.deepEqual(expected, traced);
}

// Start the tests
describe('trace', function() {
  var baseDir = path.join(dir, 'source', 'trace');

  it('simple', function(done) {
    trace({
      id: 'main'
    }, {
      baseUrl: path.join(baseDir, 'simple')
    })
    .then(function(traced) {
      assertMatch('simple', traced);
      done();
    }).catch(function(err) {
      done(err);
    });
  });
});
