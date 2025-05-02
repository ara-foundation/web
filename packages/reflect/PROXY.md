# Reflect Proxy
Proxy is a terminology from the SDS Architectural rules. SDS Architecture is a short, simple set of rules on code organization, and dependency management that makes the code easily organized.

When making your program extendable usually
there are two ways to extend it, either through
middlewares, or through the plugins.

In SDS, the plugins are called extensions, while
middlewares are replaced by the proxies.

> We won't talk much about SDS, and extensions, from now own this document will focus only on Proxies.

However, middlewares are injected into the app.
Consider any modern backend frameworks that provide middlewares for authentication, data validation.
In SDS, proxy is a new object that if added, hides the main app behind it by exposing it's own interface. For the end user, proxy is what he gets.

> Check the [README](./README.md) for tutorial how to use Proxy.

## Proxy example
Let's create an eslint plugin that lints the SDS Linter.

Check the [Eslint SDS Linter](../eslint-sds-linter/README.md) for an example.