# amodro-trace

[AMD](https://github.com/amdjs/amdjs-api) module tracing for build processes.

Like the [requirejs optimizer](http://requirejs.org/docs/optimization.html), but just traces a module ID for its nested dependencies, and the result is a data structure for that trace, instead of a fully optimized build.

It uses requirejs underneath to do the tracing, so things like loader plugins work and it has a full understanding of AMD APIs. It can also normalize the module contents so multiple define calls can be concatenated in a file.

Use the requirejs optimizer if you want a more complete build tool. Use this if you want more control over the build processes, and just want something to do the AMD bits.

## Use cases

### Dependency tree for a module ID

Your build process uses a build dependency graph, like the one used by make. However, that tool does not understand module tracing. You can use this tool to figure out the graph for a given module ID. For fancier dependency graphing, [node-madge](https://github.com/pahen/madge) may be a better fit.

amodro-trace starts with a single module ID, an AMD loader config, and traces the dependency tree that module ID. Example:

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
  // The AMD loader config to use.
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
    id: 'app',

    includeContents: true,
    writeTransform: writeTransform
  },
  // The AMD loader config to use.
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

Your build tool may not deal with files directly, maybe it builds up a list of files in a stream-backed objects. [Gulp](http://gulpjs.com/) for example.

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

    // You can ovrride the file existence checks by passing in a function for
    // fileExists. defaultExistst is the default exists function used by this
    // project's internals. A synchronous boolean result is expected to be
    // returned from this function.
    fileExists: function(defaultExists, id, filePath) {
      return fileMap.hasOwnProperty(id);
    },

    // You can override file reading by passing in a function for fileRead.
    // defaultRead is the default file reading function used by this project's
    // internals. You can call it if you want to delegate to that
    // functionality. A synchronous result is expected to be returned from this
    // function.
    fileRead: function(defaultRead, id, filePath) {
      return fileMap[id];
    }
  },
  // The AMD loader config to use.
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

### Transform files to AMD before tracing

If you are using a transpiled language, or want to author in CommonJS (CJS) format but output to AMD, you can provide a read transform that can modify the contents of files after they are read but before they are traced.

Here is an example that uses the cjs read transform provided in this project (it just wraps CJS modules in AMD wrappers, it does not change module ID resolution rules):

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
  // The AMD loader config to use.
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

This project runs in node/iojs, and is installed via npm:

    npm install amodro-trace

## API

### amodro-trace

```javascript
amodro-trace(options, loaderConfig);
```

Returns a Promise. The resolved value will be a result object that looks like this:

```json
{
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
}
```

The `contents` property for an entry is only included if the [includeContents](#includecontents) or [writeTransform](#writetransform) options are used. If [keepLoader](#keeploader) option is used, the result object will include a `loader` property.

The `traced` results are order by least dependent to more dependent. So, modules with no dependencies come first.

`loaderConfig` is the AMD loader config that would be used by an AMD loader to load those modules at runtime. If you want to extract the loader config from an existing JS file, [amodro-config](#amodro-traceconfig) can help with that.

### options

The following options

#### rootDir

String. The full path to the root of the project to be scanned. This is usually the top level directory of the project that is served to the web, and the reference directory for relative baseUrls in an AMD loader config.

#### id

String. the module ID to trace.

#### findNestedDependencies

Boolean. Defaults to false. Normally `require([])` calls inside a `define()`'d module are not traced, as they are usually meant to be dynamically loaded dependencies and are not static module dependencies.

However, for some tracing cases it is useful to include these dynamic dependencies. Setting this option to true will do that. It only captures `require([])` calls that use string literals for dependency IDs. It cannot trace dependency IDs that are variables for JS expressions.

#### fileRead

Function. A function that synchronously returns the file contents for the given file path. Allows overriding where file contents come from, for instance, building up an in-memory map of file names and contents from a stream.

Arguments passed to this function:

```javascript
function(defaultReadFunction, moduleName, filePath) {}
```

Where defaultReadFunction is the default read function used. You can call it with the filePath to get the contents via the normal file methods this module uses to get file contents.

#### fileExists

Function. If fileRead is provided, this function should be provided too. Determines if a file exists for the mechanism that reads files. A synchronous Boolean answer is expected. Signature is:

```javascript
function(defaultExistsFunction, moduleName, filePath) {}
```

Where defaultExistsFunction is the default exists function used by the internals of this module.

#### readTransform

Function. A function that is used to transform the contents of the modules after the contents are read but before they are parsed for module APIs. The function will receive these arguments:

```javascript
function(moduleName, filePath, contents) {}
```
and should synchronously return a string that will be used as the contents. If no modifcations are done, the input contents string should be returned.

#### includeContents

Boolean. Set to true if the contents of the modules should be included in the output. The contents will be the contents after the readTransform function has run, if it is provided.

#### writeTransform

Function. When contents are added to the result, run this function to allow transforming the contents. See the write/ directory for example transforms. Setting this option automatically sets includeContents to be true.

### keepLoader

Boolean. Keep the loader instance and pass it in the return value. This is useful if transforms that depend on the instance's context will be used to transform the contents, and where `writeTransform` is not the right fit.

The traced result will include a `loader` property with the loader instance. You should call `loader.discard()` when you are done using it, to help clean up resources used by the loader.

If manually calling some transforms that would normally be called via writeTransform, you can use `loader.getContext()` to get the context object passed to those transforms. Example:

```javascript
var amodroTrace = require('amodro-trace');

// Use the defines write transform manually.
var defineTransform = require('amodro-trace/write/defines')({});

amodroTrace({}, {}).then(function(traceResult) {
  var traced = traceResult.traced,
      loader = traceResult.loader,
      context = loader.getContext();

  // Iterate over all the traced items and modify their contents in some way.
  traced.forEach(function(item) {
    item.contents = defineTransform(context, item.id, item.path, item.contents);
  });

  // All done with the loader
  loader.discard();
}).catch(function(error) {
  console.error(error);
});

```

### logger

Object of logging functions. Currently only logger.warn and logger.error is used. Useful for surfacing failed/skipped parsing without assuming stdin or stderr should be used.

### amodro-trace/config

This module helps extract or modify a require.config()/requirejs.config() config inside a JS file. The API methods on this module:

#### config.find

Finds the first requirejs/require call to require[js].config/require({}) in a file and returns the value as an object. Will not work with configs that use variable references outside of the config definition. In general, config calls that look more like JSON will work best.

```javascript
var config = require('amodro-config').find(contents);
```

Aruguments to `find`:

* **contents**: String. File contents that might contain a config call.

Returns an Object with the config. Could be `undefined` if a config is not found.

#### config.modify

Modify the contents of a require.config/requirejs.config call and places the modifications bac in the contents. This call will LOSE any existing comments that are in the config string.

```javascript
var config = require('amodro-config')
.modify(contents, function onConfig(currentConfig) {
  // This example just modifies the baseUrl.
  currentConfig.baseUrl = 'new/base';
  return currentConfig;
});
```

Arguments to `modify`:

* **contents**: String. File conents that may contain a config call.
* **onConfig**: Function. Function called when the first config call is found. It will be passed an Object which is the current config, and the onConfig function should return an Object to use as the new config that will be serialized into the contents, replacing the old config.

Returns a String the contents with the config changes applied.

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

