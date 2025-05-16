import { AraLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { TypeLevel } from "./type-level/index.js";
export var ValueTypeString;
(function (ValueTypeString) {
    ValueTypeString["default"] = "default";
    ValueTypeString["string"] = "string";
    ValueTypeString["number"] = "number";
    ValueTypeString["array"] = "array";
    ValueTypeString["object"] = "object";
    ValueTypeString["property"] = "property";
    ValueTypeString["boolean"] = "boolean";
    ValueTypeString["undefined"] = "undefined";
})(ValueTypeString || (ValueTypeString = {}));
;
;
;
/**
 * The type declaration literal discovered in the source code represented as this class.
 */
export class UserTypeDeclaration {
    _records = {};
    constructor() { }
    putOrPost(record) {
        this._records = { ...this._records, ...record };
    }
    get length() {
        return Object.keys(this._records).length;
    }
    get records() {
        return this._records;
    }
    // Add a new key
    post(record) {
        for (let key in record) {
            if (this.isChild(key)) {
                return false;
            }
        }
        this._records = { ...this._records, ...record };
        return true;
    }
    isChild(key) {
        return typeof this._records[key] !== "undefined";
    }
    get(key) {
        if (!this.isChild(key)) {
            return undefined;
        }
        return this._records[key];
    }
    // Replace the key
    put(record) {
        for (let key in record) {
            if (!this.isChild(key)) {
                return false;
            }
        }
        for (let key in record) {
            this._records[key] = record[key];
        }
        return true;
    }
    identifyData = (data) => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`);
        }
        for (let identifier in this._records) {
            if (data[identifier] === undefined) {
                return Result.fail(`The data missing '${identifier}' property as TypeDeclaration requires`, `Pass the correct values`);
            }
            const identified = TypeLevel.matchDataToType({ data: data[identifier], dataType: this._records[identifier] });
            if (identified.isFailure) {
                return Result.fail(`${identifier} property: TypeLevel.identifyDataType(): ${identified.errorTitle}`, identified.errorDescription);
            }
        }
        return Result.ok(data);
    };
    postDataType = (dataType) => {
        if (!(dataType instanceof UserTypeDeclaration) &&
            dataType !== ValueTypeString.object &&
            typeof dataType !== ValueTypeString.object) {
            return Result.fail(`The data type '${dataType}' not supported`, `Please pass only objects posting into type declaration`);
        }
        const keys = Object.keys(dataType);
        for (let key of keys) {
            const record = {
                [key]: dataType[key]
            };
            this.post(record);
        }
        return Result.ok(this);
    };
}
;
export class UnionTypeDeclaration {
    _values = [];
    constructor() {
        this._values = [];
    }
    get union() {
        return this._values;
    }
    putOrPostUnion(unions) {
        this._values.push(...unions);
    }
    get unionLength() {
        return this._values.length;
    }
    postUnion(typeValue) {
        this._values.push(typeValue);
    }
    isUnionChildExist(index) {
        return index >= 0 && index < this.unionLength;
    }
    getUnion(index) {
        if (!this.isUnionChildExist(index)) {
            return undefined;
        }
        return this._values[index];
    }
    putUnion(index, dataType) {
        if (!this.isUnionChildExist(index)) {
            return;
        }
        this._values[index] = dataType;
    }
    identifyData = (data) => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`);
        }
        for (let dataType of this._values) {
            const identified = TypeLevel.matchDataToType({ data: data, dataType });
            if (identified.isSuccess) {
                return Result.ok(identified.getValue());
            }
        }
        return Result.fail(`The data is not any of the types from unions`);
    };
}
// Type Declaration, but some parts are also are optional as its an union.
export class IntersectedUnionType extends UserTypeDeclaration {
    _unions;
    _araLinks;
    constructor(obj) {
        super();
        this._unions = new UnionTypeDeclaration();
        this._araLinks = [];
        if (obj !== undefined) {
            this._records = obj.records;
        }
    }
    get araLinks() {
        return this._araLinks;
    }
    postAraLink(araLink) {
        this._araLinks.push(araLink);
    }
    get unions() {
        return this._unions;
    }
    putUnions(unions) {
        if (this._unions === undefined) {
            this._unions = unions;
            return;
        }
        this._unions.putOrPostUnion(unions.union);
    }
    get union() {
        return this._unions.union;
    }
    putOrPostUnion(unions) {
        this._unions.putOrPostUnion(unions);
    }
    get unionLength() {
        return this._unions.unionLength;
    }
    postUnion(typeValue) {
        this._unions.postUnion(typeValue);
    }
    isUnionChildExist(index) {
        return this._unions.isUnionChildExist(index);
    }
    getUnion(index) {
        return this._unions.getUnion(index);
    }
    putUnion(index, dataType) {
        this._unions.putUnion(index, dataType);
    }
    get typeDeclaration() {
        const typeDeclaration = new UserTypeDeclaration();
        typeDeclaration.post(this._records);
        return typeDeclaration;
    }
    identifyData = (data) => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`);
        }
        else if (this._araLinks.length > 0) {
            return Result.fail(`The Intersected Union type has an ara link`, `Lint the type before identifying data`);
        }
        // First, identify the type declaration part
        const dataType = this.typeDeclaration;
        const identified = dataType.identifyData(data);
        if (identified.isFailure) {
            return Result.fail(`TypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription);
        }
        // Now identify the union types
        if (this._unions.unionLength > 0) {
            const identifiedUnion = this._unions.identifyData(data);
            if (identifiedUnion.isFailure) {
                return Result.fail(`TypeDeclarationUnion.identifyData(): ${identifiedUnion.errorTitle}`, identifiedUnion.errorDescription);
            }
            const intersectedDataType = dataType.postDataType(identifiedUnion.getValue().dataType);
            if (intersectedDataType.isFailure) {
                return Result.fail(`TypeDeclaration.postDataType(): ${intersectedDataType.errorTitle}`, intersectedDataType.errorDescription);
            }
            return Result.ok({ data, dataType: intersectedDataType.getValue() });
        }
        return Result.ok({ data, dataType });
    };
}
