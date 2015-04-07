# bamodo

A collection of modules for doing builds of AMD modules. Like the [requirejs optimizer](http://requirejs.org/docs/optimization.html), but more granular steps are exposed to allow custom build toolchains.

This project will focus on providing some build primitives for use by other tools that may provide more comprehensive build solutions.

Motiviations for this project:

* source maps
* more custom build processes, different way to input "files" and their "contents".
* r.js came out of the pre-node JS world, where more batteries needed to be included. For example, r.js runs in xpcshell, rhino, Nashorn and the browser.
As such, it has a lot of config options. While this project allows smaller, finer grained module tracing for builds, it means the end user or intermediate tools need to worry about composing this functionality.

## Install

This project assumes node/iojs, and is installed vi npm:

    npm install bomodo

## Use

bamodo includes a set of modules that do different parts of a build pipeline. Usually the output of one of the modules can be used as input to the next module in the pipeline.

The general pipeline:

* **bamodo/trace**: traces the modules given the config and returns a data structure indicating what files and loader plugin outputs go into which build layers.
* **bamodo/transform**: transforms a set of files as specified by a trace result.
* **bamodo/combine**: combines a set of files from a trace result into a concatenated set of modules.

### trace options

.translate, mention commonjs.convert

.findNestedDependencies


???
.namespace ?
.stubModules ?

## transforms

In order:

* plugins
* stubs
* defines
* packages (after defines, that should work out?)


## How to modify config. Is that amodro-config?

## Not supported

* namespace


## TODO

_options.wrapShim: just document it, include test after also allowing return of file contents.


config.shim

options.logger.warn for transform.

* indicate plugin resources in output, guess at file path?
* how to deal with streams, like a gulp thing?
  * .read option, that can replace the cacheRead function?
* Get contents back in results: the translated source?
  * What about plugin content, is that run through translate? no.
  * transform module to name modules for example. Can be external?
  * no onWrite, can translate after. Although, requires another array scan. But for source maps do not use.
* license: bsd also, dojo foundation
* load error in Loader.js still propagate correctly?
* clean up readme

More tests from r.js dir

* shim in particular.
* paths config, are paths normalized?