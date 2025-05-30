# SDS
**SDS** is a package that helps you turn your app into a plug-and-play system. It lets others:

- **Add Plugins Easily**: Developers can write plugins to add new features without changing your code.
- **Customize Interfaces**: Use proxies to expose your service as a CLI, HTTP API, or other interfaces, separate from your core logic. Proxies can also add things like validation or authentication.
- **Module under the hood**: Write your apps thinking about your business logic, without worry about modularity. SDS helps to scale and refactor your app.

SDS is for you if you want:
- you want others (even your own team) to build plugins or extensions on top of your app.
- writing a monolith—focus on your MVP or demo without worrying about scalability. When you’re ready to grow, SDS helps you scale on demand. Instead of throwing away your early code, use it as the blueprint for your startup and evolve it into a modular, extensible system.

See the [Reflect](https://github.com/ara-foundation/web/tree/main/packages/reflect/README.md) package for a real-world example.

Additionally SDS package includes:
- 📝 **Link**: A series of modules to provide a universal URL for your data and code.
    - Ara Link: A generic link to any resource.
    - Module Link: A link to a file or module, used for module IDs. It's based on package URL.
    - Object Link: A universal link to your app's data or source code.
- 📝 **Restful SDS**: Create a Rest API for your app or data.
    - Need to call `/dir/sub_dir/module.method`? Then use: `rest.get!('dir > sub_dir > method')()`

> As a separate module, the Restful SDS documentation is defined in [REST.md](./REST.md). Here I describe the SDS only.

### Understanding SDS
Let's first define our terminology.
A standalone app in SDS is called a **service**.
It's a synonymous of a Package, App, Library, 
etc.

Each service (app) is composed of the modules. A **module** is a synonymous of the source code, a namespace or object.

SDS has few rules for services and for modules.

#### Services
SDS defines three types of services:
* A service that keeps the business logic. It's called a simply as a service, or independent service. Example of independent services: *blog*, *game backend*, *todo list* etc.
* An extension is another type of service. Extension's only talk to the independent service, and no other entities could connect to it. Example of the extensions are: *database*, *leaderboard* etc. Usually extensions are handling the side things that is independent from the business logic. For example, if your app is the blog, then extension is the place that saves the data. Optimize, or replace the extension if you migrate your data, without breaking the code logic.
* A proxy is the third type of the service. A proxy only works with the independent service. It hides the independent service, and provides another interface for your app users. Example of the proxy: *a cli*, *http router*, *ddos-preventer*, *authentication*, *cache*.

#### Service rules:
* If a service has a proxy, then the app methods are available for the proxy. Proxy could organize a chain of proxies each doing its task.
* A proxy either forwards to the next proxy or independent service, or returns its own data.
* If a service has an extension, then independent service could send a data to the extension, and optionally receive it back.
* All interactions are initiated by the independent service, never by the extension. Although whether to return back the information or not to the independent service is optional. It could be a one way interaction. Basically, extensions are managed by the independent service.

> Any third party apps that your app depends on (for example database, OTP authentication, third party API) always interact using the extensions. This way your business logic will be independent from the api.

#### Module rules
Modules are the source codes. The rules for modules are:
- A module can import siblings in the same directory.
- It can import its own index file or its parent’s index.
- It cannot import other child modules, named parent modules, or anything from a grandparent.

> The [SDS Restful](./REST.md) module is another way how your modules could connect to another modules that doesn't follow the sds module rule. If your object depends on another object that is defined on another directory, then preferably interact with it using Restful api.

---
That's all the rules to write modular app without worry.
You start by writing your app as an sds service. As you want to add more features, that is not related to the business logic, but necessary for functional work, add as the proxy or extension.

Each service wether it's independent service, extension or proxy organize using the module rules. That will make your code as the tree node.

## Tutorial

This tutorial shows how to make your app plug-and-play and open to community contributions.

### 1. Setting Up Your App

Start by setting up your app with its name, description, proxies, and extensions.

```typescript
import { Express } from "express";
import { ModuleLink, type Setup } from "@ara-web/sds";
import { dbCredentials } from "./config.js";
// Defined an authentication using Openapi, so that users
// could authenticate using social network accounts
import { AuthProxy } from "@game-company/chess-auth-proxy";
// Package that defines the caching.
import { WebProxy } from "@ara-web/sds-web-proxy";
// Package that saves the chess sessions, leaderboards in the database
import { DbExt } from "@game-company/chess-db-ext";
// Package that defines a chess AI, if user wants to play against the bot.
import { AiExt } from "@game-company/chess-ai-ext";

// Universal ID of the service by purl specification.
const backgammonUrl = ModuleLink.newPackageLink("game-company", "chess-backend");

const authProxy = new AuthProxy(import.meta.env);
const webProxy = new WebProxy({
    get: [
        "session",
        "start",
        "resume",
    ],
    post: [
        "move",
    ]
});
const dbExt = new DbExt(dbCredentials);
const aiExt = new AiExt();

```

### 2. Defining a Service

Each app is a class that extends `Service`.

```typescript

class Chess extends Service {
    constructor(setup: Setup) {
        super(setup, ["start", "move", "resume", "session"]);
    }

    // Below are the functions of the game logic.
    start?(userId: string, againstBot?: boolean): SessionID;
    move?(userId, gameId, movement): Error|undefined;
    resume?(userIdOrSessionId): SessionID;
    session?(sessionID): Session;
```

Suppose we implemented the body of the functions, perhaps using the AI's help. Let's run our chess.

```ts
const chessSetup: Setup = {
    packageLink: backgammonUrl,
    proxies: [webProxy, authProxy],
    extensions: [aiExt, dbExt],
}
const chess = new Chess(chessSetup);
const chessWeb = await chess.proxifyMe<Express>();

chessWeb.run();
```

Voila!
Still not clear? Ask me a question, or help me to improve the documents by emailing me at `medet@ara.foundation`. In the title, write `SDS` so that bot don't throw it into the spam. As my email is public, someone will send an unnecessary information.

# Roadmap
- Parse and serialize IDs in REST calls.
- Add a script to generate SDS interactively with `pnpm create sds`.
- Allow AI agents to add descriptions later, using object IDs and REST operations.