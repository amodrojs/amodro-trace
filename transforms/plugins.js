'use strict';

// options object to include tracing for toTransport?
module.exports = function defines(options) {

  return function(context, moduleName, filePath, contents) {
    var parts = context.makeModuleMap(moduleName),
        builder = parts.prefix && getOwn(context.defined, parts.prefix),
        config = context.config;

    if (builder) {
      if (builder.write) {
        var writeApi = function (input) {
          contents = input;
        };
        writeApi.asModule = function (moduleName, input) {
          contents = toTransport(moduleName, filePath, input, context);
        };
        builder.write(parts.prefix, parts.name, writeApi);
      }
    }

    return contents;
  };
};

