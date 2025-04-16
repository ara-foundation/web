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
import { ValueTypeString, AstNode, AstNodeType } from "./ast-node.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { TypeValueTraits } from "./type-level/type-value-traits.js";


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

    private identifyGenericDeclaration = (genericNode: TsNode): Result<AstNode> => {
        const nodes = genericNode.getChildren([], [TsNode.isNonImportant], []);
        const paramCount = nodes.length;
        if (paramCount === 0) {
            return Result.fail(
                `The '${genericNode.getText()}' doesn't have any node`,
                `Please pass the correct type parameter declaration, or help to improve Medet's misclick`
            )
        }

        if (!TsNode.isIdentifier(nodes[0])) {
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
            const nextParamValue = TypeValueTraits.identifyTypeValue(identifiedNode.identifier, nextParamNode);
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
            Debug.log(`Check is next of generic literal is syntax list? ${syntaxList?.getText()}`);
            if (syntaxList === undefined || !TsNode.isSyntaxList(syntaxList)) {
                return false;
            }
            
            const closingClause = syntaxList.getNextSibling();
            if (closingClause === undefined || TsNode.isKeyword(closingClause, ">")) {
                return false;
            }
            
            return true;
    }
    

    public getAstNode = (): Result<AstNode> => {
        let identifiedNode = AstNode.fromTsNode(this);
        identifiedNode.constant = true;
        identifiedNode.nodeType = AstNodeType.Type;
        identifiedNode.data = undefined;
            
        let identifier: string = '';

        // Type declaration has 'type' keyword and '=' sign to skip.
        const children = this.getChildren([], [TsNode.isTypeKeyword], ["="]);
        // Child = 0 is the keyword
        for (let i = 0; i < children.length; i++) {
            const typeChild = children[i];
            if (TsNode.isExportKeyword(typeChild)) {
                identifiedNode.public = true;
                continue;
            } else if (TsNode.isIdentifier(typeChild)) {
                identifier = StringTraits.unquote(typeChild.getText());
                identifiedNode.identifier = identifier;
                continue;
            } else if (TypeDeclaration.isGenericOpeningClause(typeChild)) {
                const typeAstNodes = TypeDeclaration.getGenericNodesAfterOpeningClause(typeChild);
                for (let typeAstNode of typeAstNodes) {
                    if (!(TypeDeclaration.isTypeParameterDeclaration(typeAstNode))) {
                        return Result.fail(`Type Parameter Declaration expected for generic types`, 'Please correct the syntax code')
                    }
                    const identifiedData = this.identifyGenericDeclaration(typeAstNode);
                    if (identifiedData.isFailure) {
                        return Result.fail(`identifyGenericDeclaration(genericNode: '${typeAstNode.getText()}'): ${identifiedData}`, identifiedData.errorDescription!)
                    }
                    identifiedNode.putMemoryData(identifiedData.getValue());
                }
                i += AstNode.GenericNodeLength - 1;
                continue;
            }
            else if (!TypeValueTraits.isTypeLiteral(typeChild)) {
                const err = Debug.error(
                    `Unsupported type declaration's node, expected TypeLiteralNode for '${typeChild.getText()}' expression`,
                    `Update the typeDeclarationToAstIdentifiers() function`,
                    typeChild
                )
                return Result.fail(err)
            }

            // Debug.push(`typeLiteralAstNodeToTypeDeclaration()`, {typeLiteral: typeChild.tsNode.getText()})
            const identifiedTypeDeclaration = TypeValueTraits.identifyTypeLiteral(typeChild)
            // Debug.pop()
            if (identifiedTypeDeclaration.isFailure) {
                return Result.fail(
                    `typeLiteralAstNodeToTypeDeclaration(typeLiteral: '${typeChild.getText()}'): ${identifiedTypeDeclaration.errorTitle}`,
                    identifiedTypeDeclaration.errorDescription!
                )
            }
            identifiedNode.data = identifiedTypeDeclaration.getValue();
        }

        if (identifiedNode.identifier === undefined) {
            return Result.fail(`Couldn't find type's identfier`, `Please update typeDeclarationToAstIdentifier()`)
        } else if (identifiedNode.data === undefined) {
            return Result.fail(`Couldn't find type's data`, `Please update typeDeclarationToAstIdentifier()`)
        }

        return Result.ok(identifiedNode);
    }
}