import { Node } from "ts-morph";
import { AraLink } from "@ara-web/sds";
import { Debug, Result } from "@ara-web/p-hintjens";
import { IntersectedUnionType, UserTypeDeclaration, UnionTypeDeclaration, ValueTypeString, CodePiece, CodePieceContext, ReflectLink } from "../index.js";
import { TypeValueTraits } from "./type-value-traits.js";
import { TypeDeclaration as TypeDeclarationTraits } from "./type-declaration.js";
export class TypeLevel {
    static GENERIC_VALUES_LINK_PROPERTY = "generic_values";
    static linkPropertyToGenericValues = (araLink) => {
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
        return genericValues;
    };
    static genericValuesToLinkProperty = (values) => {
        return { [this.GENERIC_VALUES_LINK_PROPERTY]: values };
    };
    /**
     * Identify the AstNodeTraits as the DataType of the `CodePiece`.
     * Use this method if you want to identify the value of `CodePiece.dataType` property.
     * @param child
     * @returns
     */
    static identifyType = async (child) => {
        const dataType = await TypeValueTraits.identifyTypeValue(child);
        if (dataType.isFailure) {
            return Result.fail(`TypeValueTraits.identifyTypeValue('${child.getText()}'): ${dataType.errorTitle}`, dataType.errorDescription);
        }
        return Result.ok(dataType.getValue());
    };
    /**
     * Validates the data type of the data
     * @param typedData
     */
    static matchDataToType = (typedData) => {
        if (typedData.dataType === undefined) {
            if (typedData.data !== undefined) {
                return Result.fail(`The data type is undefined, expects the data to be undefined too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.array) {
            if (!Array.isArray(typedData.data)) {
                return Result.fail(`The data type is array, expects the data to be array too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.default) {
            typedData.dataType = typeof typedData.data;
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.object) {
            if (typeof typedData.data !== "object") {
                return Result.fail(`The data type is object, expects the data to be object too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.boolean) {
            if (typeof typedData.data !== ValueTypeString.boolean) {
                return Result.fail(`The data type is boolean, expects the data to be boolean too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.number) {
            if (typeof typedData.data !== ValueTypeString.number) {
                return Result.fail(`The data type is number, expects the data to be number too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.string) {
            if (typeof typedData.data !== ValueTypeString.string) {
                return Result.fail(`The data type is string, expects the data to be string too`, `Correct the values`);
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType === ValueTypeString.property) {
            return Result.fail(`The data type is property`, `Ara Web doesn't support property types, update ValueLevel.identifyDataType()`);
        }
        if (Array.isArray(typedData.dataType)) {
            if (typedData.dataType.length === 0) {
                return Result.fail(`The data type is an array, but it doesn't have any data about element types`, `Pass the correct data type`);
            }
            if (typedData.dataType.length !== 1) {
                return Result.fail(`The data type is an array, but has more than 1 data type`, `Pass the correct data type`);
            }
            if (!Array.isArray(typedData.data)) {
                return Result.fail(`The data type is an array, expects data to be array too`, `Correct the values`);
            }
            const elementType = typedData.dataType[0];
            for (let elementIndex = 0; elementIndex < typedData.data.length; elementIndex++) {
                const element = typedData.data[elementIndex];
                const identifiedElement = this.matchDataToType({ data: element, dataType: elementType });
                if (identifiedElement.isFailure) {
                    return Result.fail(`${elementIndex} element) ${identifiedElement.errorTitle}`, identifiedElement.errorDescription);
                }
            }
            return Result.ok(typedData);
        }
        if (typedData.dataType instanceof UserTypeDeclaration) {
            const identified = typedData.dataType.identifyData(typedData.data);
            if (identified.isFailure) {
                return Result.fail(`TypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription);
            }
        }
        else if (typedData.dataType instanceof UnionTypeDeclaration) {
            const identified = typedData.dataType.identifyData(typedData.data);
            if (identified.isFailure) {
                return Result.fail(`UnionTypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription);
            }
            return Result.ok(identified.getValue());
        }
        else if (typedData.dataType instanceof IntersectedUnionType) {
        }
        return Result.ok(typedData);
    };
    static getTypeIdentifiers = async (tsNodes) => {
        const typeStatements = tsNodes.filter((tsNode) => (TypeDeclarationTraits.isTypeDeclaration(tsNode)));
        let identifiers = [];
        for (let tsNode of typeStatements) {
            var typeStatement = TypeDeclarationTraits.fromTsNode(tsNode);
            if (typeStatement.isFailure) {
                return Result.fail(`TypeDeclarationTraits.fromTsNode(tsNode: '${tsNode.getText()}'): ${typeStatement.errorTitle}`, typeStatement.errorDescription);
            }
            const identifiedTypeDeclaration = await typeStatement.getValue().getAstNode();
            // Debug.pop();
            if (identifiedTypeDeclaration.isFailure) {
                return Result.fail(`TypeDeclaration('${typeStatement.getValue().getText()}'): getAstNode(): ${identifiedTypeDeclaration.errorTitle}`, identifiedTypeDeclaration.errorDescription);
            }
            identifiers.push(identifiedTypeDeclaration.getValue());
        }
        return Result.ok(identifiers);
    };
    /**********************************************************************************
     *
     * Linting
     *
     **********************************************************************************/
    /**
     *
     * @param node
     * @param parentNodeContext
     * @returns
     */
    static lintType = (node, parentNodeContext) => {
        if (node instanceof AraLink) {
            if (!ReflectLink.isIdentifierLink(node)) {
                return Result.fail(`The node is an ara link, but doesn't link to the identifier`, `Please pass correct link or update TypeDeclaration.lintType() to support '${node.toString()}'`);
            }
            // const refNode = memory.identifierByName(node.resource)
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
            const memoryLintResult = this.lintAstNodeMemory(node, nodeContext);
            if (memoryLintResult.isFailure) {
                return Result.fail(`this.lintAstNodeMemory(node: '${node.identifier}'): ${memoryLintResult.errorTitle}`, memoryLintResult.errorDescription);
            }
            node = memoryLintResult.getValue();
            nodeContext.post(node.getAllMemoryData());
        }
        const astNode = node;
        if (astNode.data === undefined) {
            return Result.fail(`The AST Node '${astNode.tsNode.getText()}' data is empty`, `Please, pass the AST Node with the initial data`);
        }
        const identifiedData = this.lintTypeData(astNode.data, nodeContext);
        if (identifiedData.isFailure) {
            return Result.fail(`this.lintTypeData(): ${identifiedData.errorTitle}`, identifiedData.errorDescription);
        }
        if (identifiedData.getValue().data === undefined) {
            return Result.fail(`this.lintObjectData(): data is undefined`, `The lintObjectData() did not return data, please update lintObjectData()`);
        }
        if (identifiedData.getValue().dataType !== undefined) {
            astNode.dataType = identifiedData.getValue().dataType;
        }
        astNode.data = identifiedData.getValue().data;
        return Result.ok(astNode);
    };
    /**
     * Data Type has: Memory, Page Memory, and Project Memory.
     * We need to lint the data. The node has no scope memory yet.
     *
     * First, we lint the memory itself if any.
     * By passing: CodePiece with empty Memory, Page Memory, and Project Memory
     *
     * Then, we loop over the project data.
     * For each project data, we need to get the scope by adding ast node memory to the local scope
     *
     * @param node
     * @param pageIdentifiers
     * @param projectMemory
     * @returns
     */
    static lintAstNodeMemory = (node, nodeContext) => {
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
                return Result.fail(`The node '${node.identifier}' memory node has no identifier`, `Please update the identifyTypes() to fix it`);
            }
            const memoryNodeContext = nodeContext.clone(node.getAllMemoryData([memoryNode.identifier]));
            const lintedMemoryNode = this.lintType(memoryNode, memoryNodeContext);
            if (lintedMemoryNode.isFailure) {
                return Result.fail(`this.lintType(node: '${memoryNode.identifier}'): ${lintedMemoryNode.errorTitle}`, lintedMemoryNode.errorDescription);
            }
            node.postMemoryData(i, lintedMemoryNode.getValue());
        }
        return Result.ok(node);
    };
    static lintTypeData = (data, nodeContext) => {
        if (data instanceof AraLink) {
            // Debug.push(`this.lintAraLinkData()`, {araLink: data.toString(), nodeContext: `${nodeContext.localScopeLength} local scopes)`})
            const identifiedData = this.lintAraLinkData(data, nodeContext);
            // Debug.pop();
            if (identifiedData.isFailure) {
                return Result.fail(`this.lintAraLinkData(data: '${data.toString()}'): ${identifiedData.errorTitle}`, identifiedData.errorDescription);
            }
            return Result.ok(identifiedData.getValue());
        }
        else if (["number", "boolean", "string"].includes(data)) {
            return Result.ok({ data: data, dataType: data });
        }
        else if (["number", "boolean", "string"].includes(typeof data)) {
            return Result.ok({ data: data, dataType: (typeof data) });
        }
        else if (Array.isArray(data)) {
            const identifiedData = [];
            for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
                const dataElement = data[dataIndex];
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(`Array.isArray(data): this.lintTypeData('${dataIndex}' element): ${identifiedDataElement.errorTitle}`, identifiedDataElement.errorDescription);
                }
                else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(`Array.isArray(data): this.lintTypeData('${dataIndex}' element): data is empty`, `The element couldn't be identified`);
                }
                else {
                    identifiedData.push(identifiedDataElement.getValue().data);
                }
            }
            return Result.ok({ data: identifiedData, dataType: ValueTypeString.array });
        }
        else if (data instanceof IntersectedUnionType) {
            const identifiedData = new IntersectedUnionType();
            const araLinks = data.araLinks;
            for (let araLinkIndex = 0; araLinkIndex < araLinks.length; araLinkIndex++) {
                const dataElement = araLinks[araLinkIndex];
                const identifiedLink = this.lintTypeData(dataElement, nodeContext);
                if (identifiedLink.isFailure) {
                    return Result.fail(`intersect.araLinks: this.lintTypeData('${dataElement.toString()}'): ${identifiedLink.errorTitle}`, identifiedLink.errorDescription);
                }
                else if (identifiedLink.getValue().data === undefined) {
                    return Result.fail(`intersect.araLinks: this.lintTypeData('${dataElement.toString()}'): data is empty`, `The element couldn't be identified`);
                }
                else {
                    if (identifiedLink.getValue().data instanceof UnionTypeDeclaration) {
                        identifiedData.putUnions(identifiedLink.getValue().data);
                    }
                    else if (identifiedLink.getValue().data instanceof IntersectedUnionType) {
                        identifiedData.putUnions(identifiedLink.getValue().data.unions);
                        for (let key in identifiedLink.getValue().data.records) {
                            const record = {
                                [key]: identifiedLink.getValue().data.records[key]
                            };
                            identifiedData.putOrPost(record);
                        }
                    }
                    else if (identifiedLink.getValue().data instanceof UserTypeDeclaration) {
                        for (let key in identifiedLink.getValue().data.records) {
                            const record = {
                                [key]: identifiedLink.getValue().data.records[key]
                            };
                            identifiedData.putOrPost(record);
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
                    return Result.fail(`data as IntersectedUnionTypeDeclaration: this.lintTypeData('${key}' element): ${identifiedDataElement.errorTitle}`, identifiedDataElement.errorDescription);
                }
                else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(`Array.isArray(data): this.lintTypeData('${key}' element): data is empty`, `The element couldn't be identified`);
                }
                else {
                    identifiedData.putOrPost({ [key]: identifiedDataElement.getValue().data });
                }
            }
            // Intersect's unions
            const identifiedUnions = this.lintTypeData(data.unions, nodeContext);
            if (identifiedUnions.isFailure) {
                return Result.fail(`data as UnionTypeDeclaration: this.lintTypeData(${identifiedUnions.errorTitle}`, identifiedUnions.errorDescription);
            }
            identifiedData.putUnions(identifiedUnions.getValue().data);
            return Result.ok({ data: identifiedData, dataType: ValueTypeString.object });
        }
        else if (data instanceof UnionTypeDeclaration) {
            const identifiedData = new UnionTypeDeclaration();
            for (let unionIndex = 0; unionIndex < data.unionLength; unionIndex++) {
                const dataElement = data.getUnion(unionIndex);
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(`data as UnionTypeDeclaration: this.lintTypeData('${unionIndex}' element): ${identifiedDataElement.errorTitle}`, identifiedDataElement.errorDescription);
                }
                else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(`Array.isArray(data): this.lintTypeData('${unionIndex}' element): data is empty`, `The element couldn't be identified`);
                }
                else {
                    identifiedData.postUnion(identifiedDataElement.getValue().data);
                }
            }
            return Result.ok({ data: identifiedData, dataType: ValueTypeString.object });
        }
        else if (data instanceof UserTypeDeclaration) {
            const identifiedData = new UserTypeDeclaration();
            const records = data.records;
            for (let key in records) {
                const dataElement = records[key];
                const identifiedDataElement = this.lintTypeData(dataElement, nodeContext);
                if (identifiedDataElement.isFailure) {
                    return Result.fail(`data as UnionTypeDeclaration: this.lintTypeData('${key}' element): ${identifiedDataElement.errorTitle}`, identifiedDataElement.errorDescription);
                }
                else if (identifiedDataElement.getValue().data === undefined) {
                    return Result.fail(`Array.isArray(data): this.lintTypeData('${key}' element): data is empty`, `The element couldn't be identified`);
                }
                else {
                    identifiedData.post({ [key]: identifiedDataElement.getValue().data });
                }
            }
            return Result.ok({ data: identifiedData, dataType: ValueTypeString.object });
        }
        else if (typeof data !== "object") {
            return Result.fail(`Only object or literal types of value is supported by Ara Web`, `Please update the lintType()`);
        }
        const identifiedData = this.lintObjectData(data, nodeContext);
        if (identifiedData.isFailure) {
            return Result.fail(`this.lintObjectData('${data}'): ${identifiedData.errorTitle}`, identifiedData.errorDescription);
        }
        if (identifiedData.getValue().data === undefined) {
            return Result.fail(`this.lintObjectData(): data is undefined`, `The lintObjectData() did not return data, please update lintObjectData()`);
        }
        return Result.ok(identifiedData.getValue());
    };
    // If the CodePiece.data is AraLink
    static lintAraLinkData = (data, nodeContext) => {
        if (!ReflectLink.isIdentifierLink(data)) {
            return Result.fail(`isAraIdentifierLink(araLink='${data.toString()}') is not a link to identifier`, `Only support the ara identifiers for now, update the lintTypeDeclarations()`);
        }
        const refIdentifier = data.resource;
        const refNode = nodeContext.getIdentifier(data);
        if (refNode === undefined) {
            const err = Debug.error(`The '${data.toString()} data reference to '${refIdentifier}' not found`, `Referenced node not found in the memory level, please update the getIdentifier() or pass correct data`, data);
            return Result.fail(err);
        }
        else if (refNode.identifier === undefined) {
            return Result.fail(`The '${data.toString()}' data referenced '${refIdentifier}' missing any data`, 'Identifier of the referenced node is not set, please update memory.getIdentifier()');
        }
        if (data.isPropertyExist(this.GENERIC_VALUES_LINK_PROPERTY)) {
            if (!refNode.isGenericHandlerExist) {
                return Result.fail(`refNode('${refNode.identifier}').isGenericHandlerExist: false`, `The ${data.toString()} has a generic value, but '${refNode.identifier}' doesn't have generic handler, please call putGenericHandler in refNode.`);
            }
            const genericValues = this.linkPropertyToGenericValues(data);
            const handledRefNode = refNode.handleGeneric(genericValues);
            if (handledRefNode.isFailure) {
                return Result.fail(`refNode('${refNode.identifier}'): handleGeneric('[${genericValues.join(',')}]'): ${handledRefNode.errorTitle}`, handledRefNode.errorDescription);
            }
            // Debug.push(`this.lintType()`)
            const identifiedRefNode = this.lintType(handledRefNode.getValue(), nodeContext);
            // Debug.pop();
            if (identifiedRefNode.isFailure) {
                return Result.fail(`refNode.handleGeneric(): this.lintType('${handledRefNode.getValue().identifier}'): ${identifiedRefNode.errorTitle}`, identifiedRefNode.errorDescription);
            }
            if (identifiedRefNode.getValue().data === undefined) {
                return Result.fail(`refNode.handleGeneric(): this.lintType('${handledRefNode.getValue().identifier}'): data is empty after linting`, `Please update the TypeDeclaration() to retreive the data after linting a type`);
            }
            return Result.ok({ data: identifiedRefNode.getValue().data, dataType: identifiedRefNode.getValue().dataType });
        }
        // Debug.push(`this.lintType()`, {node: refIdentifier})
        const lintedAstNode = this.lintType(refNode, nodeContext);
        // Debug.pop();
        if (lintedAstNode.isFailure) {
            return Result.fail(`nonGenericLink: this.lintType('${refNode.identifier}'): ${lintedAstNode.errorTitle}`, lintedAstNode.errorDescription);
        }
        else if (lintedAstNode.getValue().data === undefined) {
            return Result.fail(`The '${data.toString()}' data referenced '${refIdentifier}' data not found`, 'Please update this.lintType()');
        }
        return Result.ok({ data: lintedAstNode.getValue().data, dataType: lintedAstNode.getValue().dataType });
    };
    static lintObjectData = (objData, nodeContext) => {
        if (Array.isArray(objData)) {
            return Result.fail(`The data is array`, `Please call lintType instead lintObjectData()`);
        }
        if (typeof objData !== "object") {
            return Result.fail(`Only object or literal types of value is supported by Ara Web`, `Please update the lintType()`);
        }
        for (let typeProperty in objData) {
            const data = objData[typeProperty];
            const identifiedData = this.lintTypeData(data, nodeContext);
            if (identifiedData.isFailure) {
                return Result.fail(`data['${typeProperty}']: this.lintTypeData('${data}'): ${identifiedData.errorTitle}`, identifiedData.errorDescription);
            }
            if (identifiedData.getValue().data === undefined) {
                return Result.fail(`data['${typeProperty}']: this.lintTypeData('${data}'): data is undefined`, `The lintTypeData did not return data, please update TypeDeclaration()`);
            }
            objData[typeProperty] = identifiedData.getValue().data;
        }
        return Result.ok({ data: objData, dataType: ValueTypeString.object });
    };
}
