// Redirect receives one argument.

import type { ExtensionType as GeneralExtensionType } from "..";

// The url to redirect to
export type ExtensionType = Omit<GeneralExtensionType, 'inputs'> & { inputs: [string] };
