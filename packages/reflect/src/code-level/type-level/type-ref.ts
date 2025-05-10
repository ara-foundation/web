/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 */
import { TypeReferenceNode, Node } from "ts-morph";
import { AraLink, Result, Debug } from "@ara-web/p-hintjens";
import { Identifier, ReflectLink, AstNodeTraits, type ValueType, TypeLevel } from "../index.js";
import { TypeValueTraits } from "./type-value-traits.js";

export class TypeRef {
    protected _tsNode: TypeReferenceNode;
    
    private constructor (tsNode: TypeReferenceNode) {
        this._tsNode = tsNode;
    }

    public static isTypeRef = (node: Node): boolean => {
        return node instanceof TypeReferenceNode;
    }

    public static fromTsNode(tsNode: Node): Result<TypeRef> {
        if (!this.isTypeRef(tsNode)) {
            return Result.fail(
                `The given node is not import declaration`,
                `Please check the ts node`
            )
        }
        const importDeclaration = new TypeRef(tsNode as TypeReferenceNode);
        return Result.ok(importDeclaration)
    }

    /**
     * Checks does the given node has '<SyntaxList>' generic declaration syntax
     * @requires Node as TypeReferenceNode
     * @param tsNode 
     * @returns 
     */
    private isGenericRefType = (): boolean => {
        const children = AstNodeTraits.getChildren(this._tsNode, [], [AstNodeTraits.isNonImportant]);
        if (children.length !== 4) {
            return false;
        }
        return (children[1].getText() === "<" && children[3].getText() === ">");
    }

    /**
     * Returns the syntax list as Node that is between '<' and '>' in Typescript
     * @param typeRefNode 
     * @requires the tsNode.node must be TypeReferenceNode
     * @returns 
     */
    private genericRefValueNodes = (): Node[] => {
        if (!AstNodeTraits.isChildExist(this._tsNode, 2)) {
            return [];
        }
        return AstNodeTraits.getChildren(this._tsNode.getChildAtIndex(2)!, [], [AstNodeTraits.isNonImportant], [","]);
    }

    /**
     * 
     * @param typeLink 
     * @param typeRefNode 
     * @returns 
     */
    private identifyGenericRefValue = async (typeLink: AraLink<string>): Promise<Result<AraLink<string>>> => {
        const nodes = this.genericRefValueNodes();
        const nodeValues: ValueType[] = [];
        for (let nodeIndex in nodes) {
            const node = nodes[nodeIndex]
            const nodeValue = await TypeValueTraits.identifyTypeValue(node)
            if (nodeValue.isFailure) {
                return Result.fail(
                    `Generic key ${nodeIndex}) TypeValueTraits.identifyTypeValue(expression: '${this._tsNode.getText()}'): ${nodeValue.errorTitle}`,
                    nodeValue.errorDescription!
                )
            }
            nodeValues.push(nodeValue.getValue())
        }

        const genericValuesProperty = TypeLevel.genericValuesToLinkProperty(nodeValues);
        return Result.ok(typeLink.copyWithProperties(genericValuesProperty))
    }

    // Node is TypeReferenceNode>
    public getAraLink = async (): Promise<Result<AraLink<string>>> => {
        if (!AstNodeTraits.isChildExist(this._tsNode, 0)) {
            return Result.fail(
                `The Node expected to have child`,
                `But referenced type node doesn't have child at index '0'`
            )
        }

        const identifierNode = this._tsNode.getChildAtIndex(0)!;

        if (!Identifier.isA(identifierNode)) {
            const err = Debug.error(
                `The property value type is a type reference, but the '${this._tsNode.getText()}' doesn't support it`,
                `Ara Web supports Identifiers as type ref nodes, update getAraLink() to support it`,
                identifierNode
            )
                
            return Result.fail(err)
        }

        const typeRefAraLink = ReflectLink.linkToIdentifier(identifierNode.getText());

        if (this.isGenericRefType()) {
            const identifiedGenericValue = await this.identifyGenericRefValue(typeRefAraLink);
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