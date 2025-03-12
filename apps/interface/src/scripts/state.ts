import { atom } from 'nanostores';
import { persistentAtom } from "@nanostores/persistent"

export const giftClaimed = atom(false);
export const thankYouAccepted = atom(false);
export const hasAraToken = atom(false);
export const privateKey = persistentAtom<string>("PRIVATE_KEY", "");
export const extendSessionStart = persistentAtom<string>("SESSION_START", "0");
