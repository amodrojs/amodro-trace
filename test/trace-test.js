/*global describe, it */
'use strict';

var allWriteTransforms = require('../write/all'),
    readCjs = require('../read/cjs'),
    fs = require('fs'),
    amodroConfig = require('../config'),
    path = require('path'),
    assert = require('assert'),
    trace = require('../trace'),
    backSlashRegExp = /\\/g,
    dir = __dirname,
    baseDir = path.join(dir, 'source', 'trace');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertMatch(id, traced) {
  // console.log('TRACED: ' + id + ':\n' +
  //             JSON.stringify(traced, null, '  '));

  var expectedPath = path.join(dir, 'expected', 'trace', id + '.json');
  var expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));

  // Clean traced to match across platform/file systems
  traced.forEach(function(entry) {
    if (entry.path && entry.path.indexOf('!') === -1) {
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

  // Set up rootDir
  options.rootDir = path.join(baseDir, name);

  trace(options, config)
  .then(function(result) {
    // console.log('TRACE RESULT: ' + name + ':\n' +
    //             JSON.stringify(result, null, '  '));

    assertMatch(matchId || name, result.traced);
    done();
  }).catch(function(err) {
    done(err);
  });
}

// Start the tests
describe('trace', function() {
  it('app-lib-split', function(done) {
    var configPath = path.join(baseDir, 'app-lib-split', 'app.js');
    var config = amodroConfig.find(readFile(configPath));

    runTrace(done, 'app-lib-split', { id: 'app' }, config);
  });

  it('app-lib-split-content-transform', function(done) {
    var configPath = path.join(baseDir, 'app-lib-split', 'app.js');
    var config = amodroConfig.find(readFile(configPath));
    var options = {
      id: 'app',
      writeTransform: allWriteTransforms({
        stubModules: ['text'],
        logger: {
          warn: function(msg) {
            console.warn(msg);
          }
        }
      })
    };

    runTrace(done, 'app-lib-split',
             options, config, 'app-lib-split-content-transform');
  });

  it('cjs', function(done) {
    runTrace(done, 'cjs', {
      id: 'lib',
      readTransform: function(id, url, contents) {
        var result = readCjs(url, contents);
        return result;
      }
    });
  });

  it('nested', function(done) {
    runTrace(done, 'nested', {
      id: 'main',
      findNestedDependencies: true
    });
  });

  it('nested-nonesting', function(done) {
    runTrace(done, 'nested', { id: 'main' }, null, 'nested-nonesting');
  });

  it('plugin', function(done) {
    runTrace(done, 'plugin', { id: 'main' });
  });

  it('simple', function(done) {
    runTrace(done, 'simple', { id: 'main' });
  });

});
