# Reflect Architecture

The primary reflection is exposed through `Reflect` class. 
To reflect your app, create an instance of `Reflect` with the necessary setup. Register the modules that it has access to. Then use the reflect by calling `reflect.get()` or `reflect.put()` etc.

## Structure between Reflect, Ara Web and Ara.
Reflect package is based on `SDS` architecture modelling. SDS architecture allowed us to create our app as a series of plugins and middlewares. 
For more info on how to
create your Reflect extensions or modifiers check the
[Reflect SDS](./REFLECT-SDS.md).

In this page as well as in the [Code level architecutre](./CODE-LEVEL-ARCHITECTURE.md) I will describe the internal structure of Reflect package. This is primarily for the Reflect
maintainers and contributors.

# Terminology and Decisions

## 1. Modules (source file)
The Reflect uses the Nodejs's convention to structurize the Nodejs based source code. In Nodejs, a source code is treated as a single module.
So, in reflect any source code is treated as a Module.

> Module = a single file.

### 1.1 Module Category (directory)
In the file system, files are groupped in the directories. In reflect, instead directory, each
module has a `category` property usually
matching to the directory, not mandatory though.

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
> Before defining a content, identify all other memory parameters, especially the module's [ast node memory](#14-ast-node-memory)

### 1.3 Module Memory
Reflect keeps all module data such as JSON content, module category and module link in memory.

#### 1.4 Ast Node Memory
Quite often, the module data is dynamic. To generate a web components,  a module has to be run and the evaluated result is then used to generate the properties of the web elements.

Reflect provides `Code` that
works with the module's script. Code supports any Typescript syntax.

Before evaluating JSON content by extension, call the `Code` and identify all the scripting part of the module. The Result is the list of AST nodes matched to the identifiers (function names, variable names, type or class names). When an extension wants to generate a content, it will use
the Ast node identifiers to know what to put in the code.

---
For more info on how the `Code` class is working [Code-level-architecutre](./CODE-LEVEL-ARCHITECTURE.md).

---
Globally exposes additional modules related to a work on modules.

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
Project memory is just a wrapper over the Module Memory array providing various methods to filter out module memory.

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

