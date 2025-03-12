import { getBundlerClient, lib, publicClient } from "@scripts/shieldlabs/libs";
import { provider } from "@scripts/shieldlabs/libs/chain";
import { toJwtNonce } from "@scripts/shieldlabs/libs/services/JwtAccountService";
import { EXTEND_SESSION_SEARCH_PARAM } from "@scripts/shieldlabs/libs/utils";
import { formatDistance, formatDuration, intervalToDuration } from "date-fns";
import { ethers } from "ethers";
import { assert } from "ts-essentials";
import { privateKey } from "@scripts/state";
// import SendEthCard from "$lib/SendEthCard.svelte";
import { useEffect, useState } from "react";
import GapContainer from "./GapContainer";
import LoadingButton from "@components/ui/LoadingButton";
import ms from "ms";
import { useInterval } from "usehooks-ts";
import SendEth, { SendEthModalId } from "./SendEthModal";

const SESSION_DURATION = ms("5 min");

type AccountInfo = {
  address: `0x${string}`;
  ownerInfo: {
    owner: any;
    expirationTimestamp: number;
  } | undefined | "expired";
}

type ExtendTime = {
  formattedDuration: string;
  value: number;
  max: number;
}

function ZKLogin() {
  const [extendSessionStart, setExtendSessionStart] = useState<number | null>(null);
  const [jwtAccountInfo, setJwtAccountInfo] = useState<AccountInfo|undefined>(undefined);
  const [jwt, setJwt] = useState<string|undefined>(undefined);
  const [extendingCountdown, setExtendingCountdown] = useState<ExtendTime | null>(null);
  useEffect(() => {
    lib.queries.jwt().then((jwtQuery) => {
      setJwt(jwtQuery ?? undefined);
    }).catch(e => {
      console.error(e);
    })
  }, [])

  useInterval(
    () => {
      if (extendSessionStart === null) {
        return;
      }
      
      const intervals = intervalToDuration({
        start: Date.now(),
        end: extendSessionStart + SESSION_DURATION,
      });
      let newCountdown: ExtendTime = {
        formattedDuration: formatDuration(intervals),
        value: Date.now() - extendSessionStart,
        max: SESSION_DURATION,
      };
      setExtendingCountdown(newCountdown);
    },
    // Delay in milliseconds or null to stop it
    extendSessionStart === null ? null: 1000,
  )

  let signerPrivateKey = privateKey.get();
  if (!signerPrivateKey) {
    signerPrivateKey = ethers.Wallet.createRandom().privateKey;
    privateKey.set(signerPrivateKey);
  }

  let signer = new ethers.Wallet(signerPrivateKey, provider);

  useEffect(() => {
    if (!jwt) {
      setJwtAccountInfo(undefined);
      return;
    }

    // lib.queries.queryClient();
    const fetchKeylessAccount = async () => {
      const account = await lib.jwtAccount.getAccount(jwt, signer);
      const ownerInfo = await lib.jwtAccount.currentOwner(account);
      return {
        address: account.address,
        ownerInfo:
          ownerInfo && ownerInfo.owner.toLowerCase() == signer.address.toLowerCase()
            ? ownerInfo.expirationTimestamp > Math.floor(Date.now() / 1000)
              ? ownerInfo
              : ("expired" as const)
            : undefined,
      };
    };
    fetchKeylessAccount().then((data) => {
      setJwtAccountInfo(data);
    });
  }, [jwt])
  // Show the params in useEffect params from queryKey: ["jwtCurrentOwner", jwt, signer.address],

  function extendSession() {
    setExtendSessionStart(Date.now());
    extendSessionInner().catch((e) => {
      console.error(`Error in extending the service: ${e}`)
    }).finally(() => {
      console.log(`Set extend start to 0`);
      setExtendSessionStart(null);
      setExtendingCountdown(null);
    });
  }

  async function extendSessionInner() {
    console.log("extend session");
    assert(jwt, "no session");

    // TODO: remove this
    await lib.zkLogin.publicKeyRegistry.requestPublicKeysUpdate(
      publicClient.chain.id,
    );
    
    const nonce = await toJwtNonce(signer);
    alert(`Extend session for Nonce: ${nonce} for ${await signer.getAddress()}`);

    const result = await lib.zkLogin.proveJwt(jwt, nonce);
    if (!result) {
      console.log(
        "Sign in again please to link your wallet to your Google account",
      );
      await new Promise(f => setTimeout(f, 2000));
      await signIn(signer, { extendSessionAfterLogin: true });
      return;
    }
    const { proof, input } = result;

    console.log("proof", proof);

    const tx = await lib.jwtAccount.setOwner(jwt, signer, {
      proof,
      jwtIat: input.jwt_iat,
      publicKeyHash: input.public_key_hash,
    });
    console.log("recovery tx", tx);
    await getBundlerClient(publicClient).waitForUserOperationReceipt({
      hash: tx,
    });
    console.log("Session extended successfully");
  }

  async function signIn(
    signer: ethers.Signer,
    { extendSessionAfterLogin = false } = {},
  ) {
    const nonce = await toJwtNonce(signer);
    alert(`Nonce: ${nonce} for ${await signer.getAddress()}`);
    await lib.authProvider.signInWithRedirect({ nonce });
  }

  useEffect(() => {
    const onMount = async () => {
      const url = new URL(location.href);
      if (
        url.searchParams.get(EXTEND_SESSION_SEARCH_PARAM.key) !==
        EXTEND_SESSION_SEARCH_PARAM.value
      ) {
        return;
      }
      url.searchParams.delete(EXTEND_SESSION_SEARCH_PARAM.key);
      history.replaceState(null, "", url.href);
      await extendSession();
    };
    onMount();
  }, []);

  const shortAddr = (addr: string): string => {
    return addr.substring(0, 8) + "..." + addr.substring(36); 
  }

  return (
    !jwt ?
        <GapContainer>
          <LoadingButton
            variant="default"
            style="width: 100%;"
            onclick={() => { signIn(signer)}}
          >
            Sign in with Google
          </LoadingButton>
        </GapContainer>
      :
      <div className="bg-blue-100 p-2 mt-0">
        {jwtAccountInfo === undefined ? <button disabled>Loading...</button> :
        <details className="dropdown w-full">
          <summary className="btn m-1 w-full btn-primary pt-2">{shortAddr(jwtAccountInfo.address)}</summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm text-sm w-full">
            <li className="text-sm w-full object-cover overflow-hidden">
              Address: {jwtAccountInfo.address}
            </li>
            <li className="w-full">
              Network: {publicClient.chain.name}
            </li>
            <li className="w-full">
                {jwtAccountInfo.ownerInfo === undefined 
                  ? "No session" 
                  : (jwtAccountInfo.ownerInfo === "expired" 
                    ? `Session expired` 
                    : `Session expiration: in ${formatDistance(
                        jwtAccountInfo.ownerInfo.expirationTimestamp * 1000,
                        Date.now(),
                    )}`
                  )
                }
            </li>
            <li>
                <LoadingButton
                    variant="default"
                    onclick={extendSession}
                    loading={extendSessionStart !== null}
                >
                  {jwtAccountInfo.ownerInfo === undefined ? "Create" : "Extend"} session
                </LoadingButton>
            </li>
            {extendingCountdown !== null ?
                  <li>
                    Remaining time: {extendingCountdown.formattedDuration}
                    <progress className="progress w-full" value={extendingCountdown.value} max={extendingCountdown.max}></progress>
                  </li>
            : null}
            {jwtAccountInfo.ownerInfo === undefined || jwtAccountInfo.ownerInfo === "expired"
              ? null
              : <>
                  <button className="btn" onClick={()=>document.getElementById(SendEthModalId).showModal()}>Send Eth</button>
                  <SendEth jwt={jwt} signer={signer} />
                </>
            }
          </ul>
        </details>
      }
      </div>
  )
}

export default ZKLogin;
