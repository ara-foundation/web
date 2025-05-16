# Reflect Astro Extension
Reflect the [Astro Framework](https://astro.build/) website to represent the website as a JSON and vice-versa, to generate website code from JSON. ;)

Possible use case:
- Edit the web pages, add new pages on your website, this package will generate the code in the file system.
- The cheapest AI interface for your web page, since AI works with the JSON representation
- Clean code, less code since admin panel is just made with the few NPM packages.

> Requires `@ara-web/reflect`

# Module Meta data
To add *title* and *description*

## Module Parts (For Astro Extension)
Module data added into Reflect internally converted into module parts
that differentiate various parts, primarily the scripting part, and
Web elements.

Reflect will first create the `Code` from the module's scripting part
and identify all declared values, all imported modules and update the
module's memory with the result of script.

After the code, Reflect will parse the module as the JSON using the `UI-level` modules.
For example, in astro, it first converts all modules into `Page`.
Then pages are converting `Component`, while component itself 
converts the `Attribute`.

At the end, when all data is pre-defined, the module will make sure
to lint the data between modules.

## Astro Adapter & page-level/PageAdapter
Adapters are converting Astro and Page JSON into object nodes compatible with the `css-select` package.
Using REST or LinkTraits, you can look up for an object using `CSS Selectors`.

# Roadmap
* Remove `PageLevel.walk` after installing REST operator.

Components
* Add Ara Web extension to detect the Ara Web Component Category description (predefined)
* Add Ara Web extension to detect the RPC components.
> RPC related code is commented at `src/component-level/index.ts`.
> Another related RPC code is in the `@ara-web/rpc-engine` package.

Layouts
* Make sure to generate layouts by nesting all as a single layout.

AI
* Add extension that allows to use Claude Sonnet to support the explanation of the SVG, use it to generate the description of the asset
* Add AI to generate the description of the pages
