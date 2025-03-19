import {
    properties,
    useCanWrite,
    useResource,
    useString,
    useTitle
  } from "@tomic/react";
  import PropVal from "@components/resource/PropVal";
  import { useState } from "react";
  
  interface Props {
    /** The subject URL - the identifier of the resource. */
    subject: string;
  }
  
  export function Resource({ subject }: Props) {
    // The useResource hook fetches the subject URL, and converts it into a Resource.
    // The Resource is fetched only once, and it is stored in the Store to be re-used.
    // This Resource contains all its values, and provides various useful methods.
    const resource = useResource(subject);
  
    // The useTitle hook internally checks for various properties that could be used as a title.
    // If none are available, it will create one from the subject URL.
    const [title, setTitle] = useTitle(resource);
  
    // Let's make an editable / form field.
  
    // Since we might get (validation) errors, we should show these to the user, and store them in some state
    const [err, setErr] = useState<Error>();
  
    // Use datatype specific hooks to get typesafe values for properties.
    // This hook means: for this resource, get the "https://atomicdata.dev/properties/description" property, and
    // return it as a string!
    // The second part of the Hook can be used to edit this value.
    // You still need to call resource.save() to persist changes.
    const [description, setDescription] = useString(
      resource,
      // Here, we pass a Property URL
      properties.description,
      // And some options for saving.
      {
        // We directly send all commits to the server, no manual 'save' required
        commit: true,
        commitDebounce: 100,
        // When things go wrong with saving, we can set a handler for the error (message)
        handleValidationError: setErr
      }
    );
  
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
  
    // ... except for the ones we've already rendered!
    const except = [
      properties.description,
      properties.name,
      properties.shortname
    ];
  
    return (
      <div>
        <h2>Title: {title}</h2>
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
            <i>
              You cannot edit this resource:
              {canWriteErr}
            </i>
            <p>{description}</p>
          </>
        )}
        {err && <p>{err.message}</p>}
        {propVals.map(([prop, val]) => {
          if (except.includes(prop)) {
            return null;
          }
          return <PropVal key={prop} propertyURL={prop} value={val} />;
        })}
      </div>
    );
  }
  