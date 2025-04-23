import { Result, Debug } from "@ara-web/ts-enhancement";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { TypeLevel } from "./type-level.js";
import type { TypedData } from "./ast-node.js";

export type LiteralType = string | number | boolean;

export type EnumMembers = {[key: string]: string|number};

export enum ValueTypeString {
    default = "default",    // The type that was passed
    string = "string",
    number = "number",
    array = "array",
    object = "object",
    property = "property",
    boolean = "boolean",
    undefined = "undefined"
}

export interface TypeObjectInterface {
    length: number;
    records: Record<string, IdentifiedNodeDataType>;           // Returns all data
    isChild(key: string): boolean;
    // REST operations
    post(record: Record<string, IdentifiedNodeDataType>): boolean;  // Add a new data into the record if doesn't exist, if exists, then does nothing
    put(record: Record<string, IdentifiedNodeDataType>): boolean;    // Overrite the data, if the record exists, if doesn't exist, then does nothing.
    putOrPost(record: Record<string, IdentifiedNodeDataType>): void;
    get(key: string): IdentifiedNodeDataType|undefined;             // Returns a single record
};

export interface UnionTypeInterface {
    unionLength: number;
    union: IdentifiedNodeDataType[];
    postUnion(typeValue: IdentifiedNodeDataType): void;
    putUnion(index: number, dataType: IdentifiedNodeDataType): void;
    putOrPostUnion(unions: IdentifiedNodeDataType[]): void;
    isUnionChildExist(index: number): boolean;
    getUnion(index: number): IdentifiedNodeDataType|undefined;
};

interface IntersectedUnionInterface extends TypeObjectInterface, UnionTypeInterface {
    unions: UnionTypeInterface;
    araLinks: Array<AraLink<string>>;
    putUnions(unions: UnionTypeInterface): void;
    postAraLink(araLink: AraLink<string>): void;
    
};

// Types as objects
export class TypeDeclaration implements TypeObjectInterface {
    protected _records: Record<string, IdentifiedNodeDataType> = {};

    constructor() {}
    
    putOrPost(record: Record<string, IdentifiedNodeDataType>): void {
        this._records = {...this._records, ...record};
    }

    public get length(): number {
        return Object.keys(this._records).length;
    }

    public get records(): Record<string, IdentifiedNodeDataType> {
        return this._records;
    }

    // Add a new key
    public post(record: Record<string, IdentifiedNodeDataType>): boolean {
        for (let key in record) {
            if (this.isChild(key)) {
                return false;
            }
        }
        this._records = {... this._records, ...record};
        return true;
    }

    public isChild(key: string): boolean {
        return typeof this._records[key] !== "undefined";
    }

    public get(key: string): IdentifiedNodeDataType|undefined {
        if (!this.isChild(key)) {
            return undefined;
        }

        return this._records[key];
    }

    // Replace the key
    public put(record: Record<string, IdentifiedNodeDataType>): boolean {
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

    public identifyData = (data: any): Result<object> => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`)
        }
        for (let identifier in this._records) {
            if (data[identifier] === undefined) {
                return Result.fail(`The data missing '${identifier}' property as TypeDeclaration requires`, `Pass the correct values`)
            }

            const identified = TypeLevel.identifyDataType({data: data[identifier], dataType: this._records[identifier]});
            if (identified.isFailure) {
                return Result.fail(`${identifier} property: TypeLevel.identifyDataType(): ${identified.errorTitle}`, identified.errorDescription!)
            }
        }

        return Result.ok(data as object);
    }

    public postDataType = (dataType: IdentifiedNodeDataType | undefined): Result<TypeDeclaration> => {
        if (!(dataType instanceof TypeDeclaration) &&
            dataType !== ValueTypeString.object && 
            typeof dataType !== ValueTypeString.object) {
            return Result.fail(`The data type '${dataType}' not supported`, `Please pass only objects posting into type declaration`);
        }

        const keys = Object.keys(dataType!);
        for (let key of keys) {
            const record: Record<string, IdentifiedNodeDataType> = {
                [key]: (dataType as any)[key]
            }
            this.post(record)
        }

        return Result.ok(this);
    }
};

export type ValueType = LiteralType |
    Array<any> | 
    Object | 
    EnumMembers | 
    AraLink<any> | 
    TypeDeclaration |
    UnionTypeDeclaration
;


export type IdentifiedNodeDataType = ValueTypeString | ValueType;

export class UnionTypeDeclaration implements UnionTypeInterface {
    protected _values = [] as IdentifiedNodeDataType[];

    constructor() {
        this._values = [];
    }

    public get union(): IdentifiedNodeDataType[] {
        return this._values;
    }

    putOrPostUnion(unions: IdentifiedNodeDataType[]): void {
        this._values.push(...unions);
    }

    public get unionLength(): number {
        return this._values.length;
    }

    public postUnion(typeValue: IdentifiedNodeDataType): void {
        this._values.push(typeValue);
    }

    public isUnionChildExist(index: number): boolean {
        return index >= 0 && index < this.unionLength;
    }

    public getUnion(index: number): IdentifiedNodeDataType|undefined {
        if (!this.isUnionChildExist(index)) {
            return undefined;
        }

        return this._values[index];
    }

    public putUnion(index: number, dataType: IdentifiedNodeDataType): void {
        if (!this.isUnionChildExist(index)) {
            return;
        }

        this._values[index] = dataType;
    }

    public identifyData = (data: any): Result<TypedData> => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`)
        }
        for (let dataType of this._values) {
            const identified = TypeLevel.identifyDataType({data: data, dataType});
            if (identified.isSuccess) {
                return Result.ok(identified.getValue())
            }
        }

        return Result.fail(`The data is not any of the types from unions`)
    }
}

