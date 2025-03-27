/**
 * The top level navigation which is composed of the projects such as:
 * - Ara
 * - BookBike
 * - [project name]...
 * 
 * Terminology
 * @param {NavigationElement} NavigationElement A Web UI element to represent the navigation element
 * @param {NavigationNode} NavigationNode A navigation node in the navigation menu that are linked to each other
 * @param {Navigation} Navigation A list of navigation nodes with the same parent
 * @param {enum} RestNavigationKey A REST operation keys to use in the navigation
 * @param {SubNavigation} SubNavigation A piece of navigation to inject into the @Navigation
 * 
 */
import { LungtaTypes } from "@scripts/lungtaTypes";

export type Navigation = NavigationNode[];

/**
 * The ontology data is updated by the REST api, therefore we have the REST operations as navigation keys
 */
export enum RestNavigationKey {
    get = "get",
    post = "post",
    delete = "delete",
    patch = "patch",
}

/**
 * Add a custom navigation within the Lungta Model of the project.
 * For example its used to add sub-projects.
 * @param {string} projectSlug the project to add into
 * @param {LungtaTypes} lungta Where this navigation fits in the lungta model
 * @param {NavigationElement} element the navigation element itself
 */
export type SubNavigation = {
    projectSlug: string;
    lungta: LungtaTypes;
    element: NavigationNode;
}


/**
 * The Navigation Node in the Navigation
 * @param {LungtaTypes} lungtaNavigation optionally pass the lungta where its fit in
 * @param {NavigationElement} props the component properties
 * @param {NavigationNode[]} children sub nodes
 */
export type NavigationNode = {
    lungtaNavigation?: LungtaTypes;
    props: NavigationElement;
    children?: NavigationNode[]
}

/**
 * Returns nodes for each Rest operation
 * @returns {NavigationNode[]} list of navigation nodes for each REST operation
 */
export const newRestNavigation = (): NavigationNode[] => {
    const nodes = [];
    const restOperations = Object.keys(RestNavigationKey)
    for (let restOp of restOperations) {
        nodes.push(newRestNode(restOp as RestNavigationKey))
    }

    return nodes;
}


/**
 * Standard used colors for REST api accross dev platforms such codes are in StackOverflow Refs, GitHub issues.
 */
export const newRestElement = (key: RestNavigationKey): NavigationElement => {
    switch (key) {
        case RestNavigationKey.get: {
            return {
                title: 'Get',
                slug: 'get',
                color: 'aqua',
                visible: true,
            }
        }
        case RestNavigationKey.post: {
            return {
                title: 'Post',
                slug: 'post',
                color: 'green',
                visible: true,
            }
        }
        case RestNavigationKey.delete: {
            return {
                title: 'Red',
                slug: 'delete',
                color: 'red',
                visible: true,
            }
        }
        case RestNavigationKey.patch: {
            return {
                title: 'Patch',
                slug: 'patch',
                color: 'orange',
                visible: true,
            }
        }
    }
}

export const newRestNode = (key: RestNavigationKey): NavigationNode => {
    return {
        props: newRestElement(key),
        children: [],
    }
}

/**
 * The smallest piece of navigation is the navigation element.
 */
export type NavigationElement = {
    title: string;
    slug: string;
    color?: string;
    visible?: boolean;
    selected?: boolean;
    url?: string;
}

////////////////////////////////////////////////////////////////////////////////////
//
// Pre-defined navigations
//
////////////////////////////////////////////////////////////////////////////////////

export const newLungtaElement = (lungtaType: LungtaTypes): NavigationElement => {
    if (lungtaType === LungtaTypes.Logos) {
        return {
            title: "Logos",
            slug: "logos",
            color: "blue"
        }
    }

    if (lungtaType === LungtaTypes.Aurora) {
        return {
            title: "Aurora",
            slug: "aurora",
            color: "green"
        }
    }

    if (lungtaType === LungtaTypes.Maydone) {
        return {
            title: "MayDone",
            slug: "maydone",
            color: "yellow"
        }
    }

    if (lungtaType === LungtaTypes.Act) {
        return {
            title: "ACT",
            slug: "act",
            color: "orange"
        }
    }

    return {
        title: "Sangha",
        slug: "sangha",
        color: "red"
    }
}

