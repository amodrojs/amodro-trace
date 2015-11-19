'use strict';

define('inlay', function() {
  return {
    name: 'inlay'
  };
});

define('button', function() {
  return {
    name: 'button'
  };
});

define('header', ['button'], function(button) {
  return {
    name: 'header',
    button: button
  };
});

define('content', ['inlay', 'button'], function(inlay, button) {
  return {
    name: 'content',
    inlay: inlay,
    button: button
  };
});

define('footer', ['button'], function(button) {
  return {
    name: 'footer',
    button: button
  };
});

define('view1', ['header', 'content', 'footer'], function(h, c, f) {
  return {
    name: 'view1',
    header: h,
    content: c,
    footer: f
  };
});
