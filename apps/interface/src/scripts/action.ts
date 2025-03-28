/**
 * Actions are defining the user flow
 */

import type { ElementType } from "@scripts/component";
import { ColumnSlug, RowSlug } from "@scripts/page";
import { type RpcCall, rpcCalls } from "@scripts/rpc";

export type Button = {
    label?: string;    // For example: 'Create Community'
    classes?: string; // For example: 'btn-secondary'
}

export type Link = Button & {
    url: string;
}

export const isLinkView = (view: Button | Link | undefined): boolean => {
    return view === undefined ? false : (view as Link).url !== undefined
}

// Where to show the Trigger on the page
export type LayoutPath = {
    [key in RowSlug]?: ColumnSlug
}

/**
 * @typedef Trigger defines how the action is triggered
 */
export type Trigger = {
    view: Button | Link; // Button as a trigger
    onClick?: RpcCall[];   // If `Trigger.view` is Button, for link its not necessary
    layout: LayoutPath;
    fix?: boolean;  // Fix the button or not?
    pages?: string[]    // Page paths that will show the action, if not given then probably its mixed with the page already
                        // see also PageWithAction
}

export type PageWithAction = {
    url: string;
    trigger: Trigger;
}

export type Action = {
    slug: string;
    goal: string;
    description: string; 
    trigger: Trigger;
    flow: PageWithAction[];
    nonPageComponents?: ElementType[];  // Modals for example to put outside of the web page itself
    onSuccess: RpcCall[]
}

/**
 * Let's have the Creating a project for example
 */

const createCommunityButton: Button = {
    label: "Create Community",
};
const createCommunityClick: RpcCall[] = [
    {
        ...rpcCalls.extension!["redirect"],
        inputs: ["/ara/logos/post"]
    }
]
const createCommunitySuccess: RpcCall[] = [
    {
        ...rpcCalls.extension!["redirect"],
        inputs: ["/ara/logos/community"]
    }
]

const createCommunityEnd: RpcCall[] = [
    {
        ...rpcCalls.extension!["alert"],
    }
]

const logosPostTrigger: Trigger = {
    view: {
        label: "Create Project (Action)",
        url: "/ara/maydone/post"
    } as Link,
    layout: {
        footer: "center" as ColumnSlug
    },
    fix: true,
}
const maydonePostTrigger: Trigger = {
    view: {
        label: "Set Budget",
        url: "/ara/sangha/post",
    } as Link,
    layout: {
        footer: "center" as ColumnSlug
    },
    fix: true,
}
const sanghaPostTrigger: Trigger = {
    view: {
        label: "Set Token Settings",
    } as Button,
    onClick: createCommunityEnd,
    layout: {
        content: "center" as ColumnSlug,
    },
    fix: false,
}
const logosPostUrl = "/ara/logos/post"
const maydonePostUrl = "/ara/maydone/post"
const sanghaPostUrl = "/ara/sangha/post"

console.log(`TODO: Create an action navigation that is shown on the right side of the pages. Like cancel etc`);

const createCommunity: Action = {
    slug: "create-community",
    goal: "Create a new Community",
    description: "Action to set up a new project and its community",
    trigger: {
        view: createCommunityButton,
        onClick: createCommunityClick,
        layout: {
            footer: "center" as ColumnSlug
        },
        fix: true,
        pages: [
            "/ara/logos/community"
        ]
    },
    flow: [
        {
            url: logosPostUrl,
            trigger: logosPostTrigger,
        },
        {
            url: maydonePostUrl,
            trigger: maydonePostTrigger
        },
        {
            url: sanghaPostUrl,
            trigger: sanghaPostTrigger
        }
    ],
    onSuccess: createCommunitySuccess,
}

export const getActions = (): Action[] => {
    return [
        createCommunity,
    ]
}

export const getActionBySlug = (slug: string): Action|undefined => {
    const actions = getActions();

    for (const action of actions) {
        if (action.slug === slug) {
            return action;
        }
    }

    return undefined;
}

export const layoutPathToSlug = (layoutPath: LayoutPath): string => {
    if (layoutPath.header !== undefined) {
        return `${RowSlug.Header}/${layoutPath.header}`
    }
    if (layoutPath.content !== undefined) {
        return `${RowSlug.Content}/${layoutPath.content}`
    }
    if (layoutPath.footer !== undefined) {
        return `${RowSlug.Footer}/${layoutPath.footer}`
    }

    return '';
}