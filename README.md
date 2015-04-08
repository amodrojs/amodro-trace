# amodro-trace

Tracing automaton for build processes that understand [AMD modules](https://github.com/amdjs/amdjs-api).

Like the [requirejs optimizer](http://requirejs.org/docs/optimization.html), but just traces a module ID for its nested dependencies, and the result is a data structure for that trace, instead of a fully optimized build.

It uses requirejs underneath to do the tracing, so things like loader plugins work and it has a full understanding of AMD APIs. It can also normalize the module contents so multiple define calls can be concatenated in a file.

Use the requirejs optimizer if you want a more complete build tool. Use this if you want more control over the build processes, and just want something to do the AMD bits.

## Use cases

### Dependency tree for a module ID

Your build process uses a build dependency graph, like the one used by make. However, that tool does not understand module tracing. You can use this tool to figure out the graph for a given module ID. For fancier dependency graphing, [node-madge](https://github.com/pahen/madge) may be a better fit.

amodro-trace focuses on starting with a single module ID, an AMD loader config, and tracing the modules that back that module ID. Example:

```javascript
var amodroTrace = require('amodro-trace'),
    path = require('path');

amodroTrace(
  // The options for trace
  {
    // The root directory, usually the root of the web project, and what the
    // AMD baseUrl is relative to. Should be an absolute path.
    rootDir: path.join(__dirname, 'www'),

    // The module ID to trace.
    id: 'app'
  },
  // The loader config to use.
  {
    baseUrl: 'lib',
    paths: {
      app: '../app'
    }
  }
).then(function(traceResult) {
  // The traceResult has this structure:
  traceResult = {
    traced: [
      { "id": "b", "path": "/full/path/to/www/lib/b.js" },
      { "id": "a", "path": "/full/path/to/www/lib/a.js" },
      { "id": "app/main", "path": "/full/path/to/www/app/main.js" }
      { "id": "app", "path": "/full/path/to/www/app.js" }
    ]
  };
}).catch(function(error) {
  console.error(error);
});
```

### Content transforms after AMD normalization

You want a trace of the modules that may be used in a build layer, with the AMD calls normalized for file concatenation, but you want to do further work before combining them and generating the source map and minifying.

The call is similar to the simple dependency tree result, but ask amodro-trace to include the contents and provide a "write" transform that normalizes the AMD calls:

```javascript
var amodroTrace = require('amodro-trace'),
    allWriteTransforms = require('amodro-trace/write/all'),
    path = require('path');

// Create the writeTransform function by passing options to be used by the
// write transform factories:
var writeTransform = allWriteTransforms({
  // See the write transforms section for options.
});

amodroTrace(
  // The options for trace
  {
    rootDir: path.join(__dirname, 'www'),
    id: 'app'
  },
  // The loader config to use.
  {
    baseUrl: 'lib',
    paths: {
      app: '../app'
    }
  },
  includeContents: true,
  writeTransform: writeTransform
).then(function(traceResult) {
  // The traceResult has this structure:
  traceResult = {
    traced: [
      {
        "id": "b",
        "path": "/full/path/to/www/lib/b.js",
        "contents": "define('b',{\n  name: 'b'\n});\n"
      },
      {
        "id": "a",
        "path": "/full/path/to/www/lib/a.js",
        "contents": "define('a',['b'], function(b) { return { name: 'a', b: b }; });"
      },
      {
        "id": "app/main",
        "path": "/full/path/to/www/app/main.js",
        "contents": "define('app/main',['require','a'],{\n  console.log(require('a');\n});\n"
      },
      {
        "id": "app",
        "path": "/full/path/to/www/app.js",
        "contents": "require.config({\n  baseUrl: 'lib',\n  paths: {\n    app: '../app'\n  }\n});\n\nrequire(['app/main']);\n\ndefine(\"app\", [],function(){});\n"
      }
    ]
  };
}).catch(function(error) {
  console.error(error);
});
```


### Non-file inputs

Your build tool may not deal with files directly, maybe it builds up a list of files in a stream-backed objects. Gulp as an example.

The `fileExists` and `fileRead` function options allow you to do this:

```javascript
var amodroTrace = require('amodro-trace'),
    path = require('path');

// Build up an in-memory data structure for the files/modules involved.
// This example uses module IDs as the keys, but you could decide to use paths.
var fileMap = {
  main: 'require([\'a\'], function(a) {});',
  a: 'define([\'b\'], function(b) { return { name: \'a\', b: b }; });',
  b: 'define({\n  name: 'b'\n});\n'
};

amodroTrace(
  // The options for trace
  {
    // The root directory, usually the root of the web project, and what the
    // AMD baseUrl is relative to. Should be an absolute path.
    rootDir: path.join(__dirname, 'www'),

    // The module ID to trace.
    id: 'app',


    // amodro-trace checks for file existence for some commands, this function
    // allows you to override that behavior. defaultExistst is the default
    // exists function used by amdro-trace. A synchronous boolean result is
    // expected to be returned from this function.
    fileExists: function(defaultExists, id, filePath) {
      return fileMap.hasOwnProperty(id);
    },

    // You can override file reading by passing in a function for fileRead.
    // defaultRead is the default file reading function used by amodro-trace,
    // so you can call it if you want to delegate to that functionality. A
    // synchronous result is expected to be returned from this function.
    fileRead: function(defaultRead, id, filePath) {
      return fileMap[id];
    }
  },
  // The loader config to use.
  {
    baseUrl: 'lib',
    paths: {
      app: '../app'
    }
  }
).then(function(traceResult) {
  // See other examples for traceResult structure.
}).catch(function(error) {
  console.error(error);
});
```

### Transform some files to AMD before tracing

If you are using a transpiled language, or want to author in CommonJS (CJS) format but output to AMD, you can provide a read transform that can modify the contents of files after they are read but before they are traced.

Here is an example that uses the cjs read transform provided in this project (it just wraps CJS modules in AMD wrappers, it does not change module ID tracing rules):

```javascript
var amodroTrace = require('amodro-trace'),
    cjsTransform = require('amodro-trace/read/cjs'),
    path = require('path');

amodroTrace(
  // The options for trace
  {
    // The root directory, usually the root of the web project, and what the
    // AMD baseUrl is relative to. Should be an absolute path.
    rootDir: path.join(__dirname, 'www'),

    // The module ID to trace.
    id: 'app',

    readTransform: function(id, url, contents) {
      return cjsTransform(url, contents);
    }
  },
  // The loader config to use.
  {
    baseUrl: 'lib',
    paths: {
      app: '../app'
    }
  }
).then(function(traceResult) {
  // See other examples for traceResult structure.
}).catch(function(error) {
  console.error(error);
});
```

## Install

This project assumes node/iojs use, and is installed vi npm:

    npm install amodro-trace

## API

### amodro-trace


### amodro-trace/config



### trace options

.translate, mention commonjs.convert. translate may run on non-js files.

.findNestedDependencies


.stubModules ?

## Read transforms

### cjs

## Write transforms

In order:

### plugins

### stubs

### defines

### packages (after defines, that should work out?)


## requirejs optimizer differences

The feature set and config options are smaller since it has a narrower focus. If you feel like you are missing a feature from the requirejs optimizer, it usually can be met by creating a write transform to do what you want. While this project comes with some transforms, it does not support all the transforms that the requirejs optimizer can do. For example, this project's write transforms do not understand how to make namespace builds.

