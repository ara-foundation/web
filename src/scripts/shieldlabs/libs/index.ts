import { AUTH } from "config";
import { zklogin } from "@scripts/shieldlabs/sdk";
import { ChainService, provider } from "./chain.js";
import { JwtAccountService } from "./services/JwtAccountService.js";
import { QueriesService } from "./services/QueriesService.svelte.js";
import { publicClient } from "./viemClients.js";

export * from "./viemClients.js";

console.log(`AUTH PROVIDER: ${AUTH.GOOGLE_CLIENT_ID}`);

const chain = new ChainService();
const zkLogin = new zklogin.ZkLogin(new zklogin.PublicKeyRegistry(""));
const authProvider = new zklogin.GoogleProvider(AUTH.GOOGLE_CLIENT_ID);
const jwtAccount = new JwtAccountService(publicClient, provider, zkLogin);
const queries = new QueriesService(authProvider);

const APP_NAME = "zkLogin";
export const lib = {
  APP_NAME,
  queries,
  chain,
  zkLogin,
  authProvider,
  jwtAccount,
};
