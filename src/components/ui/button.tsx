import type { ReactNode } from "react";
import type { AsyncOrSync } from "ts-essentials";

interface Props {
    children?: ReactNode;
    onclick?: () => AsyncOrSync<unknown>;
    // any props that come into the component
    variant?: string
    style?: string
    loading?: boolean
}

function Button({loading, children, onclick}: Props) {
    return <button
    className="no-underline btn btn-secondary"
    disabled={loading} 
    onClick={onclick}
    >
      {loading ? "Loading" : children}
    </button>
}

export default Button