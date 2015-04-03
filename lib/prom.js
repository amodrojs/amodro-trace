if (typeof Promise !== 'undefined') {
  module.exports = Promise;
} else {
  module.exports = require('prim');
}
