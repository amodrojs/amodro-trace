'use strict';
var privateParse = require('./lib/parse');

/**
 * Functions for parsing and analysing dependencies of AMD modules. Mostly a
 * wrapper around lib/ modules, but want to try not exposing the libs directly,
 * and provide a cleaner interface.
 *
 * If you want to obtain JavaScript AST, which is used by the methods
 * below, use a parser producing output according to the ESTree Spec
 * (https://github.com/estree/estree). For example, Esprima
 * (https://github.com/jquery/esprima):
 *
 * var esprima = require('esprima');
 * var astRoot = esprima.parse(fileContents);
 */
var parse = {
  /**
   * Walks the AST from the specified (root) node up to its leaves and calls
   * the specified callback function with two arguments - the visited node
   * and its parent node. Once the callback returns `false`, traversing stops.
   *
   * @param {Object} node AST root node to start traversing with. Produced
   * by the `parse` method.
   * @param {Function} visitor Callback receiving nodes with its parents.
   */
  traverse: function (node, visitor) {
    return privateParse.traverse(node, visitor);
  },

  /**
   * Walks the AST from the specified (root) node up to its leaves and calls
   * the specified callback function with two arguments - the visited node
   * and its parent node. Once the callback returns `false`, its children
   * will be skipped and the traversing will continue with its next sibling.
   *
   * @param {Object} node AST root node to start traversing with. Produced
   * by the `parse` method.
   * @param {Function} visitor Callback receiving nodes with its parents.
   */
  traverseBroad: function (node, visitor) {
    return privateParse.traverseBroad(node, visitor);
  },

  /**
   * Finds all dependencies specified in the AMD module dependency array, or
   * inside simplified CommonJS wrappers inside the module factory function.
   * Expects a JavaScript AMD module wrapped in a `requirejs/require/define`
   * call. The returned list of dependent modules and their formal parameters
   * match in the correct code.
   *
   * @param  {String} contents String or Object. File contents of an AMD
   * module, or an AST root produced by the `parse` method.
   * @return {Object} Returns an object with two properties. The property
   * "modules" is an array of dependent module paths as strings. The
   * dependencies have not been normalized; they may be relative IDs.
   * The property "params" is an array of formal parameter names as strings.
   */
  findDependencies: function(contents) {
    var dependencies = privateParse.findDependencies('', contents),
        params = dependencies.params;
    delete dependencies.params;
    return  {
      modules: dependencies,
      params: params
    };
  },

  /**
   * Finds only CommonJS dependencies, ones that are the form 
   * require('stringLiteral'). Expects a JavaScript module. The returned
   * list of dependent modules and their formal parameters match in the
   * correct code.
   *
   * @param  {String} contents String or Object. File contents of a CommonJS
   * module, or an AST root produced by the `parse` method.
   * @return {Object} Returns an object with two properties. The property
   * "modules" is an array of dependent module paths as strings. The
   * dependencies have not been normalized; they may be relative IDs.
   * The property "params" is an array of formal parameter names as strings.
   */
  findCjsDependencies: function(contents) {
    var dependencies = privateParse.findCjsDependencies('', contents),
        params = dependencies.params;
    delete dependencies.params;
    return  {
      modules: dependencies,
      params: params
    };
  }
};

module.exports = parse;
