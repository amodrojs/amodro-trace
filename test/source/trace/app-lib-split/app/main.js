/*global document */
define(function(require) {
  'use strict';
  var clean = require('./helpers/clean'),
      text = require('text!./templates/list.html');

  document.body.innerHTML = clean(text);
});
