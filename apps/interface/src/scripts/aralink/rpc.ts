import { 
    AraLink, 
    PurlProtocol,
    AraWebSlug,
    AraWebModuleSlug,
    AraWebProtocol,
    AraIdentifierSlugs,
    AraExpressionSlugs
} from "@scripts/aralink/types";
import { isEqualArray } from "@scripts/array";
import type { EnumMembers } from "@scripts/reflect/codeLevel/types";
import { Node } from "ts-morph"

export const araWebModuleLink = (importPath: string): AraLink => {
    const araLink = new AraLink(PurlProtocol,
        importPath,
        [AraWebSlug, AraWebModuleSlug],
    )

    return araLink;
}

export const araIdentifierLink = (identifier: string, properties?: EnumMembers): AraLink => {
    const araLink = new AraLink(AraWebProtocol, identifier, AraIdentifierSlugs, properties);

    return araLink;
}

export const araReflectExpressionLink = (identifier: string, expression: Node|Array<Node>): AraLink => {
    const araLink = new AraLink(AraWebProtocol, expression, AraExpressionSlugs, {'identifier': identifier}) 
    return araLink;  
}

export const isAraIdentifierLink = (araLink: AraLink): boolean => {
    if (araLink.protocol !== AraWebProtocol) {
        return false;
    }
    if (araLink.slugs.length === 0) {
        return false;
    }

    if (!isEqualArray(araLink.slugs, AraIdentifierSlugs)) {
        return false;
    }

    return true;
}

export const isAraExpressionLink = (araLink: AraLink|undefined): boolean => {
    if (araLink === undefined) {
        return false;
    }
    if (araLink.protocol !== AraWebProtocol) {
        return false;
    }

    if (araLink.slugs.length === 0) {
        return false;
    }

    if (!isEqualArray(araLink.slugs, AraExpressionSlugs)) {
        return false;
    }

    return true;
}
