/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { TypeReferenceNode } from "ts-morph";
import { AraLink, Result, Debug } from "@ara-web/ts-enhancement";
import { Identifier, CodeLink, TsNode, TypeLevel } from "../index.js";
import { TypeValueTraits } from "./type-value-traits.js";
export class TypeRef extends TsNode {
    _tsNode;
    constructor(tsNode) {
        super(tsNode);
        this._tsNode = tsNode.getNode();
    }
    static isTypeRef = (child) => {
        const node = child.getNode();
        return node instanceof TypeReferenceNode;
    };
    static fromTsNode(tsNode) {
        if (!this.isTypeRef(tsNode)) {
            return Result.fail(`The given node is not import declaration`, `Please check the ts node`);
        }
        const importDeclaration = new TypeRef(tsNode);
        return Result.ok(importDeclaration);
    }
    /**
     * Checks does the given node has '<SyntaxList>' generic declaration syntax
     * @requires TsNode.node is TypeReferenceNode
     * @param tsNode
     * @returns
     */
    isGenericRefType = () => {
        const children = this.getChildren([], [TsNode.isNonImportant]);
        if (children.length !== 4) {
            return false;
        }
        return (children[1].getText() === "<" && children[3].getText() === ">");
    };
    /**
     * Returns the syntax list as TsNode that is between '<' and '>' in Typescript
     * @param typeRefNode
     * @requires the tsNode.node must be TypeReferenceNode
     * @returns
     */
    genericRefValueNodes = () => {
        if (!this.isChildExist(2)) {
            return [];
        }
        return this.getChild(2).getChildren([], [TsNode.isNonImportant], [","]);
    };
    /**
     *
     * @param typeLink
     * @param typeRefNode
     * @returns
     */
    identifyGenericRefValue = async (typeLink) => {
        const nodes = this.genericRefValueNodes();
        const nodeValues = [];
        for (let nodeIndex in nodes) {
            const node = nodes[nodeIndex];
            const nodeValue = await TypeValueTraits.identifyTypeValue(node);
            if (nodeValue.isFailure) {
                return Result.fail(`Generic key ${nodeIndex}) TypeValueTraits.identifyTypeValue(expression: '${this.getText()}'): ${nodeValue.errorTitle}`, nodeValue.errorDescription);
            }
            nodeValues.push(nodeValue.getValue());
        }
        const genericValuesProperty = TypeLevel.genericValuesToLinkProperty(nodeValues);
        return Result.ok(typeLink.copyWithProperties(genericValuesProperty));
    };
    // TsNode is TypeReferenceNode>
    getAraLink = async () => {
        if (!this.isChildExist(0)) {
            return Result.fail(`The Node expected to have child`, `But referenced type node doesn't have child at index '0'`);
        }
        const identifierNode = this.getChild(0);
        if (!Identifier.isA(identifierNode)) {
            const err = Debug.error(`The property value type is a type reference, but the '${this.getText()}' doesn't support it`, `Ara Web supports Identifiers as type ref nodes, update getAraLink() to support it`, identifierNode);
            return Result.fail(err);
        }
        const typeRefAraLink = CodeLink.linkToIdentifier(identifierNode.getText());
        if (this.isGenericRefType()) {
            const identifiedGenericValue = await this.identifyGenericRefValue(typeRefAraLink);
            if (identifiedGenericValue.isFailure) {
                return Result.fail(`this.identifyGenericRefValue(): ${identifiedGenericValue.errorTitle}`, identifiedGenericValue.errorDescription);
            }
            return Result.ok(identifiedGenericValue.getValue());
        }
        return Result.ok(typeRefAraLink);
    };
}
