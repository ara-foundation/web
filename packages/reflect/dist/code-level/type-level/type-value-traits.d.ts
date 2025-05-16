/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { Node } from "ts-morph";
import { AraLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { type AstNodeFilter, UserTypeDeclaration, ValueTypeString, UnionTypeDeclaration, type IdentifiedNodeDataType, type LiteralType } from "../index.js";
export type PossibleTypeValue = ValueTypeString | AraLink<string> | UserTypeDeclaration | Array<IdentifiedNodeDataType> | LiteralType | UnionTypeDeclaration;
/**
 * TypeValueTraits parses the type's parameters.
 * Supports TypeLiterals, TypeUnions and ArrayTypes.
 */
export declare class TypeValueTraits {
    static readonly ERR_INVALID_INTERSECTION = "TypeValueTraits.Invalid_intersection";
    /**
     * Checks whether the data is literal such as a number, string or a boolean.
     * @param data to check
     * @returns
     */
    static isTypeDeclaration: (data?: PossibleTypeValue) => boolean;
    static isTypeLiteral: AstNodeFilter;
    static isArrayTypeDeclaration: (node: Node) => boolean;
    static isUnionType: (node: Node) => boolean;
    static isLiteralType: AstNodeFilter;
    static isParenthesizedType: AstNodeFilter;
    static isIntersectionType: AstNodeFilter;
    /**
     * ArrayType syntax that it parses with three children:
     * - Identifier
     * - [
     * - ]
     * @param tsNode
     * @returns {[IdentifiedNodeDataType] } either a link to
     */
    static identifyArrayType: (tsNode: Node) => Promise<Result<Array<IdentifiedNodeDataType>>>;
    private static identifyExpression;
    private static identifyLiteralType;
    private static identifyParenthesizedType;
    private static identifyIntersectionType;
    static identifyTypeValue: (tsNode: Node) => Promise<Result<PossibleTypeValue>>;
    private static identifyTypeLiteral;
    private static identifyUnionType;
    private static propertySignatureToTypeDeclaration;
}
