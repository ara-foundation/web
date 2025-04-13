import { type Page, Result } from "@ara-web/ts-enhancement";
import { globsToFileContents } from "./fileLevel.js";
import { PageTraits } from "./pageTraits.js";

/**
 *  @todo To identify the RPCs by components, use a special Typescript parser
 *  For now we rely on the component names
 * @param globs 
 * @returns 
 */
export const globsToPages = async (globs: Record<string, unknown>): Promise<Result<Page[]>> => {
    let pages: Page[] = [];
    let i = 0;

    const fileContents = await globsToFileContents(globs);

    for (let fileContent of fileContents) {
        i++;
        if (i < fileContents.length) {
            continue;
        } else if (i == fileContents.length + 1) {
            break;
        }
        console.log(`File Content #${i} at ${fileContent.filePath} to page`)
        const pageTraitsResult = PageTraits.fromFileContent(fileContent!);
        if (pageTraitsResult.isFailure) {
            pages.push({
                title: `PageTraits.fromFileContent: ${pageTraitsResult.errorTitle}`,
                description: pageTraitsResult.errorDescription!,
                fileName: fileContent.filePath,
                glob: fileContent.glob,
            })
            continue;
        }

        const pageTraits: PageTraits = pageTraitsResult.getValue();
        const identificationResult = await pageTraits.identifyComponents();
        if (identificationResult.isFailure) {
            pages.push({
                title: `PageTraits.identifyComponents: ${identificationResult.errorTitle}`,
                description: identificationResult.errorDescription!,
                fileName: fileContent.filePath,
                glob: fileContent.glob,
            })
            continue;
        } else {
            pages.push(identificationResult.getValue())
        }
    }

    return Result.ok(pages);
}
