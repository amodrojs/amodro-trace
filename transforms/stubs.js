'use strict';
var lang = require('../lib/lang');

module.exports = function stubs(stubModules) {
  return function(context, moduleName, filePath, contents) {
    if (stubModules && stubModules.indexOf(moduleName) !== -1) {
      //Just want to insert a simple module definition instead
      //of the source module. Useful for plugins that inline
      //all their resources.
      if (lang.hasProp(context.plugins, moduleName)) {
        //Slightly different content for plugins, to indicate
        //that dynamic loading will not work.
        return 'define({load: function(id){' +
               'throw new Error("Dynamic load not allowed: " + id);}});';
      } else {
        return 'define({});';
      }
    } else {
      return contents;
    }
  };
};
