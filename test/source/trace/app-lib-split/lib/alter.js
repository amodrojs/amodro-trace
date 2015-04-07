define(function(require) {
  'use strict';
  return function alter(text) {
    text = text.replace(/<h1>([^<]+)<\/h1>/, '<h1>Altered $1</h1>');
    console.log(text);
    return text;
  };
});
