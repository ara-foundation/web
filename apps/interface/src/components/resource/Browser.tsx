import { classes, properties, useCurrentAgent } from "@tomic/react";
import { useState, useMemo } from "react";
import { Resource } from "@components/resource/Resource";
import { AppContext, defaultResourceUrl } from "@scripts/atomicServer";

const demoLinks = [
  {
    url: defaultResourceUrl,
    label: "Logos Resource"
  },
  {
    url: classes.agent,
    label: "Agent (Class)"
  },
  {
    url: properties.description,
    label: "Description (Property)"
  },
  // Example how it works:
  // {
  //   url:
  //     "https://atomicdata.dev/agents/QmfpRIBn2JYEatT0MjSkMNoBJzstz19orwnT5oT2rcQ=",
  //   label: "Joep.io (Agent)"
  // }
];



/** For this demo app, we create a Browser that uses some stateful URL to decide which
 * resource should be rendered at a given time. */
export default function Browser() {
  const [subject, setSubject] = useState(defaultResourceUrl);
  // We use React Context to
  const contextSubjectHook = useMemo(() => ({ subject, setSubject }), [
    subject
  ]);

  // This hook can be used for getting and setting the current Agent.
  // In other words, this is how you can let users sign in.
  // https://docs.atomicdata.dev/agents.html
  // const [agent] = useCurrentAgent();

  return (
    <AppContext.Provider value={contextSubjectHook}>
      <h1>Atomic Data Resources</h1>
      {/* <em>
        {agent ? (
          <>
            signed in as agent: <a href={agent.subject}>{agent.subject}</a>{" "}
          </>
        ) : (
          "not signed in"
        )}
      </em> */}
      <br />
      <select onChange={(e) => setSubject(e.target.value)}>
        {demoLinks.map((item) => (
          <option value={item.url}>{item.label}</option>
        ))}
      </select>
      <br />
      <label htmlFor="subject">Subject (URL)</label>
      <input
        id="subject"
        style={{ width: "100%" }}
        onChange={(e) => setSubject(e.target.value)}
        value={subject}
      />
      {/* By passing an Atomic Data URL (subject) here, we can Render that resource! */}
      <Resource subject={subject} key={subject} />
    </AppContext.Provider>
  );
}
