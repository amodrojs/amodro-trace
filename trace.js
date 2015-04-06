'use strict';
var Prom = require('./lib/prom'),
    Loader = require('./lib/loader/Loader');

/**
 * Returns the set of nested dependencies for a given module ID in the options.
 * @param  {Object} options the set of options for trace. Possible options:
 * - id: the module ID to trace.
 * @param  {Object} loaderConfig the requirejs loader config to use for tracing
 * and finding modules.
 * @return {Object} The trace result.
 */
module.exports = function trace(options, loaderConfig) {
  return new Prom(function(resolve, reject) {
    // Validate the options.
    if (!options.id) {
      reject(new Error('options must include "id" ' +
                       'to know what module ID to trace'));
      return;
    }

    var loader = new Loader(options);

    if (loaderConfig) {
      loader.getContext().configure(loaderConfig);
    }

    function onOk() {
      var context = loader.getContext();

      // Clean up resources used by this loader instance.
      loader.discard();

      // Pull out the list of IDs for this layer as the return value.
      var paths = context._layer.buildFilePaths,
          idMap = context._layer.buildFileToModule;

      var result = paths.map(function(filePath) {
        return {
          id: idMap[filePath],
          path: filePath
        };
      });

      resolve(result);
    }

    // Inform requirejs that we want this function executed when done.
    onOk.__requireJsBuild = true;

    loader.require([options.id], onOk, function(err) {
      reject(err);
    });
  });
};
