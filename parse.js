'use strict';
var privateParse = require('./lib/parse');

/**
 * Functions for parsing and analysing dependencies of AMD modules. Mostly a
 * wrapper around lib/ modules, but want to try not exposing the libs directly,
 * and provide a cleaner interface.
 */
var parse = {
  /**
   * Parses the input JavaScript text and returns a AST of it. Expects a
   * JavaScript content. The returned object can be used later in other calls,
   * or to other module analysis.
   *
   * @param {String} contents File contents of an AMD module.
   * @param {Object} options Optional. Options for the `esprima` parser: Only
   * `range` and `loc` properties are recognized.
   * @return {Object} Optional. Options for the `esprima` parser: Only `range`
   * and `loc` properties are recognized.
   */
  parse: function (contents, options) {
    return privateParse.parseFileContents('', contents, options);
  },

  /**
   * Walks the AST from the specified (root) node up to its leaves and calls
   * the specified callback function with two arguments - the visited node
   * and its parent node.
   *
   * @param {Object} node AST root node to start traversing with. Produced
   * by the `parse` method.
   * @param {Function} visitor Callback receiving nodes with its parents.
   */
  traverse: function (node, visitor) {
    return privateParse.traverse(node, visitor);
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
    var dependencies = privateParse.findDependencies('', contents, {}),
        params = dependencies.params;
    delete dependencies.params;
    return  {
      modules: dependencies,
      params: params
    }
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
    var dependencies = privateParse.findCjsDependencies('', contents, {}),
        params = dependencies.params;
    delete dependencies.params;
    return  {
      modules: dependencies,
      params: params
    }
  }
};

module.exports = parse;
