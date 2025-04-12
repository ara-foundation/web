import type { ReactNode } from "react";
import React from "react";

interface Props {
    children?: ReactNode
    // any props that come into the component
}

function Component({children}: Props) {
    return <></>
}

export default Component;

