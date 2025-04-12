// Do not write code directly here, instead use the `src` folder!
// Then, use this file to export everything you want your user to access.

export * from "./rpc"
export * from "./types"
export * as ExtensionsRedirect from "./extensions/redirect"
export * as ExtensionsAlert from "./extensions/alert"
import ComponentCall from "./components/call.astro"
import ComponentRpcCard from "./components/rpcCard.astro"

export const AstroComponentCall = ComponentCall;
export const AstroComponentRpcCard = ComponentRpcCard;