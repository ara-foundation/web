/**
 * Actions are defining the user flow
 */

import type { ColumnSlug, Page, RowSlug } from "./page";

export type Button = {
    label?: string;    // For example: 'Create Community'
    classes?: string; // For example: 'btn-secondary'
    onClick?: string;   // For example: 'RPC [{"name":push_remote, inputs: ['remote_url','action_data']}]
    onSuccess?: string; // For example: 'RPC [{"name":redirect_ext, inputs: ['success']}]
}

export type Link = Button & {
    url: string;
}

/**
 * @typedef Trigger defines how the action is triggered
 */
export type Trigger = {
    view: Button; // Button as a trigger
    slug: {
        [key in RowSlug]?: {
            [key in ColumnSlug]?: string;
        }
    }          // The page slug
    fix?: boolean;  // Fix the button or not?
}

export type PageWithAction = Page & {
    trigger: Trigger;
}

export type Action = {
    goal: string;
    description: string; 
    trigger: Trigger;
    pages: Page[];
}