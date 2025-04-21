/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { TypeReferenceNode } from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Result, Debug, type ObjectLikeKeyValue } from "@ara-web/ts-enhancement";
import { ReflectAraLink } from "../../ara-link/ReflectAraLink.js";
import { TsNode } from "../ts-node.js";
import { TypeValueTraits } from "./type-value-traits.js";
import type { ValueType } from "../ast-node-data.js";

export class TypeRef extends TsNode {
    public static readonly GENERIC_VALUES_LINK_PROPERTY = "generic_values";
    protected _tsNode: TypeReferenceNode;
    
    private constructor (tsNode: TsNode) {
        super(tsNode);

        this._tsNode = tsNode.getNode<TypeReferenceNode>()!;
    }

    public static isTypeRef = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TypeReferenceNode;
    }

    public static genericValuesToLinkProperty = (values: ValueType[]): ObjectLikeKeyValue => {
        return {[this.GENERIC_VALUES_LINK_PROPERTY]: values};
    }

    public static linkPropertyToGenericValues = (araLink: AraLink<string>): ValueType[] => {
        if (!araLink.isPropertyExist(this.GENERIC_VALUES_LINK_PROPERTY)) {
            return [];
        }

        const genericValues = araLink.property(this.GENERIC_VALUES_LINK_PROPERTY);
        if (genericValues === undefined) {
            return [];
        }
        if (!Array.isArray(genericValues)) {
            return [];
        }

        return genericValues
    }

    public static fromTsNode(tsNode: TsNode): Result<TypeRef> {
        if (!this.isTypeRef(tsNode)) {
            return Result.fail(
                `The given node is not import declaration`,
                `Please check the ts node`
            )
        }
        const importDeclaration = new TypeRef(tsNode);
        return Result.ok(importDeclaration)
    }

    /**
     * Checks does the given node has '<SyntaxList>' generic declaration syntax
     * @requires TsNode.node is TypeReferenceNode
     * @param tsNode 
     * @returns 
     */
    private isGenericRefType = (): boolean => {
        const children = this.getChildren([], [TsNode.isNonImportant]);
        if (children.length !== 4) {
            return false;
        }
        return (children[1].getText() === "<" && children[3].getText() === ">");
    }

    /**
     * Returns the syntax list as TsNode that is between '<' and '>' in Typescript
     * @param typeRefNode 
     * @requires the tsNode.node must be TypeReferenceNode
     * @returns 
     */
    private genericRefValueNodes = (): TsNode[] => {
        if (!this.isChildExist(2)) {
            return [];
        }
        return this.getChild(2)!.getChildren([], [TsNode.isNonImportant], [","]);
    }

    /**
     * 
     * @param typeLink 
     * @param typeRefNode 
     * @returns 
     */
    private identifyGenericRefValue = (typeLink: AraLink<string>): Result<AraLink<string>> => {
        const nodes = this.genericRefValueNodes();
        const nodeValues: ValueType[] = [];
        for (let nodeIndex in nodes) {
            const node = nodes[nodeIndex]
            const nodeValue = TypeValueTraits.identifyTypeValue(node)
            if (nodeValue.isFailure) {
                return Result.fail(
                    `Generic key ${nodeIndex}) TypeValueTraits.identifyTypeValue(expression: '${this.getText()}'): ${nodeValue.errorTitle}`,
                    nodeValue.errorDescription!
                )
            }
            nodeValues.push(nodeValue.getValue())
        }

        const genericValuesProperty = TypeRef.genericValuesToLinkProperty(nodeValues);
        return Result.ok(typeLink.copyWithProperties(genericValuesProperty))
    }

    // TsNode is TypeReferenceNode>
    public getAraLink = (): Result<AraLink<string>> => {
        if (!this.isChildExist(0)) {
            return Result.fail(
                `The Node expected to have child`,
                `But referenced type node doesn't have child at index '0'`
            )
        }

        const identifierNode = this.getChild(0)!;

        if (!TsNode.isIdentifier(identifierNode)) {
            const err = Debug.error(
                `The property value type is a type reference, but the '${this.getText()}' doesn't support it`,
                `Ara Web supports Identifiers as type ref nodes, update getAraLink() to support it`,
                identifierNode
            )
                
            return Result.fail(err)
        }

        const typeRefAraLink = ReflectAraLink.linkToIdentifier(identifierNode.getText());

        if (this.isGenericRefType()) {
            const identifiedGenericValue = this.identifyGenericRefValue(typeRefAraLink);
            if (identifiedGenericValue.isFailure) {
                return Result.fail(
                    `this.identifyGenericRefValue(): ${identifiedGenericValue.errorTitle}`,
                    identifiedGenericValue.errorDescription!
                )
            } 
            return Result.ok(identifiedGenericValue.getValue())
        }
        return Result.ok(typeRefAraLink);
    }
}