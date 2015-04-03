'use strict';
var Prom = require('./lib/prom'),
    loader = require('./lib/loader/loader');

/**
 * Returns the set of nested dependencies for a given module ID in the options.
 * @param  {Object} loaderConfig the requirejs loader config to use for tracing
 * and finding modules.
 * @param  {Object} options the set of options for trace. Possible options:
 * - id: the module ID to trace.
 * @return {Object} The trace result.
 */
module.exports = function trace(loaderConfig, options) {
  return new Prom(function(resolve, reject) {
    // Validate the options.
    if (!options.id) {
      reject(new Error('options must include "id" ' +
                       'to know what module ID to trace'));
      return;
    }

    var loaderResult = loader.create(),
        loaderInstance = loaderResult.loader;

    loaderInstance.config(loaderConfig);

    loaderInstance([options.id], function() {
      // Pull out the list of IDs for this layer as the return value.
      var context = loader.getContext(loaderResult.id);
      loader.discard(loaderResult.id);
      resolve(context._layer.buildFilePaths);
    }, function(err) {
      reject(err);
    });
  });
};
