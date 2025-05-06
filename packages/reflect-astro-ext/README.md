# Reflect Astro Extension
Reflect the [Astro Framework](https://astro.build/) website to represent the website as a JSON and vice-versa, to generate website code from JSON. ;)

Possible use case:
- Edit the web pages, add new pages on your website, this package will generate the code in the file system.
- The cheapest AI interface for your web page, since AI works with the JSON representation
- Clean code, less code since admin panel is just made with the few NPM packages.

> Requires `@ara-web/reflect`

# Module Meta data
To add *title* and *description*

# Roadmap

Components
* Make sure to parse the components to the respected areas in the slots.
* Add Ara Web extension to detect the Ara Web Component Category description (predefined)
* Add Ara Web extension to detect the RPC components.
> RPC related code is commented at `src/component-level/index.ts`.
> Another related RPC code is in the `@ara-web/rpc-engine` package.

Layouts
* Make sure to generate layouts by nesting all as a single layout.

AI
* Add extension that allows to use Claude Sonnet to support the explanation of the SVG, use it to generate the description of the asset
* Add AI to generate the description of the pages
