import type { NavigationElement } from "@scripts/navigation";

export const getColorCss = (color?: string): string => {
    if (color === undefined) {
        color = "purple";
    }
    return `bg-${color}-500 hover:bg-${color}-400`;
}

export const getNavigationElementCss = (props?: NavigationElement): string => {
    const selectedBorder = "border-t-4 border-r-4 border-b-4 border-white-500";
    const css = (props?.selected ? " active text-white " + selectedBorder: "disabled");

    return css;
}