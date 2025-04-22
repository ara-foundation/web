/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { 
    Node,
    TypeAliasDeclaration,
    TypeParameterDeclaration,
} from "ts-morph";
import { StringTraits, Result, Debug } from "@ara-web/ts-enhancement";
import { AstNode, AstNodeType, type TypedData } from "./ast-node.js";
import { 
    ValueTypeString, 
    type ValueType, 
    UnionTypeDeclaration, 
    type IdentifiedNodeDataType, 
    IntersectedUnionType,
    TypeDeclaration as TypeDeclarationData
} from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { TypeValueTraits } from "./type-level/type-value-traits.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../ara-link/ReflectAraLink.js";
import { TypeRef } from "./type-level/type-ref.js";
import type { AstNodeContext } from "../memory/AstNodeContext.js";
import { Identifier } from "./value-level/idenitifier.js";

export class TypeDeclaration extends TsNode {
    protected _tsNode: TypeAliasDeclaration;
    
    private constructor (tsNode: TsNode) {
        super(tsNode);

        this._tsNode = tsNode.getNode<TypeAliasDeclaration>()!;
    }

    public static fromTsNode(tsNode: TsNode): Result<TypeDeclaration> {
        if (!this.isTypeDeclaration(tsNode)) {
            return Result.fail(
                `this.isTypeDeclaration(): false`,
                `Please check the ts node '${tsNode.getText()}' is a valid node`
            )
        }
        const importDeclaration = new TypeDeclaration(tsNode);
        return Result.ok(importDeclaration)
    }

    
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Type Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    public static isTypeDeclaration = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TypeAliasDeclaration;
    }

    public static isTypeParameterDeclaration: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TypeParameterDeclaration;
    }

    private identifyGenericDeclaration = async (genericNode: TsNode): Promise<Result<AstNode>> => {
        const nodes = genericNode.getChildren([], [TsNode.isNonImportant], []);
        const paramCount = nodes.length;
        if (paramCount === 0) {
            return Result.fail(
                `The '${genericNode.getText()}' doesn't have any node`,
                `Please pass the correct type parameter declaration, or help to improve Medet's misclick`
            )
        }

        if (!Identifier.isA(nodes[0])) {
            const err = Debug.error(
                `The first node '${nodes[0].getText()}' is not identifier`,
                `Please update the Ara Web to support this feature or perhaps you made a mistake in your syntax? ;)`,
                nodes[0].getNode<Node>()
            );

            return Result.fail(err)
        }

        let identifiedNode = AstNode.fromTsNode(genericNode);
        identifiedNode.constant = true;
        identifiedNode.nodeType = AstNodeType.Type;
        identifiedNode.identifier = nodes[0].getText();
        identifiedNode.data = {};
        identifiedNode.dataType = ValueTypeString.object;

        for (let paramCounter = 1; paramCounter < paramCount; paramCounter++) {
            const paramNode = nodes[paramCounter];
            if (!TsNode.isKeyword(paramNode, ["extends"])) {
                const err = Debug.error(
                    `The second parameter of generic declaration is not 'extends'`,
                    `Ara Web doesn't support the '${paramNode.getText()}' as the ${paramCounter+1} node. Please update identifyGeneric()`,
                    paramNode
                )
                return Result.fail(err);
            }
            // Check the data type
            paramCounter++;
            if (paramCounter >= paramCount) {
                return Result.fail(`Failed to identify the parameter.`, `The param after 'extends' expected, but not given`)
            }
            const nextParamNode = nodes[paramCounter];
            const nextParamValue = await TypeValueTraits.identifyTypeValue(nextParamNode);
            if (nextParamValue.isFailure) {
                return Result.fail(
                    `identifyTypeValue(identifier: '${identifiedNode.identifier}', node: ${nextParamNode.getText()}): ${nextParamValue.errorTitle}`,
                    nextParamValue.errorDescription!
                )
            }
            identifiedNode.data = nextParamValue.getValue();
            continue;
        }

        return Result.ok(identifiedNode)
    }

    
    /**
     * Returns the Generic declaration defined as SyntaxList after the "<" opening
     * bracked that user sends
     * @param tsNode 
     * @returns 
     */
    public static getGenericNodesAfterOpeningClause = (openingClause: TsNode): TsNode[] => {
            const syntaxList = openingClause.getNextSibling();
            if (syntaxList === undefined || !TsNode.isSyntaxList(syntaxList)) {
                return [];
            }
            
            return syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
    }
    
    /**
         * 
         * @param node Is the given node is the opening the generic type declarations
         * @returns 
     */
    public static isGenericOpeningClause = (openingClause: TsNode): boolean => {
        if (openingClause.getText() !== "<") {
            return false;
        }
    
        const syntaxList = openingClause.getNextSibling();
        if (syntaxList === undefined || !TsNode.isSyntaxList(syntaxList)) {
            return false;
        }
  
        const closingClause = syntaxList.getNextSibling();
        if (closingClause === undefined || !TsNode.isKeyword(closingClause, ">")) {
                return false;
        }
            
        return true;
    }
    

    public getAstNode = async (): Promise<Result<AstNode>> => {
        let identifiedNode = AstNode.fromTsNode(this);
        identifiedNode.constant = true;
        identifiedNode.nodeType = AstNodeType.Type;
        identifiedNode.data = undefined;
            
        let identifier: string = '';

        // Type declaration has 'type' keyword and '=' sign to skip.
        const children = this.getChildren([], [TsNode.isTypeKeyword, TsNode.isNonImportant], ["="]);
        // Child = 0 is the keyword
        for (let i = 0; i < children.length; i++) {
            const typeChild = children[i];
            if (TsNode.isExportKeyword(typeChild)) {
                identifiedNode.public = true;
                continue;
            } else if (Identifier.isA(typeChild)) {
                identifier = StringTraits.unquote(typeChild.getText());
                identifiedNode.identifier = identifier;
                continue;
            } else if (TypeDeclaration.isGenericOpeningClause(typeChild)) {
                const typeAstNodes = TypeDeclaration.getGenericNodesAfterOpeningClause(typeChild);
                for (let typeAstNode of typeAstNodes) {
                    if (!(TypeDeclaration.isTypeParameterDeclaration(typeAstNode))) {
                        return Result.fail(`Type Parameter Declaration expected for generic types`, 'Please correct the syntax code')
                    }
                    const identifiedData = await this.identifyGenericDeclaration(typeAstNode);
                    if (identifiedData.isFailure) {
                        return Result.fail(`identifyGenericDeclaration(genericNode: '${typeAstNode.getText()}'): ${identifiedData.errorTitle}`, identifiedData.errorDescription!)
                    }
                    identifiedNode.putMemoryData(identifiedData.getValue());
                }
                i += AstNode.GenericNodeLength - 1;
                continue;
            } else {
                const identified = await TypeValueTraits.identifyTypeValue(typeChild);
                if (identified.isFailure) {
                    const err = Debug.error(
                        `TypeValueTraits.identifyTypeValue(tsNode: '${typeChild.getText()}'): ${identified.errorTitle}`,
                        identified.errorDescription!,
                        typeChild
                    )
                    return Result.fail(err)
                }
                identifiedNode.data = identified.getValue();
            }   
        }

        if (identifiedNode.identifier === undefined) {
            return Result.fail(`Couldn't find type's identfier`, `Please update typeDeclarationToAstIdentifier()`)
        } else if (identifiedNode.data === undefined) {
            return Result.fail(`Couldn't find type's data`, `Please update typeDeclarationToAstIdentifier()`)
        }

        return Result.ok(identifiedNode);
    }

    /**
     * Data Type has: Memory, Page Memory, and Project Memory.
     * We need to lint the data. The node has no scope memory yet.
     * 
     * First, we lint the memory itself if any.
     * By passing: AstNode with empty Memory, Page Memory, and Project Memory
     * 
     * Then, we loop over the project data.
     * For each project data, we need to get the scope by adding ast node memory to the local scope
     * 
     * @param node 
     * @param pageIdentifiers 
     * @param projectMemory 
     * @returns 
     */

    public static lintAstNodeMemory = (
        node: AstNode,
        nodeContext: AstNodeContext,
    ): Result<AstNode> => {
        if (node.memoryDataLength() === 0) {
            return Result.ok(node);
        }

        for (let i = 0; i < node.memoryDataLength(); i++) {
            const memoryNode = node.getMemoryData(i);
            if (memoryNode === undefined) {
                node.postMemoryData(i);
                continue;
            }
            
            if (memoryNode.identifier === undefined) {
                return Result.fail(
                    `The node '${node.identifier}' memory node has no identifier`,
                    `Please update the identifyTypes() to fix it`
                )
            }
                
            const memoryNodeContext = nodeContext.clone(node.getAllMemoryData([memoryNode!.identifier!]))

            // Debug.push(`this.lintType()`, {node: memoryNode.identifier!});
            const lintedMemoryNode = this.lintType(memoryNode, memoryNodeContext)
            // Debug.pop();
            if (lintedMemoryNode.isFailure) {
                return Result.fail(
                    `this.lintType(node: '${memoryNode.identifier}'): ${lintedMemoryNode.errorTitle}`,
                    lintedMemoryNode.errorDescription!
                )
            }
        
            node.postMemoryData(i, lintedMemoryNode.getValue())
        }

        return Result.ok(node);
    }

    // If the AstNode.data is AraLink
    private static lintAraLinkData = (
        data: AraLink<string>,
        nodeContext: AstNodeContext,
    ): Result<TypedData> => {
        if (!ReflectAraLink.isIdentifierLink(data)) {
            return Result.fail(
                `isAraIdentifierLink(araLink='${data.toString()}') is not a link to identifier`,
                `Only support the ara identifiers for now, update the lintTypeDeclarations()`
            )
        }
    
        const refIdentifier = data.resource as string;
        const refNode = nodeContext.getIdentifier(data)
        if (refNode === undefined) {
            const err = Debug.error(
                `The '${data.toString()} data reference to '${refIdentifier}' not found`,
                `Referenced node not found in the memory level, please update the getIdentifier() or pass correct data`,
                data
            )

            return Result.fail(err);
        } else if (refNode.identifier === undefined) {
            return Result.fail(
                `The '${data.toString()}' data referenced '${refIdentifier}' missing any data`,
                'Identifier of the referenced node is not set, please update memory.getIdentifier()'
            )
        }
    
        if (data.isPropertyExist(TypeRef.GENERIC_VALUES_LINK_PROPERTY)) {
            if (!refNode.isGenericHandlerExist) {
                return Result.fail(
                    `refNode('${refNode.identifier}').isGenericHandlerExist: false`,
                    `The ${data.toString()} has a generic value, but '${refNode.identifier}' doesn't have generic handler, please call putGenericHandler in refNode.`
                )
            }
            
            const genericValues = TypeRef.linkPropertyToGenericValues(data);
            const handledRefNode = refNode.handleGeneric(genericValues)
            if (handledRefNode.isFailure) {
                return Result.fail(
                    `refNode('${refNode.identifier}'): handleGeneric('[${genericValues.join(',')}]'): ${handledRefNode.errorTitle}`,
                    handledRefNode.errorDescription!
                )
            }
    
            // Debug.push(`this.lintType()`)
            const identifiedRefNode = this.lintType(handledRefNode.getValue(), nodeContext)
            // Debug.pop();
            if (identifiedRefNode.isFailure) {
                return Result.fail(
                    `refNode.handleGeneric(): this.lintType('${handledRefNode.getValue().identifier}'): ${identifiedRefNode.errorTitle}`,
                    identifiedRefNode.errorDescription!
                )
            }

            if (identifiedRefNode.getValue().data === undefined) {
                return Result.fail(
                    `refNode.handleGeneric(): this.lintType('${handledRefNode.getValue().identifier}'): data is empty after linting`,
                    `Please update the TypeDeclaration() to retreive the data after linting a type`
                )
            }
    
            return Result.ok({data: identifiedRefNode.getValue().data!, dataType: identifiedRefNode.getValue().dataType})
        }
        
        // Debug.push(`this.lintType()`, {node: refIdentifier})
        const lintedAstNode = this.lintType(refNode, nodeContext);
        // Debug.pop();
        if (lintedAstNode.isFailure) {
            return Result.fail(
                `nonGenericLink: this.lintType('${refNode.identifier!}'): ${lintedAstNode.errorTitle}`,
                lintedAstNode.errorDescription!
            )
        } else if (lintedAstNode.getValue().data === undefined) {
            return Result.fail(
                `The '${data.toString()}' data referenced '${refIdentifier}' data not found`, 
                'Please update this.lintType()'
            )
        }
        
        return Result.ok({data: lintedAstNode.getValue().data!, dataType: lintedAstNode.getValue().dataType});
    }

    private static lintObjectData = (
        objData: object, 
        nodeContext: AstNodeContext,
    ): Result<TypedData> => {
        if (Array.isArray(objData)) {
            return Result.fail(
                `The data is array`,
                `Please call lintType instead lintObjectData()`
            )
        }
        if (typeof objData !== "object") {
            return Result.fail(
                `Only object or literal types of value is supported by Ara Web`,
                `Please update the lintType()`
            )
        }

        for (let typeProperty in objData) {
            const data = (objData as any)[typeProperty]

            const identifiedData = this.lintTypeData(data, nodeContext);
            if (identifiedData.isFailure) {
                return Result.fail(
                    `data['${typeProperty}']: this.lintTypeData('${data}'): ${identifiedData.errorTitle}`,
                    identifiedData.errorDescription!
                )
            }
            if (identifiedData.getValue().data === undefined) {
                return Result.fail(
                    `data['${typeProperty}']: this.lintTypeData('${data}'): data is undefined`,
                    `The lintTypeData did not return data, please update TypeDeclaration()`
                )
            } 
            (objData as any)[typeProperty] = identifiedData.getValue().data;
        }

        return Result.ok({data: objData, dataType: ValueTypeString.object});
    }

    private static lintTypeData = (
        data: IdentifiedNodeDataType,
        nodeContext: AstNodeContext,
    ): Result<TypedData> => {
        if (data instanceof AraLink) {
            // Debug.push(`this.lintAraLinkData('${data.toString()}', ${nodeContext.localScopeLength} local scopes)`)
            const identifiedData = this.lintAraLinkData(data, nodeContext);
            // Debug.pop();
            if (identifiedData.isFailure) {
                return Result.fail(
                    `this.lintAraLinkData(data: '${data.toString()}'): ${identifiedData.errorTitle}`,
                    identifiedData.errorDescription!
                )
            }
    
            return Result.ok(identifiedData.getValue())
        } else if (["number", "boolean", "string"].includes(data as ValueTypeString)) {
            return Result.ok({data: data as ValueTypeString, dataType: data as ValueTypeString})
        } else if (["number", "boolean", "string"].includes(typeof data)) {
            return Result.ok({data: data, dataType: (typeof data) as ValueTypeString})
        } else if (Array.isArray(data)) {
            const identifiedData: ValueType[] = [];
            for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
                const dataElement = data[dataIndex];
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(
                        `Array.isArray(data): this.lintTypeData('${dataIndex}' element): ${identifiedDataElement.errorTitle}`,
                        identifiedDataElement.errorDescription!
                    )
                } else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(
                        `Array.isArray(data): this.lintTypeData('${dataIndex}' element): data is empty`,
                        `The element couldn't be identified`
                    )
                } else {
                    identifiedData.push(identifiedDataElement.getValue().data!);
                }
            }

            return Result.ok({data: identifiedData, dataType: ValueTypeString.array})
        } else if (data instanceof IntersectedUnionType) {
            const identifiedData = new IntersectedUnionType();

            const araLinks = data.araLinks;
            for (let araLinkIndex = 0; araLinkIndex < araLinks.length; araLinkIndex++) {
                const dataElement = araLinks[araLinkIndex];

                const identifiedLink = this.lintTypeData(dataElement, nodeContext);
                if (identifiedLink.isFailure) {
                    return Result.fail(
                        `intersect.araLinks: this.lintTypeData('${dataElement.toString()}'): ${identifiedLink.errorTitle}`,
                        identifiedLink.errorDescription!
                    )
                } else if (identifiedLink.getValue().data === undefined) {
                    return Result.fail(
                        `intersect.araLinks: this.lintTypeData('${dataElement.toString()}'): data is empty`,
                        `The element couldn't be identified`
                    )
                } else {
                    if (identifiedLink.getValue().data instanceof UnionTypeDeclaration) {
                        identifiedData.putUnions(identifiedLink.getValue().data as UnionTypeDeclaration);
                    } else if (identifiedLink.getValue().data instanceof IntersectedUnionType) {
                        identifiedData.putUnions((identifiedLink.getValue().data as IntersectedUnionType).unions)
                        
                        for (let key in (identifiedLink.getValue().data as IntersectedUnionType).records) {
                            const record: Record<string, IdentifiedNodeDataType> = {
                                [key]: (identifiedLink.getValue().data as IntersectedUnionType).records[key]
                            }
                            identifiedData.putOrPost(record)
                        }
                    } else if (identifiedLink.getValue().data instanceof TypeDeclarationData) {
                        for (let key in (identifiedLink.getValue().data as TypeDeclarationData).records) {
                            const record: Record<string, IdentifiedNodeDataType> = {
                                [key]: (identifiedLink.getValue().data as TypeDeclarationData).records[key]
                            }
                            identifiedData.putOrPost(record)
                        }
                    }
                }
            }

            // Intersect's keys
            for (let key in data.records) {
                const dataElement = data.records[key];
                // Debug.push(`Intersected '${key}'`)
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                // Debug.pop();
                if (identifiedDataElement.isFailure) {
                    return Result.fail(
                        `data as IntersectedUnionTypeDeclaration: this.lintTypeData('${key}' element): ${identifiedDataElement.errorTitle}`,
                        identifiedDataElement.errorDescription!
                    )
                } else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(
                        `Array.isArray(data): this.lintTypeData('${key}' element): data is empty`,
                        `The element couldn't be identified`
                    )
                } else {
                    identifiedData.putOrPost({[key]: identifiedDataElement.getValue().data!});
                }
            }

            // Intersect's unions
            const identifiedUnions = this.lintTypeData(data.unions, nodeContext);
            if (identifiedUnions.isFailure) {
                return Result.fail(
                    `data as UnionTypeDeclaration: this.lintTypeData(${identifiedUnions.errorTitle}`,
                    identifiedUnions.errorDescription!
                )
            }

            identifiedData.putUnions(identifiedUnions.getValue().data as UnionTypeDeclaration);

            return Result.ok({data: identifiedData, dataType: ValueTypeString.object})
        } else if (data instanceof UnionTypeDeclaration) {
            const identifiedData = new UnionTypeDeclaration();

            for (let unionIndex = 0; unionIndex < data.unionLength; unionIndex++) {
                const dataElement = data.getUnion(unionIndex)!;
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(
                        `data as UnionTypeDeclaration: this.lintTypeData('${unionIndex}' element): ${identifiedDataElement.errorTitle}`,
                        identifiedDataElement.errorDescription!
                    )
                } else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(
                        `Array.isArray(data): this.lintTypeData('${unionIndex}' element): data is empty`,
                        `The element couldn't be identified`
                    )
                } else {
                    identifiedData.postUnion(identifiedDataElement.getValue().data!);
                }
            }

            return Result.ok({data: identifiedData, dataType: ValueTypeString.object})
        } else if (data instanceof TypeDeclarationData) {
            const identifiedData = new TypeDeclarationData();

            const records = data.records;

            for (let key in records) {
                const dataElement = records[key];
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(
                        `data as UnionTypeDeclaration: this.lintTypeData('${key}' element): ${identifiedDataElement.errorTitle}`,
                        identifiedDataElement.errorDescription!
                    )
                } else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(
                        `Array.isArray(data): this.lintTypeData('${key}' element): data is empty`,
                        `The element couldn't be identified`
                    )
                } else {
                    identifiedData.post({[key]: identifiedDataElement.getValue().data!});
                }
            }

            return Result.ok({data: identifiedData, dataType: ValueTypeString.object})
        } else if (typeof data !== "object") {
            return Result.fail(
                `Only object or literal types of value is supported by Ara Web`,
                `Please update the lintType()`
            )
        }
    
        const identifiedData = this.lintObjectData(data, nodeContext);
        if (identifiedData.isFailure) {
            return Result.fail(
                `this.lintObjectData('${data}'): ${identifiedData.errorTitle}`,
                identifiedData.errorDescription!
            )
        }

        if (identifiedData.getValue().data === undefined) {
            return Result.fail(
                `this.lintObjectData(): data is undefined`,
                `The lintObjectData() did not return data, please update lintObjectData()`
            )
        }

        return Result.ok(identifiedData.getValue())
    }

    public static lintType = (
        node: AstNode|AraLink<string>,
        parentNodeContext: AstNodeContext,
    ): Result<AstNode> => {
        if (node instanceof AraLink) {
            // const refNode = memory.identifierByAraLink(node)
                        // if (refNode === undefined) {
                        //     return Result.fail(
                        //         `'${identifier}' is alias, but it's referenced data not found`
                        //     )
                        // }
                        // node = refNode;
            return Result.fail(`Not implemented`, `lintType() to support referenced types when the Node is reference link`);
        }
        
        let nodeContext = parentNodeContext.clone([]);
        if (node.memoryDataLength() > 0) {
            // Debug.push(`this.lintAstNodeMemory()`, {node: node.identifier!})
            const memoryLintResult = this.lintAstNodeMemory(node, nodeContext);
            // Debug.pop();
            if (memoryLintResult.isFailure) {
                return Result.fail(
                    `this.lintAstNodeMemory(node: '${node.identifier}'): ${memoryLintResult.errorTitle}`,
                    memoryLintResult.errorDescription!
                )
            }
            node = memoryLintResult.getValue();
            nodeContext.post(node.getAllMemoryData())
        }
        const astNode = node as AstNode;
        if (astNode.data === undefined) {
            return Result.fail(
                `The AST Node '${astNode.tsNode.getText()}' data is empty`,
                `Please, pass the AST Node with the initial data`
            )
        }
        
        // Debug.push(`this.lintTypeData('${astNode.identifier}', nodeContext: ${nodeContext.localScopeLength} local scopes)`)
        const identifiedData = this.lintTypeData(astNode.data, nodeContext);
        // Debug.pop();
        if (identifiedData.isFailure) {
            return Result.fail(
                `this.lintTypeData(): ${identifiedData.errorTitle}`,
                identifiedData.errorDescription!
            )
        }

        if (identifiedData.getValue().data === undefined) {
            return Result.fail(
                `this.lintObjectData(): data is undefined`,
                `The lintObjectData() did not return data, please update lintObjectData()`
            )
        }

        if (identifiedData.getValue().dataType !== undefined) {
            astNode.dataType = identifiedData.getValue().dataType!
        }
        astNode.data = identifiedData.getValue().data!
        return Result.ok(astNode);
    }
}