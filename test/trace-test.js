/*global describe, it */
'use strict';

var commonJs = require('../lib/commonJs'),
    fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    trace = require('../trace'),
    backSlashRegExp = /\\/g,
    dir = __dirname,
    baseDir = path.join(dir, 'source', 'trace');

function assertMatch(id, traced) {
  // console.log('TRACED: ' + id + ':\n' +
  //             JSON.stringify(traced, null, '  '));

  var expectedPath = path.join(dir, 'expected', 'trace', id + '.json');
  var expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));

  // Clean traced to match across platform/file systems
  traced.forEach(function(entry) {
    if (entry.path.indexOf('!') === -1) {
      entry.path = entry.path
             // Remove file system specific prefix.
             .replace(dir, '')
             // Remove starting path separator.
             .substring(1)
             // Normalize for *nix front slashes.
             .replace(backSlashRegExp, '/');
    }
  });

  // console.log('TRACED CLEANED: ' + id + ':\n' +
  //             JSON.stringify(traced, null, '  '));

  // console.log('EXPECTED: ' + id + ':\n' +
  //             JSON.stringify(expected, null, '  '));


  assert.deepEqual(expected, traced);
}

function runTrace(done, name, options, config, matchId) {
  if (!config) {
    config = {
      baseUrl: path.join(baseDir, name)
    };
  }

  trace(options, config)
  .then(function(traced) {
    assertMatch(matchId || name, traced);
    done();
  }).catch(function(err) {
    done(err);
  });
}

// Start the tests
describe('trace', function() {
  it('simple', function(done) {
    runTrace(done, 'simple', { id: 'main' });
  });

  it('plugin', function(done) {
    runTrace(done, 'plugin', { id: 'main' });
  });

  it('cjs', function(done) {
    runTrace(done, 'cjs', {
      id: 'lib',
      onRead: function(id, url, contents) {
        var result = commonJs.convert(url, contents);
        return result;
      }
    });
  });

  it('nested-nonesting', function(done) {
    runTrace(done, 'nested', { id: 'main' }, null, 'nested-nonesting');
  });

  it('nested-nonesting', function(done) {
    runTrace(done, 'nested', {
      id: 'main',
      findNestedDependencies: true
    });
  });

});
