# bamodo

A collection of modules for doing builds of AMD modules. Like the [requirejs optimizer](http://requirejs.org/docs/optimization.html), but more granular steps are exposed to allow custom build toolchains.

This project will focus on providing some build primitives for use by other tools that may provide more comprehensive build solutions.

## Install

This project assumes node/iojs, and is installed vi npm:

    npm install bomodo

## Use

bamodo includes a set of modules that do different parts of a build pipeline. Usually the output of one of the modules can be used as input to the next module in the pipeline.

The general pipeline:

* **bamodo/configure**: sets up a build configuration, parsing app files for require.config() calls to set up the final loader config that will be used to trace for modules.
* **bamodo/trace**: traces the modules given the config and returns a data structure indicating what files and loader plugin outputs go into which build layers.
* **bamodo/transform**: transforms a set of files as specified by a trace result.
* **bamodo/combine**: combines a set of files from a trace result into a concatenated set of modules.

### trace options

.onRead, mention commonjs.convert

.findNestedDependencies




## TODO

_options.wrapShim: just document it, include test after also allowing return of file contents.


config.shim

* remove file.js and cbToPromise.js?
* how to deal with streams, like a gulp thing?
* Get contents back in results
  * no onWrite, can translate after. Although, requires another array scan. But for source maps do not use.
* license: bsd also, dojo foundation
* clean up readme

