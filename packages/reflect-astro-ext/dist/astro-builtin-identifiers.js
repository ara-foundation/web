import { Result } from "@ara-web/p-hintjens";
import { ModuleLink } from "@ara-web/sds";
import { CodePiece, ValueTypeString, Code, TsNode, VariableLevel, CodePieceType } from "@ara-web/reflect/code-level";
// Create a default AstroGlobal object
const data = {
    url: new URL("http://localhost"),
    params: {},
    props: {},
    request: new Request("http://localhost"),
    response: {
        status: 200,
        headers: new Headers()
    },
    getActionResult: async () => undefined,
    callAction: async () => undefined,
    redirect: (_path, status) => new Response(null, { status: status || 302 }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rewrite: async (_rewritePayload) => new Response(null),
    routePattern: "",
    self: {},
    slots: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        has: (_slotName) => true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render: async (_slotName, _args) => "",
    },
    cookies: {},
    instance: {},
    markdown: {},
    glob: (globStr) => {
        const astroInstance = {};
        astroInstance.url = ModuleLink.newFileURL(globStr).toFilePath;
        return Promise.resolve([astroInstance]);
    },
    site: new URL("http://localhost"),
    generator: "Reflect",
    clientAddress: "127.0.0.1",
    compressHTML: false,
    headers: new Headers(),
    action: {
        accept: {},
        data: {},
        formData: {},
        method: {},
        name: {},
        url: {},
        waitUntil: {},
        json: {},
        redirect: {},
        text: {},
        headers: {},
        request: {},
        response: {},
        status: {},
        statusText: {},
        statusCode: {},
        statusMessage: {}
    },
    originPathname: "",
    locals: {},
    preferredLocale: "",
    preferredLocaleList: [],
    currentLocale: "",
    isPrerendered: false,
};
const astroGenericHandler = (_, values) => {
    if (values.length !== 0) {
        return Result.fail(`Generic not supported for the Astro yet.`, `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`);
    }
    return Result.errorCode501(['BuiltInIdentifiers'], 'astroGenericHandler');
};
/**
 * Adds the global variables available in Astro framework, such
 * as `Astro` variable.
 */
export class AstroBuiltInIdentifiers {
    static prefix = '_';
    static identifiers = ['Astro'];
    static builtInSrc = `
        export const ${this.prefix}${this.identifiers[0]} = {};
    `;
    static _identifiers = [];
    static isBuiltInIdentifier = (child) => {
        if (child.identifier === undefined) {
            return false;
        }
        return this.identifiers.includes(child.identifier);
    };
    static isNonBuiltInIdentifier = (child) => {
        return !this.isBuiltInIdentifier(child);
    };
    static getVariableAstNode = async (identifier, tsNodes) => {
        const varIdentifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (varIdentifiers.isFailure) {
            return Result.fail(`VariableLevel.getVariableIdentifiers(): ${varIdentifiers.errorTitle}`, varIdentifiers.errorDescription);
        }
        const found = varIdentifiers.getValue().find((codePiece => codePiece.identifier === identifier));
        if (found !== undefined) {
            return Result.ok(found);
        }
        return Result.fail(`The '${identifier}' not found in the nodes list`, `Please make sure the code is valid or pass the correct identifier`);
    };
    static getBuiltInIdentifiers = async () => {
        if (this._identifiers.length > 0) {
            return Result.ok(this._identifiers);
        }
        const identifiers = [];
        const code = new Code(this.builtInSrc, ModuleLink.newFileURL(import.meta.filename));
        const varStatements = code.getTsNodes();
        const astNode0 = await this.identifyAstroAstNode(varStatements);
        if (astNode0.isFailure) {
            return Result.fail(`identifyAstroAstNode('${varStatements[0].getText()}'): ${astNode0.errorTitle}`, astNode0.errorDescription);
        }
        else {
            identifiers.push(astNode0.getValue());
        }
        this._identifiers = identifiers;
        return Result.ok(identifiers);
    };
    //------------------------------------------------------------------
    //
    //  modules
    //
    //------------------------------------------------------------------
    static identifyAstroAstNode = async (varStatements) => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[0], varStatements);
        if (astNode.isFailure) {
            return Result.fail(`getVariableAstNode('${this.prefix + this.identifiers[0]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`, astNode.errorDescription);
        }
        astNode.getValue().identifier = this.identifiers[0];
        astNode.getValue().nodeType = CodePieceType.Variable;
        astNode.getValue().data = data;
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = typeof data;
        astNode.getValue().putGenericHandler(astroGenericHandler);
        return Result.ok(astNode.getValue());
    };
}
