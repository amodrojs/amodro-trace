var Prom = require('./prom'),
    slice = Array.prototype.slice;

module.exports = function(fn, thisObj) {
  return function() {
    var args = slice.call(arguments);

    var p = new Prom(function(resolve, reject) {
      args.push(function(err, value) {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });

    fn.apply(thisObj, args);

    return p;
  };
};
