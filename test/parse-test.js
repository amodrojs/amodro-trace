/*global describe, before, it */
'use strict';

var amodroParse = require('../parse'),
    assert = require('assert'),
    esprima = require('esprima'),
    fs = require('fs'),
    path = require('path');

describe('parse', function() {
  describe('traverse', function() {
    before(function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main.js'), 'utf8');
      this.astRoot = esprima.parse(content);
    });

    it('visits a known node', function() {
      var identifierNode, callNode, lastNode;
      amodroParse.traverse(this.astRoot, function (node, parent) {
        lastNode = node;
        if (node && node.type === 'Identifier' &&
            node.name === 'require') {
              identifierNode = node;
              callNode = parent;
            }
      });
      assert.ok(identifierNode);
      assert.ok(callNode);
      assert.ok(identifierNode !== lastNode);
    });

    it('stops traversing, once the visitor returns `true`', function() {
      var identifierNode, lastNode;
      amodroParse.traverse(this.astRoot, function (node) {
        lastNode = node;
        if (node && node.type === 'Identifier' &&
            node.name === 'require') {
              identifierNode = node;
              return false;
            }
      });
      assert.ok(identifierNode);
      assert.ok(identifierNode === lastNode);
    });
  });

  describe('traverseBroad', function() {
    before(function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/nested/a.js'), 'utf8');
      this.astRoot = esprima.parse(content);
    });

    it('visits known nodes', function() {
      var defineNode, requireNode, argumentNode, returnNode;
      amodroParse.traverseBroad(this.astRoot, function (node, parent) {
        if (node && node.type === 'ExpressionStatement' &&
            node.expression && node.expression.type === 'CallExpression' &&
            node.expression.callee &&
            node.expression.callee.type === 'Identifier' &&
            node.expression.callee.name === 'require') {
              requireNode = node;
              defineNode = parent;
            }
        if (node && node.type === 'Literal' && node.value === 'e') {
              argumentNode = node;
            }
        if (node && node.type === 'ReturnStatement') {
              returnNode = node;
            }
      });
      assert.ok(defineNode);
      assert.ok(requireNode);
      assert.ok(argumentNode);
      assert.ok(returnNode);
    });

    it('skips traversing children, if the visitor returns `true`', function() {
      var requireNode, argumentNode, returnNode;
      amodroParse.traverseBroad(this.astRoot, function (node, parent) {
        if (node && node.type === 'ExpressionStatement' &&
            node.expression && node.expression.type === 'CallExpression' &&
            node.expression.callee &&
            node.expression.callee.type === 'Identifier' &&
            node.expression.callee.name === 'require') {
              requireNode = node;
              return false;
            }
        if (node && node.type === 'Literal' && node.value === 'e') {
              argumentNode = node;
            }
        if (node && node.type === 'ReturnStatement') {
              returnNode = node;
            }
      });
      assert.ok(requireNode);
      assert.ok(!argumentNode);
      assert.ok(returnNode);
    });
  });

  describe('findDependenccies', function() {
    it('with an AMD main application', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/main.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], 'a');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'a');
    });

    it('with a CJS main application', function() {
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

    it('with an AMD module', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/c.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], 'b');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'b');
    });

    it('with a CJS module', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/c-cjs.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 2);
      assert.equal(dependencies.modules[0], 'require');
      assert.equal(dependencies.modules[1], 'b');
      assert.equal(dependencies.params.length, 2);
      assert.equal(dependencies.params[0], 'require');
      assert.equal(dependencies.params[1], 'b');
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

    it('with a module exporting an object literal', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/module-object-only.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 0);
      assert.equal(dependencies.params.length, 0);
    });

    it('with a module with "explicitly" empty dependencies', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/module-empty-deps.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 0);
      assert.equal(dependencies.params.length, 0);
    });

    it('with an application passing an object literal', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/app-object-only.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 0);
      assert.equal(dependencies.params.length, 0);
    });

    it('withn an application with "explicitly" empty dependencies', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/simple/app-empty-deps.js'), 'utf8');
      var dependencies = amodroParse.findDependencies(content);
      assert.equal(dependencies.modules.length, 0);
      assert.equal(dependencies.params.length, 0);
    });
  });

  describe('findCjsDependenccies', function() {
    it('with an CJS module', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/cjs/controller.js'), 'utf8');
      var dependencies = amodroParse.findCjsDependencies(content);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], './model');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'model');
    });

    it('with an already parsed content', function() {
      var content = fs.readFileSync(path.join(__dirname,
              'source/trace/cjs/controller.js'), 'utf8');
      var astRoot = esprima.parse(content);
      var dependencies = amodroParse.findCjsDependencies(astRoot);
      assert.equal(dependencies.modules.length, 1);
      assert.equal(dependencies.modules[0], './model');
      assert.equal(dependencies.params.length, 1);
      assert.equal(dependencies.params[0], 'model');
    });
  });
});
