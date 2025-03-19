/**
 * In Atomic Data, fetching and updating the data is done through the Store.
 */

import { Store } from '@tomic/lib';
import { initOntologies } from '../ontologies';
import { createContext } from "react";
import { lungta } from "../ontologies/lungta"

export const defaultResourceUrl: string = lungta.classes.logos;

let store: Store;

export function getStore(): Store {
  if (!store) {
    // On first call, create a new store.
    store = new Store({
      serverUrl: import.meta.env.ATOMIC_SERVER_URL,
      // If your data is not public, you have to specify an agent secret here. (Don't forget to add AGENT_SECRET to the .env file)
      // agent: Agent.fromSecret(import.meta.env.AGENT_SECRET),
    });

    // @tomic/lib needs to know some stuff about your ontologies at runtime so we do that by calling the generated initOntologies function.
    initOntologies();
  }

  return store;
}


/** We create a React Context which allows us to access and set the subject anywhere in the app */
export const AppContext = createContext({
  subject: defaultResourceUrl,
  setSubject: (subject: string) => {}
});