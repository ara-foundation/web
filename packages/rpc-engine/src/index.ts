// Do not write code directly here, instead use the `src` folder!
// Then, use this file to export everything you want your user to access.

export * from "./rpc.js"
export * from "./types.js"
export * as ExtensionsRedirect from "./extensions/redirect.js"
export * as ExtensionsAlert from "./extensions/alert.js"
import ComponentCall from "./components/call.astro"
import ComponentRpcCard from "./components/rpcCard.astro"
export const AstroComponentCall = ComponentCall;
export const AstroComponentRpcCard = ComponentRpcCard;