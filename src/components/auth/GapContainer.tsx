import type { ReactNode } from "react";

interface Props {
    children?: ReactNode
    // any props that come into the component
}

function GapContainer({children}: Props) {
    return <div className="flex flex-col gap-2">
        {children}
    </div>
}

export default GapContainer;