export const elementToNode = (element: NavigationElement): NavigationNode => {
    return {
        props: element,
        children: [],
    }
}

export const newLungta = (): NavigationNode[] => {
            return [
                {
                    props: newLungtaElement(LungtaTypes.Logos),
                    children: [],
                },
                {
                    props: newLungtaElement(LungtaTypes.Aurora),
                    children: [],
                },
                {
                    props: newLungtaElement(LungtaTypes.Maydone),
                    children: [],
                },
                {
                    props: newLungtaElement(LungtaTypes.Act),
                    children: [],
                },
                {
                    props: newLungtaElement(LungtaTypes.Sangha),
                    children: [],
                }
            ]
};

export const AraProjectSlug = "ara"

export const newAraProject = (): NavigationNode => {
    return {
        props: {
            title: "Ara",
            slug: AraProjectSlug,
        },
        children: newLungta()
    }
}

export const newDefault = (): Navigation => {
    return [newAraProject()];
}

const nestedPathSelection = (oldSlugs: string[], nodes: NavigationNode[] | undefined): NavigationNode[] | undefined => {
    if (oldSlugs.length === 0 || nodes === undefined || nodes.length === 0) {
        return nodes;
    }

    const slugs = oldSlugs.slice();
    const slug = slugs.shift()
    for (let i in nodes) {
        if (nodes[i].props.slug !== slug) {
            nodes[i].props.selected = false;
        } else {
            nodes[i].props.selected = true;
            nodes[i].props.visible = true;
            nodes[i].children = nestedPathSelection(slugs, nodes[i].children);
        }
    }
    
    return nodes;
}

export const selectPath = (selectedPath: string | undefined, navigation: Navigation): Navigation => {
    if (selectedPath === undefined) {
        return navigation;
    }
    const slugs = selectedPath.split("/");
    if (slugs.length === 0) {
        return navigation;
    }

    if (selectedPath.indexOf("/") === 0) {
        slugs.shift();
    }
    const projectSlug = slugs.shift();

    for (let projectIndex in navigation) {
        const project = navigation[projectIndex];

        if (project.props.slug !== projectSlug) {
            navigation[projectIndex].props.selected = false;
        } else {
            navigation[projectIndex].props.selected = true;
            navigation[projectIndex].props.visible = true;
            navigation[projectIndex].children = nestedPathSelection(slugs, navigation[projectIndex].children);
        }
    }

    return navigation;
}

export const newAraWebNavigationNode = (): NavigationNode => { 
    return {
        props: {
            title: "Ara Web",
            slug: "ara-web",
            color: "indigo",
            visible: true,
        },
        children: [
            {
                props: {
                    title: "Component",
                    slug: "component",
                    color: "pink",
                    visible: true,
                },
                children: []
            },
            {
                props: {
                    title: "Page",
                    slug: "page",
                    color: "gray",
                    visible: true,
                },
                children: []
            },
            {
                props: {
                    title: "Action",
                    slug: "action",
                    color: "green",
                    visible: true,
                },
                children: []
            },
            {
                props: {
                    title: "RPCs",
                    slug: "rpc",
                    color: "brown",
                    visible: true,
                },
                children: []
            }
        ]
    }
}

export const newCommunityNavigationNode = (): NavigationNode => { 
    return {
        props: {
            title: "Community",
            slug: "community",
            color: "red",
            visible: true,
        },
        children: []
    }
}


const setNodeUrls = (node: NavigationNode, prefix: string = ''): NavigationNode => {
    node.props.url = `${prefix}/${node.props.slug}`;
    if (node.children !== undefined && node.children.length > 0) {
        for (let i in node.children) {
            let child = node.children[i];
            node.children[i] = setNodeUrls(child, node.props.url);
        }
    }
    return node;
}

export const setUrls = (navigation: Navigation, prefix: string = ''): Navigation => {
    for (let projectIndex in navigation) {
        const project = navigation[projectIndex];
        navigation[projectIndex] = setNodeUrls(project);
    }    
    return navigation;
}