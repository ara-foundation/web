import { type ObjectToNodeTree, type ElementOp } from "@ara-web/sds";
import { CodePiece } from "./code-level/index.js";
export declare const moduleToObjectTree: ObjectToNodeTree<CodePiece>;
export declare const MODULE_SELECTOR = "*:nth-child(1) >";
export declare const codePieceOps: ElementOp<CodePiece>;
