# Reflect Architecture

The primary reflection is exposed through `Reflect` class. 
To reflect your app, create an instance of `Reflect` with the necessary setup. Register the modules that it has access to. Then use the reflect by calling `reflect.get()` or `reflect.put()` methods.

## Structure between Reflect, Ara Web and Ara.
Reflect package is based on `SDS` architectural rules. SDS architectural rules allowed us to create our app as a series of plugins and middlewares. 
For more info on how to
create your Reflect extensions or modifiers check the
[Reflect SDS](./REFLECT-SDS.md).

In this page as well as in the [Code level architecutre](./CODE-LEVEL-ARCHITECTURE.md) I will describe the internal structure of Reflect package. This is primarily for the Reflect
maintainers and contributors.

# Terminology and Decisions

## 1. Modules (source file)
The Reflect uses the Nodejs's convention to structurize the Nodejs based source code. In Nodejs, a source code is treated as a single module.
So, does reflect.

> Module = a single file.

### 1.1 Module Category (directory)
In the file system, files are groupped in the directories. In reflect each
module has a `category` property, that usually
matches to the directory, not mandatory though.

### 1.2 Module Link
A module link is a unique identifier of a module
within the web site.

Usually it's the an absolute file path to the module's file.

Often, nodejs apps depend on the third party packages
installed through `npmjs.com`.
In Reflect, they are also treated as a module or
set of modules. But to represent them, the module link
turns into a package url using `PURL` spec.

> Check the purl specification on [GitHub.com/package-url/purl-spec](https://github.com/package-url/purl-spec).

---

> Module Link = absolute file path | purl.

### 1.3 Module Content
Module content is the core. It's the JSON representation of a module.

But reflect doesn't have any tools to work with the content. All content manipulation goes through the extensions.
For example, [Reflect Astro Extension](../reflect-astro-ext/) supports conversion of
`.astro` files into `ReflectAstroExtension.Page` JSON
and vice-versa.

To identify which extension will generate the content, Reflect uses a module link and a module category.

> Tip:
> Before defining a content, identify all other memory parameters, especially the module's [code piece memory](#14-code-piece-memory).

### 1.3 Module Memory
Reflect keeps the module data such as JSON content, module category and module link in a memory.
Which makes them evailable for fast access by users.

#### 1.4 Code Piece Memory
Quite often, the module data is dynamic.
Rarely, a simply file from a server returned to the user.
A users request initiates multiple data transforms and the data is collected from multiple sources before being composed as a one document to respond with it back to the user.
To generate a web document or document elements from a module, Reflect must have to evaluate has to be run and the evaluated the module's scripting part.

Reflect provides `Code` module that
works with the module's scripting part. Code Level supports any Typescript syntax.

Before evaluating JSON content by extension, call the `Code` and identify all the scripting parts of the module. The Result is the list of Code Pieces stored by the identifiers in the script (function names, variable names, type or class names). When an extension is called to generate a module's JSON content, it will use CodePieces from memory to put in the dynamic parts of the Web Elements.

> For now, it only works with the Web Elements properties.

---
For more info on how the `Code` class is working [Code-level-architecutre](./CODE-LEVEL-ARCHITECTURE.md).

---
Additionally reflect provides the following Modules to work with

### Module File Path
> location `src/module.ts#FilePath`

The File Path is additional module
that provides various operations to work
with the file names.

### Module Path
> location `src/module.ts#ModulePath`

The Module Path is additional module that
provides various operations to work with the
module paths. The file path
is the low level, while module path
mostly works with the import clauses.

## 2. Project Memory
Project memory is just a wrapper over the Module Memory array providing various methods to filter out data without worrying which extension to call for necessary operations.

## 3. Reflect NodeJS Extension
The Reflect comes with the built in extension
that provides fine-grained access to the
NodeJS environment.

The NodeJS extension allows users to register
NPMJS packages available for reflect's validation process.

### 3.1 BuiltInIdentifiers
> location `src/built-in-identifiers.ts`
The built in identifiers generate an ready to use
parameters provided by NodeJS.
For example:
* `Array` generic
* `Record` generic

