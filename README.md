# Ara Web

Ara Web is a collaboration tool 
that exposes it's source code to the user,
which users can customize using AI.
The result of customization, as well as collaboration efforts are
then published on the Blockchain.

To run the sample server that will us atomic data:

```
docker-compose run atomic-server export -p /atomic-storage-export/data.json
```

To run the development mode:

```
docker-compose up -d
```

## Features

- 🤖 End user made custom AI agents
- 📝 Ara Web is Open Source
- 🛠️ Blockchain based transparency
- 🔌 Community: contributors, freelancers or monetization
- 🔒 Secure by default

### Features of the Web

- Responsive design
- Scores A or A+ (depending on hosting and your images) on [Accessify](https://www.accessify.com/) and [Ecograder](https://ecograder.com/)
- Clean and minimal
- Fluid typography
- Dark and light mode (chosen by user's system preference)
- About page
- Now page (inspired by [nownownow.com](https://nownownow.com))
- Microblog for found links (Today I Found...)
- Blog for personal projects


## Getting Started

First, install the packages:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Guide
Using RPCs within the pages.
In order to use RPCs in the web pages, simply import the component.
The inputs to the components must be passed as the data

# Contribution

## Architecture
Let's first explain the components that made up the Ara Web.

The background is the same for all pages.
All pages have the same classic web layout: `Header`, `Content`, `Footer`.
Each layout also composed of three sections: `Left`, `Center`, `Right`.

### Terminology

* `slug` &ndash; indicates the unique path for the resource. Used for web pages and components within the page
* `path` &ndash; combination of one or more slugs that defines the URL of the component within the page
* `url` &ndash; indicates the Path of the web page
* `layout` &ndash; a web page composed of the rows
* `row` &ndash; a row of web components that is composed of the columns
* `column` &ndash; a column of the web page where we store the web components

---
Web Components
* `component` &ndash; 

**Read the below sections whenever you add a new component, page, action or RPC as a checklist**

### Page
To make the page valid for `src/scripts/page.ts` the `src/pages/**/*.astro` must have the [JSDoc](https://jsdoc.app/) comment at the beginning.

The comment must have three parameters:
* `@this Page` &ndash; indicate that this is the Page 
* `@param {string} Title ${text...}` &ndash; The title of the web page
* `@param {string} Description ${text...}` &ndash; The description of the web page

### Components
To make the components available, make sure that their `props` are always optional.
As the components list page won't pass any property during a rendering.

Also, update the component types in the `src/scripts/component.ts` to make sure list of components would detect it.

### RPCs

#### Creating in Ara Web
In order to create the RPC, create a new rpc script that defines RPC Types from `src/scripts/rpc/types.ts`.

Then, add it to the `src/scripts/rpc/index.ts` list.

> Todo: define what it calls and how it calls.
> For example, how to describe that redirect function is somewhere in the code.
> Or maybe to write a script and allow users to edit it, for example calling it as public_scripts.ts

#### Using the RPC
In order to use the RPC, we need to call it by passing inputs and optionally printing the outputs.
The pages can declare that they use extensions by importing the `src/components/rpc/call.astro` component.
The **Call** component receives the `src/scripts/rpc/types.ts>type RpcCallType` parameters as the component properties.
Simply pass them.

There are already predefined rpc calls defined as `type RpcCallType`. They are available in `src/scripts/rpc=>rpcBySlug(slug:string)`.

## Scripts
The scripts within the Ara Web are located in the `src/scripts` directory.
Currently only typescript scripts are supported.

## Reflection on the code itself
The `src/scripts/reflect` is a module that turns the code into a JSON, and vice versa
the JSON into the code.

It parses the data in the whole data structure of the web site and then turns it into the minimal components available for the user.

### Module
Each node.js file is called as a module.
*Reflect* supports various modules but not all due to safety or complexity reasons.
To navigate through the modules, they are categorized according to the directories.
For example, `Page` module category indicates the scripts (a.k.a modules) in the `src/pages` directory.

#### NodeJS Modules
Ara Web does support pre-built modules that consists the Ara Web itself.
The third-party modules (in `node_modules`) nor NodeJS built in modules are not supported by default.
But sometimes we need them as well. For example the icon components, or additional UI components.

Ara Web must know at the built time which of the third party modules you are going to use.
Therefore, we have the `src/scripts/reflect/enabledNodejsModule.ts` where
the supported modules are imported via the Vite plugin's glob pattern. 

> Contributor Tip
> To support the third party modules, double check them for security.
> Then, add them into the `src/scripts/reflect/enabledNodejsModule.ts` script.

### Links to other stuff
The pages are parsed through PageTraits in Reflect.
But PageTraits that wraps the Page with the Components, File Content and RPCs.
However, the RPCs and Components are defined outside of Reflect.

We need to make the Reflect internally without depending on other components.
And at the same time, we need to make sure the other modules are not depend on the Reflect.

---
## Checklist to add new script
If you are adding a new script other than Typescript, update the `src/scripts/reflect/script.ts` to support new extension.

---

## Component Engine
```
pnpm install @ara-web/component-engine
```

The component engine converts the Web Framework's Node's to the Ara Web Ontology Components.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Customization

- Add your own avatar in the `public/` directory
- Edit `src/config.ts` to use your website, name, and description
- Edit pages in `src/pages/`
- Modify the layout in `src/layouts/Layout.astro`
- Update styles in the respective component files
- Make your own favicons with https://realfavicongenerator.net/

## Colors

The colors were chosen using several tools to insure accessibility and contrast. The colors are all set using variables for dark and light in the global.css file. Personally, I created the palletes and gradients using these tools:

- https://colorffy.com/color-scheme-generator
- https://www.learnui.design/tools/accessible-color-generator.html
- https://colorffy.com/mesh-gradient-generator (for the background gradient)

---
## Credits

Built by Tim Eaton - [timeaton.dev](https://timeaton.dev).

Anonymous Avatar by <a href="/photographer/maniskis12-68558">maniskis12</a> on <a href="/">Freeimages.com</a>

All dummy text and posts generated with Claude AI.

## License

MIT
