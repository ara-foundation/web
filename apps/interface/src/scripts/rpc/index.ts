/**
 * RPCs are stored in the scripts to avoid
 * collision with the Astro Framework's Actions.
 */

export enum RpcType {
    Extension = "extension",
    Independent = "independent",
    Proxy = "proxy"
}