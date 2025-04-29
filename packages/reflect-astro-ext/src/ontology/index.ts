//////////////////////////////////////////////////////////////////////////////////
//
// Generic Astro Framework's
//
//////////////////////////////////////////////////////////////////////////////////

export const DEFAULT_SLOT = 'default'

export enum ElementType {
    Page,
    Component,
    Expression
}

export type Meta = {
    title: string;
    description: string;
}

export type Slots = {
    [key: string]: (Component | Expression)[];
}

export type Component = Meta & {
    type: ElementType.Component
    url: string;
    slots: Slots;
    glob: unknown;
}

export type Page = Omit<Component, "type"> & {
    type: ElementType.Page
};

export type Expression =  Omit<Component, "type"> & {
    type: ElementType.Expression;
    prefix: string;
    suffix: string;
}
