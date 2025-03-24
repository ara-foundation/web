import {
    useCanWrite,
    useResource,
    useString,
    useTitle,
    core,
    commits,
    valToArray,
  } from "@tomic/react";
  import PropVal from "@components/resource/PropVal";
  import { useState } from "react";
  import DefitionLink from "@components/resource/definitionLink";
  import { useCurrentAgent } from "@tomic/react";
  
  interface Props {
    /** The subject URL - the identifier of the resource. */
    subject: string;
  }
  
  export function Resource({ subject }: Props) {
    const resource = useResource(subject);
    // This hook can be used for getting and setting the current Agent.
    // In other words, this is how you can let users sign in.
    // https://docs.atomicdata.dev/agents.html
    // const [agent] = useCurrentAgent();

    const [title] = useTitle(resource);
  
    // Let's make an editable / form field.
  
    // Since we might get (validation) errors, we should show these to the user, and store them in some state
    const [err, setErr] = useState<Error>();
    
    // And some options for saving.
    const commitOptions = {
      commit: false, // We directly send all commits to the server, no manual 'save' required
      commitDebounce: 100,
      handleValidationError: setErr, // When things go wrong with saving, we can set a handler for the error (message)
    }
  
    const [description, setDescription] = useString(resource, core.properties.description, commitOptions);
  
    // We can check whether the current Agent (user) has the correct rights to edit this resource.
    // If it does, we can render a form input!
    const [canWrite, canWriteErr] = useCanWrite(resource);

    // If something goes wrong while fetching the resource, there will be an error here
    if (resource.error) {
      return <div>{resource.error?.message}</div>;
    }
  
    // While the resource is being fetched, this will be true
    if (resource.loading) {
      return <div>loading...</div>;
    }
  
    // And let's also render all the properties that we didn't think of.
    // To do that, we take the map of all the PropVals and render these in a PropVal component.
    const propVals = [...resource.getPropVals()];
    console.log(`Prop vals`);
    console.log(propVals);
  
    // ... except for the ones we've already rendered!
    const except: string[] = [
      core.properties.description,
      core.properties.name,
      core.properties.shortname,
      core.properties.parent,
    ];

    const coreProps: string[] = [
      core.properties.isA,
      commits.properties.lastCommit,
    ]

    const corePropsLabels: {[key: string]: string} = {
      [core.properties.isA]: "Ontology Type",
      [commits.properties.lastCommit]: "Last Transaction" 
    }

      /* <em>
        {agent ? (
          <>
            signed in as agent: <a href={agent.subject}>{agent.subject}</a>{" "}
          </>
        ) : (
          "not signed in"
        )}
  </em> */
  
    return (
      <div className="ml-10">
        <h1>{title} <DefitionLink url={subject} /></h1>
        {description && canWrite ? (
          <>
            <textarea
              rows={6}
              cols={40}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <br />
            <i>
              Edits are syncrhonized live, try opening this at{" "}
              <a href={subject}>{subject}</a>{" "}
            </i>
          </>
        ) : (
          <>
            <i className="text-gray-400">
              You cannot edit this resource {canWriteErr}
            </i>
            <p>{description}</p>
          </>
        )}
        {err && <p>{err.message}</p>}
        <hr className="text-gray-400" />
        <ul className="list bg-gray-200 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Core Properties</li>
          {propVals.map(([prop, val]) => {
            if (!coreProps.includes(prop)) {
              return null;
            }
            return <PropVal propertyLabel={corePropsLabels[prop]} key={prop} propertyURL={prop} value={val} enableAction={false} />;
          })}
          
        </ul>

        <hr className="text-gray-400" />
        <ul className="mt-4 list bg-gray-200 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Required Properties</li>
          {propVals.map(([prop, val]) => {
            if (prop != core.properties.requires) {
              return null;
            }
            return valToArray(val).map((reqProp) => (
              <PropVal key={reqProp?.toString()} propertyURL={reqProp!.toString()} value={reqProp?.toString()} />
            ))
          })}
          
        </ul>

        <ul className="mt-4 list bg-gray-200 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Recommended Properties</li>
          {propVals.map(([prop, val]) => {
            if (prop != core.properties.recommends) {
              return null;
            }
            return valToArray(val).map((reqProp) => (
              <PropVal key={reqProp?.toString()} propertyURL={reqProp!.toString()} value={reqProp?.toString()} />
            ))
          })}
          
        </ul>
        
      </div>
    );
}

export default Resource;