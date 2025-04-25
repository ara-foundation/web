export function fooBar(name: string, surname: string): number { 
    return name.length + surname.length; 
}

export const helloAndWelcome = (): string => {
    return "Hello and Welcome";
}

export enum Sex {
    Male,
    Female
}

export type CustomType = {
    name: string; sex: number;
}