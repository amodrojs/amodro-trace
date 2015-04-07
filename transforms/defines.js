'use strict';
var lang = require('../lib/lang'),
    transform = require('../lib/transform'),
    falseProp = lang.falseProp;

// options should include skipModuleInsertion and tracing for transform?
module.exports = function defines(options) {

  return function(context, moduleName, filePath, contents) {
    var config = context.config;

    contents = defines.toTransport(context, moduleName,
                                   filePath, contents, options);

    //Some files may not have declared a require module, and if so,
    //put in a placeholder call so the require does not try to load them
    //after the module is processed.
    //If we have a name, but no defined module, then add in the placeholder.
    if (moduleName && falseProp(context.modulesWithNames, moduleName) && !config.skipModuleInsertion) {
        var shim = config.shim && (getOwn(config.shim, moduleName) ||
                   (packageName && getOwn(config.shim, packageName)));
        if (shim) {
            if (config.wrapShim) {
                contents = '(function(root) {\n' +
                                 'define("' + moduleName + '", ' +
                                 (shim.deps && shim.deps.length ?
                                        build.makeJsArrayString(shim.deps) + ', ' : '[], ') +
                                'function() {\n' +
                                '  return (function() {\n' +
                                         contents +
                                         // Start with a \n in case last line is a comment
                                         // in the contents, like a sourceURL comment.
                                         '\n' + (shim.exportsFn ? shim.exportsFn() : '') +
                                         '\n' +
                                '  }).apply(root, arguments);\n' +
                                '});\n' +
                                '}(this));\n';
            } else {
                contents += '\n' + 'define("' + moduleName + '", ' +
                                 (shim.deps && shim.deps.length ?
                                        build.makeJsArrayString(shim.deps) + ', ' : '') +
                                 (shim.exportsFn ? shim.exportsFn() : 'function(){}') +
                                 ');\n';
            }
        } else {
            contents += '\n' + 'define("' + moduleName + '", function(){});\n';
        }
    }


  };
};

defines.toTransport(context, moduleName, filePath, contents, options) {
  function onFound(info) {
    //Only mark this module as having a name if not a named module,
    //or if a named module and the name matches expectations.
    if (context && (info.needsId || info.foundId === moduleName)) {
      context.modulesWithNames[moduleName] = true;
    }
  }

  return transform.toTransport('', moduleName, filePath,
                               contents, onFound, options);
}