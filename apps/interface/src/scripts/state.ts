import { atom } from 'nanostores';
import { persistentAtom } from "@nanostores/persistent"

export const giftClaimed = atom<boolean>(false);
export const thankYouAccepted = atom<boolean>(false);
export const hasAraToken = atom<boolean>(false);
export const privateKey = persistentAtom<string>("PRIVATE_KEY", "");
