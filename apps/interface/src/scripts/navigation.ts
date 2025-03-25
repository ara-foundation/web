import { LungtaTypes } from "@scripts/lungtaTypes";

/**
 * The top level navigation which is composed of the projects such as:
 * - Ara
 * - BookBike
 * - etc...
 */
export type Navigation = NavigationNode[];

export enum RestNavigationKey {
    get = "get",
    post = "post",
    delete = "delete",
    patch = "patch",
}

/**
 * Add a custom navigation within the Lungta Model of the project.
 * For example its used to add sub-projects.
 */
export type SubNavigation = {
    projectSlug: string;
    lungta: LungtaTypes;
    element: NavigationNode;
}

export type NavigationNode = {
    lungtaNavigation?: LungtaTypes;
    props: NavigationElement;
    children?: NavigationNode[]
}

export const NewRestNavigation = (): NavigationNode[] => {
    return [
        {
            props: restNavigationKeyToNavigationElement(RestNavigationKey.get),
            children: [],
        },
        {
            props: restNavigationKeyToNavigationElement(RestNavigationKey.post),
            children: [],
        },
        {
            props: restNavigationKeyToNavigationElement(RestNavigationKey.patch),
            children: [],
        },
        {
            props: restNavigationKeyToNavigationElement(RestNavigationKey.delete),
            children: [],
        }
    ]
}


/**
 * Standard used colors for REST api accross dev platforms such codes are in StackOverflow Refs, GitHub issues.
 */
export const restNavigationKeyToNavigationElement = (key: RestNavigationKey): NavigationElement => {
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

export const NewLungtaElement = (lungtaType: LungtaTypes): NavigationElement => {
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

export const navigationElementToNavigationNode = (element: NavigationElement): NavigationNode => {
    return {
        props: element,
        children: [],
    }
}

export const NewLungta = (): NavigationNode[] => {
            return [
                {
                    props: NewLungtaElement(LungtaTypes.Logos),
                    children: [],
                },
                {
                    props: NewLungtaElement(LungtaTypes.Aurora),
                    children: [],
                },
                {
                    props: NewLungtaElement(LungtaTypes.Maydone),
                    children: [],
                },
                {
                    props: NewLungtaElement(LungtaTypes.Act),
                    children: [],
                },
                {
                    props: NewLungtaElement(LungtaTypes.Sangha),
                    children: [],
                }
            ]
};

export const NewAraNavigation = (): NavigationNode => {
    return {
        props: {
            title: "Ara",
            slug: "ara"
        },
        children: NewLungta()
    }
}

export const NewDefaultNavigation = (): Navigation => {
    return [NewAraNavigation()];
}

const selectPathInNavigationChildren = (oldSlugs: string[], nodes: NavigationNode[] | undefined): NavigationNode[] | undefined => {
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
            nodes[i].children = selectPathInNavigationChildren(slugs, nodes[i].children);
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

    const projectSlug = slugs.shift();

    for (let projectIndex in navigation) {
        const project = navigation[projectIndex];

        if (project.props.slug !== projectSlug) {
            navigation[projectIndex].props.selected = false;
        } else {
            navigation[projectIndex].props.selected = true;
            navigation[projectIndex].props.visible = true;
            navigation[projectIndex].children = selectPathInNavigationChildren(slugs, navigation[projectIndex].children);
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