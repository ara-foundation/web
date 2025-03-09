import { lib } from "@scripts/shieldlabs/libs";
import { useEffect, useState } from "react";

interface Props {
    url: URL
    // any props that come into the component
}

function handleRedirect({url}: Props) {
    const [ready, setReady] = useState('');

    useEffect(() => {
        lib.authProvider.handleRedirect(url).then(() => {
            console.log(`Set it as done`);
            setReady('done');
        }).catch((e) => {
            console.log(`Set the error: ${e.toString()}`);
            setReady(e.toString());
        });
    });

    if (!ready) {
        return (<div>{"Processing authentication..."}</div>);
    }

    if (ready === 'done') {
        return (<a href="/" className="link">Main</a>);
    }

    return (<div>{ready}</div>)
}

export default handleRedirect;