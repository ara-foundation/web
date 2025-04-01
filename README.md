# Ara Web

Ara &ndash; Build Modular Apps, share your experience and get help from others.

A collaboration platform with the financial transparency, community building and custom AI agents for your needs.

To export the data:

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

### Scripts
The scripts within the Ara Web are located in the `src/scripts` directory.
Currently only typescript scripts are supported.

#### Checklist to add new script
If you are adding a new script other than Typescript, update the `src/scripts/reflect/script.ts` to support new extension.

---

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