// Type Declaration, but some parts are also are optional as its an union.
export class IntersectedUnionType extends TypeDeclaration implements IntersectedUnionInterface {
    protected _unions: UnionTypeDeclaration;
    protected _araLinks: AraLink<string>[];
    
    constructor(obj?: TypeDeclaration | IntersectedUnionType) {
        super();
        this._unions = new UnionTypeDeclaration();
        this._araLinks = [];
        if (obj !== undefined) {
            this._records = obj.records;
        }
    }

    public get araLinks(): AraLink<string>[] {
        return this._araLinks;
    }

    postAraLink(araLink: AraLink<string>): void {
        this._araLinks.push(araLink);
    }
    
    public get unions(): UnionTypeDeclaration {
        return this._unions;
    }

    putUnions(unions: UnionTypeDeclaration): void {
        if (this._unions === undefined) {
            this._unions = unions;
            return;
        }
        this._unions.putOrPostUnion(unions.union);
    }

    public get union(): IdentifiedNodeDataType[] {
        return this._unions.union;
    }

    putOrPostUnion(unions: IdentifiedNodeDataType[]): void {
        this._unions.putOrPostUnion(unions);
    }

    public get unionLength(): number {
        return this._unions.unionLength;
    }

    public postUnion(typeValue: IdentifiedNodeDataType): void {
        this._unions.postUnion(typeValue);
    }

    public isUnionChildExist(index: number): boolean {
        return this._unions.isUnionChildExist(index);
    }

    public getUnion(index: number): IdentifiedNodeDataType|undefined {
        return this._unions.getUnion(index);
    }

    public putUnion(index: number, dataType: IdentifiedNodeDataType): void {
        this._unions.putUnion(index, dataType);
    }

    private get typeDeclaration(): TypeDeclaration {
        const typeDeclaration = new TypeDeclaration();
        Debug.log(`Add to a new type declaration:`);
        Debug.log(this._records)
        Debug.log(`Type declaration has`)
        Debug.log(typeDeclaration)
        if (!typeDeclaration.post(this._records)) {
            Debug.log(`The type declaration posting records failed`);
        }
        return typeDeclaration;
    }

    public identifyData = (data: any): Result<TypedData> => {
        if (data === undefined) {
            return Result.fail(`The data is undefined`, `Please pass the data`)
        } else if (this._araLinks.length > 0) {
            return Result.fail(`The Intersected Union type has an ara link`, `Lint the type before identifying data`)
        }

        // First, identify the type declaration part
        const dataType = this.typeDeclaration;
        Debug.log(`Intersect:`);
        Debug.log(this);
        Debug.log(`Intersected union type:`);
        Debug.log(dataType)
        Debug.log(`Identify as type declaration:`)
        Debug.log(data)
        const identified = dataType.identifyData(data);
        if (identified.isFailure) {
            return Result.fail(`TypeDeclaration.identifyData(): ${identified.errorTitle}`, identified.errorDescription!)
        }

        // Now identify the union types
        if (this._unions.unionLength > 0) {
            const identifiedUnion = this._unions.identifyData(data);
            if (identifiedUnion.isFailure) {
                return Result.fail(`TypeDeclarationUnion.identifyData(): ${identifiedUnion.errorTitle}`, identifiedUnion.errorDescription!)
            }

            const intersectedDataType = dataType.postDataType(identifiedUnion.getValue().dataType);
            if (intersectedDataType.isFailure) {
                return Result.fail(`TypeDeclaration.postDataType(): ${intersectedDataType.errorTitle}`, intersectedDataType.errorDescription!);
            }

            return Result.ok({data, dataType: intersectedDataType.getValue()})
        }

        return Result.ok({data, dataType})
    }
}