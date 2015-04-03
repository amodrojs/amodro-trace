/**
 * @license Copyright (c) 2010-2015, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

var parse = require('../parse');

var commonJs = {
  /**
   * Does the actual file conversion.
   *
   * @param {String} fileName the name of the file.
   *
   * @param {String} fileContents the contents of a file :)
   *
   * @returns {String} the converted contents
   */
  convert: function (fileName, fileContents) {
    //Strip out comments.
    try {
      var preamble = '',
        commonJsProps = parse.usesCommonJs(fileName, fileContents);

      //First see if the module is not already RequireJS-formatted.
      if (parse.usesAmdOrRequireJs(fileName, fileContents) || !commonJsProps) {
        return fileContents;
      }

      if (commonJsProps.dirname || commonJsProps.filename) {
        preamble = 'var __filename = module.uri || "", ' +
          '__dirname = ' +
          '__filename.substring(0, __filename.lastIndexOf("/") + 1); ';
      }

      //Construct the wrapper boilerplate.
      fileContents = 'define(function (require, exports, module) {' +
        preamble +
        fileContents +
        '\n});\n';

    } catch (e) {
      console.log("commonJs.convert: COULD NOT CONVERT: " + fileName +
                  ", so skipping it. Error was: " + e);
      return fileContents;
    }

    return fileContents;
  }
};

module.exports = commonJs;
