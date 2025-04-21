import { lib } from "@scripts/shieldlabs/libs";
import { useEffect, useState } from "react";

interface Props {
    url?: URL
    // any props that come into the component
}

function handleRedirect({url}: Props) {
    const [ready, setReady] = useState('');

    useEffect(() => {
        lib.authProvider.handleRedirect(url).then(() => {
            setReady('done');
        }).catch((e) => {
            setReady(e.toString());
        });
    });

    if (url === undefined) {
        return (<div>Handle Redirect (requires a URL property to be passed)</div>)
    }

    if (!ready) {
        return (<div>{"Processing authentication..."}</div>);
    }

    if (ready === 'done') {
        return (<a href="/" className="link">Main</a>);
    }

    return (<div>{ready}</div>)
}

export default handleRedirect;