# Reflect SDS
The primary reflect is exposed through `Reflect` class. 
To reflect your app, use the instance of `Reflect`, then by calling `reflect.get()` or `reflect.put()`.

This document describes how to extend the Reflect 
by adding your own custom plugins.

> Prerequirements
> Familiarity with the SDS.
> Check the short description of [SDS.md](../p-hintjens//SDS.md)

## Structure between Reflect, Ara Web and Ara.
Reflect package is based on `SDS` architecture modelling.

# Extending

## Adding an extension
Create a package that extends `ExtensionInterface` from `@ara-web/reflect`.
The example of built in reflect extension is in the `src/reflect-nodejs-ext`.

The extensions's could add support of new modules, to use AI to generate description.
Or to save the data outside.

## Proxy
Create a proxy by extending `ReflectProxy` class from `@ara-web/reflect`.

Proxies, are similar to midldeware, but proxies hide the Reflect behind proxy interface.
Reflect proxies may add new methods, over-write the Reflect's own methods, or return absolutely new data. For example, through the proxy,
reflect could be converted into a middleware of another program, into a CLI project, into an HTTP Endpoints etc.

Once you published your own Reflect proxy on NPM,
or found another proxy made by other internet peeps, you need to
add it as the proxy of Reflect and then proxify the Reflect itself:

```typescript
import { Reflect } from "@ara-web/reflect";
import { YourOwnProxy } from "@org.com/your-own-proxy";

const yourOwnProxy = new YourOwnProxy();
const reflect = new Reflect({proxies: [yourOwnProxy]});
```

*Trying to call `reflect.get` will fail, since proxy hided it*.
Instead, we need to call `reflect.proxifyMe`:

```typescript
const proxifiedReflect = reflect.proxifyMe<YourOwnProxy>();
```
Now, we can interact with our Proxy instance that internally may access into Reflect.

Follow the tutorial to create your proxy: [Create Reflect Proxy Tutorial](./PROXY.md)

