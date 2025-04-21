import type { AsyncOrSync } from "ts-essentials";
import Button from "@components/ui/button";
import { useState, type ReactNode } from "react";

interface Props {
    children?: ReactNode;
    onclick?: () => AsyncOrSync<unknown>;
    // any props that come into the component
    variant?: string
    style?: string
    loading?: boolean
}

function LoadingButton({children, onclick, ...props}: Props) {
    let [loading, setLoading] = useState(false);

    return <Button {...props}
        loading={props.loading || loading}
        onclick={async () => {
            setLoading(true);
            try {
                if (onclick) {
                    await onclick();
                }
            } catch (e) {
                console.error(e);
                throw e;
            } finally {
                setLoading(false);
            }
        }
    }>
        {children}
    </Button>
}

export default LoadingButton