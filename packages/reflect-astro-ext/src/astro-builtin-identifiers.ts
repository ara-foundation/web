import { Result } from "@ara-web/p-hintjens";
import { ModuleLink } from "@ara-web/sds";
import { 
    CodePiece, 
    type CodePieceFilter, 
    type GenericHandler,
    ValueTypeString, 
    type ValueType,
    Code,
    TsNode,
    VariableLevel,
    CodePieceType
} from "@ara-web/reflect/code-level";
import type { AstroCookies, AstroGlobal, AstroInstance, MarkdownInstance, RewritePayload } from "astro";

// Create a default AstroGlobal object
const data: Omit<AstroGlobal, 
    "getActionResult" | "callAction" | "self" | "glob"
> & {
    getActionResult: () => Promise<undefined>,
    callAction: () => Promise<undefined>,
    self: ValueTypeString.object,
    instance: AstroInstance,
    markdown: MarkdownInstance<{
        title: string;
    }>,
    action: {
        accept: unknown;
        data: unknown;
        formData: unknown;
        method: unknown;
        name: unknown;
        url: unknown;
        waitUntil: unknown;
        json: unknown;
        redirect: unknown;
        text: unknown;
        headers: unknown;
        request: unknown;
        response: unknown;
        status: unknown;
        statusText: unknown;
        statusCode: unknown;
        statusMessage: unknown;
    },
    glob: (globStr: `${string}.astro` | `${string}.markdown` | `${string}.mdown` | `${string}.mkdn` | `${string}.mkd` | `${string}.mdwn` | `${string}.md`) => Promise<unknown[]>,
    compressHTML: false,
    headers: Headers,
} = {
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
    redirect: (_path: string, status?: number) => new Response(null, { status: status || 302 }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rewrite: async (_rewritePayload: RewritePayload) => new Response(null),
    routePattern: "",
    self: {} as ValueTypeString.object,
    slots: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        has: (_slotName: string): boolean => true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render: async (_slotName: string, _args?: unknown[]): Promise<string> => "",
    } as Record<string, true | undefined> & {
        has(slotName: string): boolean;
        render(slotName: string, args?: unknown[] | undefined): Promise<string>;
    },
    cookies: {} as AstroCookies,
    instance: {} as AstroInstance,
    markdown: {} as MarkdownInstance<{title: string}>,
    glob: (globStr: `${string}.astro` | `${string}.markdown` | `${string}.mdown` | `${string}.mkdn` | `${string}.mkd` | `${string}.mdwn` | `${string}.md`): Promise<unknown[]> => {
        const astroInstance = {} as AstroInstance;
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

const astroGenericHandler: GenericHandler = (_: CodePiece, values: ValueType[]): Result<CodePiece> => {
    if (values.length !== 0) {
        return Result.fail(
            `Generic not supported for the Astro yet.`,
            `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`
        )
    }

    return Result.errorCode501(['BuiltInIdentifiers'], 'astroGenericHandler');
}

/**
 * Adds the global variables available in Astro framework, such
 * as `Astro` variable.
 */
export class AstroBuiltInIdentifiers {
    private static prefix = '_';
    private static identifiers = ['Astro'];
    private static builtInSrc = `
        export const ${this.prefix}${this.identifiers[0]} = {};
    `;

    private static _identifiers: CodePiece[] = [];

    public static isBuiltInIdentifier: CodePieceFilter = (child: CodePiece): boolean => {
        if (child.identifier === undefined) {
            return false;
        }
        return this.identifiers.includes(child.identifier)
    }

    public static isNonBuiltInIdentifier: CodePieceFilter = (child: CodePiece): boolean => {
        return !this.isBuiltInIdentifier(child);
    }

    private static getVariableAstNode = async (identifier: string, tsNodes: TsNode[]): Promise<Result<CodePiece>> => {
        const varIdentifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (varIdentifiers.isFailure) {
            return Result.fail(
                `VariableLevel.getVariableIdentifiers(): ${varIdentifiers.errorTitle}`,
                varIdentifiers.errorDescription!
            )
        }
        const found = varIdentifiers.getValue().find((codePiece => codePiece.identifier === identifier))
        if (found !== undefined) {
            return Result.ok(found);
        }
    
        return Result.fail(
            `The '${identifier}' not found in the nodes list`,
            `Please make sure the code is valid or pass the correct identifier`
        )
    }

    public static getBuiltInIdentifiers = async (): Promise<Result<CodePiece[]>> => {
        if (this._identifiers.length > 0) {
            return Result.ok(this._identifiers);
        }
        const identifiers: CodePiece[] = [];
        const code = new Code(this.builtInSrc, ModuleLink.newFileURL(import.meta.filename));
    
        const varStatements = code.getTsNodes()
        
        const astNode0 = await this.identifyAstroAstNode(varStatements)
        if (astNode0.isFailure) {
            return Result.fail(
                `identifyAstroAstNode('${varStatements[0].getText()}'): ${astNode0.errorTitle}`,
                astNode0.errorDescription!
            )
        } else {
            identifiers.push(astNode0.getValue());
        }
    
        this._identifiers = identifiers;
        return Result.ok(identifiers);
    }
    

    //------------------------------------------------------------------
    //
    //  modules
    //
    //------------------------------------------------------------------

    private static identifyAstroAstNode = async (varStatements: TsNode[]): Promise<Result<CodePiece>> => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[0], varStatements)
        if (astNode.isFailure) {
            return Result.fail(
                `getVariableAstNode('${this.prefix + this.identifiers[0]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`,
                astNode.errorDescription!
            )
        }

        astNode.getValue().identifier = this.identifiers[0];
        astNode.getValue().nodeType = CodePieceType.Variable;
        astNode.getValue().data = data;
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = typeof data;
        astNode.getValue().putGenericHandler(astroGenericHandler);

        return Result.ok(astNode.getValue());
    }

    
}