# Ara Web

Inspirational?
If the terminology is specific, write the definitions in my own words
for eli5.

Ara Web's goal is to decentralize software ownership.
It's a project management tool that exposes itself to the user.

But instead of manual source code management,
Ara Provides various AI assistants to boost the efficiency of your project development.

As a backend, Ara could connect to the blockchain, where it stores all the code changes, code data. We also want to create specific blockchain on our roadmap that will include a hyperpayment protocol.
This allows a fee distribution across all packages and changes made by users on your project. This blockchain distributes the funds to all contributors. Which means,
building a thriving open source economy on a global scale

To run the sample server that will us atomic data:

```
docker-compose run atomic-server export -p /atomic-storage-export/data.json
```

To run the development mode:

```
docker-compose up -d
```

## Goals

- 🤖 End user made custom AI agents
- 📝 All code dependencies stored on the blockchain.
- 🛠️ Hyperpayment protocol
- 🔌 Community: contributors, freelancers or monetization
- 🔒 Secure by default

### Features of the Web

- Responsive design
- Fluid typography

## Getting Started

First, install the packages:

```bash
pnpm install
```

Then, run the development server:

```bash
turbo dev --filter "@ara-web/interface"
```

Open [http://localhost:4321](http://localhost:4321) with your browser to see the result.

# RPC Guide

Using RPCs within the pages.
In order to use RPCs in the web pages, simply import the component.
The inputs to the components must be passed as the data

# Contribution
Ara Web is based on the `Reflect` package along with the `Reflect Astro Proxy`. Additionally to support the ara specific data, Ara Web Proxy is connected by the extensions. The RPC Engine that detects the RPCs components. The component engine that exposes the component categories.
The action engine that exposes the actions.

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
- Edit `src/config.ts` to use your website, name, and description
- Make your own favicons with https://realfavicongenerator.net/

## Colors

The colors were chosen using several tools to insure accessibility and contrast. The colors are all set using variables for dark and light in the global.css file. Personally, I created the palletes and gradients using these tools:

- https://colorffy.com/color-scheme-generator
- https://www.learnui.design/tools/accessible-color-generator.html
- https://colorffy.com/mesh-gradient-generator (for the background gradient)

---
## License

MIT

# Roadmap
* Use the SDS Linter proxy in all packages.
* Publish the Reflect.
* Setup the CI/CD pipeline that pushes the tag to the github using `package.json` version and name properties. The pipeline also increments the version.
* Announce to the users about Reflect.
* Announce the SDS framework.
* *Make SDS as it's own package to extend and use by others that makes sure to turn any package into SDS*. The title of the package would be, "A package that allows creating plugins, middlewares for your app. If you wanted to allow community to build plugins, use SDS". And, we need to use it to turn Proxy into an SDS.
* Move out anything related to the Ara Web from `ts-enhancement`.