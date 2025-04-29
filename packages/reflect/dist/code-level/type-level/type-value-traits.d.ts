import { AraLink, Result } from "@ara-web/ts-enhancement";
import { TsNode, type TsNodeValidator, TypeDeclaration, ValueTypeString, UnionTypeDeclaration, type IdentifiedNodeDataType, type LiteralType } from "../index.js";
export type PossibleTypeValue = ValueTypeString | AraLink<string> | TypeDeclaration | Array<IdentifiedNodeDataType> | LiteralType | UnionTypeDeclaration;
/**
 * TypeValueTraits parses the type's parameters.
 * Supports TypeLiterals, TypeUnions and ArrayTypes.
 *
 * TODO: Move the parts of linting here too.
 */
export declare class TypeValueTraits {
    static readonly ERR_INVALID_INTERSECTION = "TypeValueTraits.Invalid_intersection";
    /**
     * Checks whether the data is literal such as a number, string or a boolean.
     * @param data to check
     * @returns
     */
    static isTypeDeclaration: (data?: PossibleTypeValue) => boolean;
    static isTypeLiteral: TsNodeValidator;
    static isArrayTypeDeclaration: (child: TsNode) => boolean;
    static isUnionType: (child: TsNode) => boolean;
    static isLiteralType: TsNodeValidator;
    static isParenthesizedType: TsNodeValidator;
    static isIntersectionType: TsNodeValidator;
    /**
     * ArrayType syntax that it parses with three children:
     * - Identifier
     * - [
     * - ]
     * @param tsNode
     * @returns {[IdentifiedNodeDataType] } either a link to
     */
    static identifyArrayType: (tsNode: TsNode) => Promise<Result<Array<IdentifiedNodeDataType>>>;
    private static identifyExpression;
    private static identifyLiteralType;
    private static identifyParenthesizedType;
    private static identifyIntersectionType;
    static identifyTypeValue: (tsNode: TsNode) => Promise<Result<PossibleTypeValue>>;
    private static identifyTypeLiteral;
    private static identifyUnionType;
    private static propertySignatureToTypeDeclaration;
}
