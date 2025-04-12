import { JSDoc } from "ts-morph";

/**
 * Is the node in AST is not important part of the code?
 * Such as `;` command separator, or a comment
 * @param child 
 * @returns {boolean}
 */
export const isNonImportantNode = (child: any): boolean => {
    if (child.getText() === ";") {
        return true;
    }
    if (child instanceof JSDoc) {
        return true;
    }

    return false;
}

/**
 * Is the node in AST is one of the identifiers you pass
 * @param child 
 * @param identifiers 
 * @returns 
 */
export const isOneOfIdentifiers = (child: any, identifier: string[]|string): boolean => {
    if (typeof identifier === "string") {
        return identifier === child.getText();
    }
    return identifier.indexOf(child.getText()) > -1;
}

export const isExportKeyword = (child: any): boolean => {
    return isOneOfIdentifiers(child, "export");
}

export const isConstKeyword = (child: any): boolean => {
    return isOneOfIdentifiers(child, "const");
}

export const isTypeKeyword = (child: any): boolean => {
    return isOneOfIdentifiers(child, "type");
}