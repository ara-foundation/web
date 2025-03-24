/**
 * In Atomic Data, fetching and updating the data is done through the Store.
 */

import { Store } from '@tomic/lib';
import { initOntologies } from '../ontologies';
import { createContext } from "react";
import { lungta } from "../ontologies/lungta"

export const defaultResourceUrl: string = lungta.classes.logos;

let store: Store;

export enum OntologyType {
  class = "class",
  property = "propery"
};

export type OntologyLink = {
  url: string,
  label: string,
  type: OntologyType
}

export const findLink = (ontologyType: OntologyType, label: string): OntologyLink | undefined => {
  const links = lungtaOntologyLinks();
  for (const link of links) {
    if (link.type === ontologyType && link.label === label) {
      return link;
    }
  }

  return undefined;
}

// Lungta Ontology
export const lungtaOntologyLinks = (): OntologyLink[] => {
  const links: OntologyLink[] = [];

  let classType: keyof typeof lungta.classes;
  for (classType in lungta.classes) {
    const link = {
      url: lungta.classes[classType],
      label: classType,
      type: OntologyType.class
    }
    links.push(link);
  }

  let propertyType: keyof typeof lungta.properties;
  for (propertyType in lungta.properties) {
    const link = {
      url: lungta.properties[propertyType],
      label: propertyType,
      type: OntologyType.property,
    }
    links.push(link);
  }

  return links;
}

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