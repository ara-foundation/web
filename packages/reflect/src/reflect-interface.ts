import type { SDSServiceInterface } from "@ara-web/sds";
import type { RestReflectHookProxy } from "./rest-reflect-hook-proxy.js";

export interface ReflectInterface extends SDSServiceInterface {
    rest: RestReflectHookProxy;
}