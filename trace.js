'use strict';
var Prom = require('./lib/prom'),
    Loader = require('./lib/loader/Loader'),
    exists = require('fs').existsSync || require('path').existsSync;

/**
 * Returns the set of nested dependencies for a given module ID in the options.
 * @param  {Object} options the set of options for trace. Possible options:
 * - id: String. the module ID to trace.
 * - translate: Function. A function that is used to translate the contents
 *   of the modules before they are parsed for module APIs. The function will
 *   receive these arguments: function(moduleName, url, contents), and should
 *   synchronously return a string that will be used as the contents.
 * - includeContents: Boolean. Set to true if the contents of the modules should
 *   be included in the output. The contents will be the contents after the
 *   translate function has run, if it is provided.
 * - keepLoader: Boolean. Keep the loader instance and pass it in the return
 *   value. This is useful if transforms that depend on the instance's context
 *   will be used to transform the contents.
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

      // Pull out the list of IDs for this layer as the return value.
      var paths = context._layer.buildFilePaths,
          idMap = context._layer.buildFileToModule;

      var result = paths.map(function(filePath) {
        var id = idMap[filePath];
        // If a loader plugin, try to guess the path instead of use the ID as
        // the filePath.
        if (id.indexOf('!') !== -1) {
          var map = context.makeModuleMap(id);
          if (exists(map.name)) {
            filePath = map.name;
          } else if (exists(map.name + '.' + map.prefix)) {
            filePath = map.name + '.' + map.prefix;
          } else {
            filePath = null;
          }
        }

        var item = {
          id: id
        };

        if (filePath) {
          item.path = filePath;
        }

        if (options.includeContents) {
          var contents = context._cachedFileContents[filePath];
          if (!contents && exists(filePath)) {
            contents = context.cacheRead(filePath) || '';
          }
          item.contents = contents;
        }

        return item;
      });

      // Clean up resources used by this loader instance.
      if (!options.keepLoader) {
        loader.discard();
        loader = null;
      }

      resolve({
        loader: loader,
        traced: result
      });
    }

    // Inform requirejs that we want this function executed when done.
    onOk.__requireJsBuild = true;

    loader.require([options.id], onOk, function(err) {
      loader.discard();
      reject(err);
    });
  });
};
