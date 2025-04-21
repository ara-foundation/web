import { AraLink } from "@ara-web/ts-enhancement/ara-link";

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

    protected getRecordKey(record: Record<string, IdentifiedNodeDataType>): string|undefined {
        const keys = Object.keys(record);
        if (keys.length !== 1) {
            return undefined;
        }
        return keys[0];
    }

    // Add a new key
    public post(record: Record<string, IdentifiedNodeDataType>): boolean {
        const key = this.getRecordKey(record);
        if (key === undefined) {
            return false;
        }
        if (this.isChild(key)) {
            return false;
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

    public put(record: Record<string, IdentifiedNodeDataType>): boolean {
        const key = this.getRecordKey(record);
        if (key === undefined) {
            return false;
        }
        if (!this.isChild(key)) {
            return false;
        }

        this._records[key] = record[key];

        return true;
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
}