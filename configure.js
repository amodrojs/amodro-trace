var file = require('file');

/**
 * Search a file for a require.config() call and returns the config as a JS
 * object.
 *
 * Only works with config() calls that do not rely on local JS state to execute.
 * In general, if the config could work as a JSON will work well.
 *
 * @param  {String} filePath
 * contain config() calls for the AMD loader.
 * @return {[type]}          [description]
 */
module.exports = function configure(filePath) {
  return file.read(filePath)
  .then(function(contents) {
    try {
      return parse.findConfig(contents).config;
    } catch (configError) {
        throw new Error('The config in ' + filePath + ' cannot be used ' +
                        'because it cannot be evaluated correctly. Try only ' +
                        'using a config that is also valid JSON, or does not ' +
                        'depend on outside variable definitions.\n' +
                        'Source error: ' + configError);
    }
  });
};
