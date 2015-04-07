'use strict';
var lang = require('../lib/lang'),
    parse = require('../parse');

// Set up options, one for logging in toTransport?

module.exports = function packages(options) {
  return function(context, moduleName, filePath, contents) {
    var config = context.config,
        pkgsMainMap = config.pkgsMainMap;

    if (!pkgsMainMap) {
      config.pkgsMainMap = pkgsMainMap = {};
      //Create a reverse lookup for packages main module IDs to their package
      //names, useful for knowing when to write out define() package main ID
      //adapters.
      lang.eachProp(context.config.pkgs, function(value, prop) {
          pkgsMainMap[value] = prop;
      });
    }


    var hasPackageName;

    //If the moduleName is a package main, then hold on to the
    //packageName in case an adapter needs to be written.
    var packageName = lang.getOwn(pkgsMainMap, moduleName);

    if (packageName) {
      hasPackageName = (packageName === parse.getNamedDefine(contents));
    }

    contents = toTransport(moduleName, filePath, contents, context);

    if (packageName && !hasPackageName) {
      contents += ";define('" +
              packageName + "', ['" + moduleName +
              "'], function (main) { return main; });\n";
    }


  };
};
