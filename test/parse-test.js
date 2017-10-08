/*global describe, it */
'use strict';

var amodroParse = require('../parse'),
    assert = require('assert'),
    esprima = require('esprima'),
    fs = require('fs'),
    path = require('path');

describe('parse', function() {
  describe('parse', function() {
    var content;
    
    before(function() {
      content = fs.readFileSync(path.join(__dirname,
          'source/trace/simple/main.js'), 'utf8');
    });
  
    it('without parser options', function() {
      var astRoot = amodroParse.parse(content);
      assert.ok(astRoot);
    });

    it('with parser options', function() {
      var astRoot = amodroParse.parse(content, {
        range: true,
        loc: true
      });
      assert.ok(astRoot);
      assert.ok(astRoot.range);
      assert.ok(astRoot.loc);
    });
  });
  
  describe('traverse', function() {
    it('visits a known node', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main.js'), 'utf8');
      var astRoot = esprima.parse(content);
      var identifierNode, callNode;
      amodroParse.traverse(astRoot, function (node, parent) {
        if (node && node.type === 'Identifier' &&
            node.name === 'require') {
              identifierNode = node;
              callNode = parent;
            }
      });
      assert.ok(identifierNode);
      assert.ok(callNode);
    });
  });
  
  describe('findDependenccies', function() {
    it('with an AMD module', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], 'a');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'a');
    });

    it('with a CJS module', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main-cjs.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 2);
      assert.equal(dependencies.modules[0], 'require');
      assert.equal(dependencies.modules[1], 'a');
      assert.equal(dependencies.params.length, 2);
      assert.equal(dependencies.params[0], 'require');
      assert.equal(dependencies.params[1], 'a');
    });

    it('with an already parsed content', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main.js'), 'utf8');
      var astRoot = esprima.parse(content);
      var dependencies = amodroParse.findDependencies(astRoot);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], 'a');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'a');
    });
  });
});
