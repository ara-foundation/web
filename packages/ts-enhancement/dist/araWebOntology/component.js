/**
 * Global Shared Data Types of Ara
 */
import {} from "./rpc.js";
import { AraLink } from "../ara-link/types.js";
/**
 * What kind of component it is?
 */
export var ComponentIdentity;
(function (ComponentIdentity) {
    ComponentIdentity["Rpc"] = "rpc";
    ComponentIdentity["Layout"] = "layout";
    ComponentIdentity["Component"] = "component";
    ComponentIdentity["Expression"] = "expression";
    ComponentIdentity["Undeclared"] = "undeclared";
})(ComponentIdentity || (ComponentIdentity = {}));
