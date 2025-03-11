import { bnToLimbStrArray } from "@mach-34/noir-bignum-paramgen";
import { utils } from "@shield-labs/utils";
import deployments from "@scripts/shieldlabs/contracts/deployments.json";
import circuit from "@scripts/shieldlabs/contracts/noir/target/jwt_account.json";
import { isEqual } from "lodash-es";
import { Base64, Bytes, Hex } from "ox";
import { assert } from "ts-essentials";
import { PublicKeyRegistry } from "./PublicKeyRegistry.js";
import {
  decodeJwt,
  noirPackBytes,
  pedersenHash,
  splitJwt,
  toBoundedVec,
} from "./utils.js";

import { UltraPlonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

// @ts-ignore
import acvm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
// @ts-ignore
import noirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';
import initNoirC from '@noir-lang/noirc_abi';
import initACVM from '@noir-lang/acvm_js';

// Note: keep in sync with Noir
const JWT_HEADER_MAX_LEN = 256;
// Note: keep in sync with Noir
const JWT_PAYLOAD_JSON_MAX_LEN = 768;
// Note: keep in sync with Noir
const JWT_PAYLOAD_MAX_LEN = Math.ceil(JWT_PAYLOAD_JSON_MAX_LEN / 3) * 4;
// Note: keep in sync with Noir
const JWT_SUB_MAX_LEN = 64;
// Note: keep in sync with Noir
const JWT_AUD_MAX_LEN = 256;
// Note: keep in sync with Solidity
const JWT_EXPIRATION_TIME = 60 * 60; // seconds

export class ZkLogin {
  constructor(readonly publicKeyRegistry = new PublicKeyRegistry()) {}

  async proveJwt(jwt: string, expectedNonce: string) {
    const input = await this.prepareJwt(jwt);

    console.log(`Prove JWT: ${input}`);

    await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

    const isValid: boolean = await this.checkJwt(input, expectedNonce);
    console.log(`Is valid JWT against expected nonce? ${expectedNonce}`);
    if (!isValid) {
      console.log(`No it's not a valid`);
      return undefined;
    } else {
      console.log(`Yes, its valid, now get noir`);
    }

    const { noir, backend } = await getNoir();
    if (noir == null || backend == null) {
      console.log(`Noir retreive failed`);
      return undefined;
    }
    console.time("generate witness");
    const { witness } = await noir.execute(input);
    console.timeEnd("generate witness");
    console.time("generate proof");
    const { proof } = await backend.generateProof(witness);
    console.timeEnd("generate proof");

    return {
      proof: Bytes.toHex(proof),
      input,
    };
  }

  async getAccountDataFromJwt(jwt: string, chainId: number) {
    const decoded = decodeJwt(jwt);
    const { accountId, salt } = await getAccountIdFromJwt(decoded);

    const checkedChainId = chainId.toString() as keyof typeof deployments;
    assert(
      checkedChainId in deployments,
      `deployments for ${checkedChainId} not found`,
    );
    const publicKeyRegistry = deployments[checkedChainId].contracts
      .PublicKeyRegistry as Hex.Hex;
    const proofVerifier = deployments[checkedChainId].contracts
      .UltraVerifier as Hex.Hex;

    const publicKey = await this.publicKeyRegistry.getPublicKeyByKid(
      decoded.header.kid,
    );

    return {
      accountId,
      authProviderId: publicKey.authProviderId,
      publicKeyRegistry,
      proofVerifier,
      salt,
    };
  }

  private async prepareJwt(jwt: string) {
    const [headerBase64Url, payloadBase64Url, signatureBase64Url] =
      splitJwt(jwt);

    const header_and_payload = toBoundedVec(
      Array.from(Bytes.fromString(`${headerBase64Url}.${payloadBase64Url}`)),
      JWT_HEADER_MAX_LEN + 1 + JWT_PAYLOAD_MAX_LEN,
    );
    const payload_json = utils.arrayPadEnd(
      Array.from(Base64.toBytes(payloadBase64Url)),
      JWT_PAYLOAD_JSON_MAX_LEN,
      " ".charCodeAt(0),
    );
    const showDebug = false;
    if (showDebug) {
      console.log(
        `
      global header_base64url: [u8; ${headerBase64Url.length}] = ${JSON.stringify(headerBase64Url)}.as_bytes();
      global payload_base64url: [u8; ${payloadBase64Url.length}] = ${JSON.stringify(payloadBase64Url)}.as_bytes();
      global payload_json_padded = ${JSON.stringify(Bytes.toString(Uint8Array.from(payload_json)))}.as_bytes();`,
      );
    }
    const sigHex = Base64.toHex(signatureBase64Url);
    const signature_limbs = bnToLimbStrArray(sigHex, Hex.size(sigHex) * 8);
    const jwtDecoded = decodeJwt(jwt);
    const publicKey = await this.publicKeyRegistry.getPublicKeyByKid(
      jwtDecoded.header.kid,
    );
    const { accountId: account_id, salt } =
      await getAccountIdFromJwt(jwtDecoded);
    const jwt_iat = jwtDecoded.payload.iat;
    const jwt_nonce = toNoirNonce(jwtDecoded.payload.nonce);
    const input = {
      header_and_payload,
      payload_json,
      signature_limbs,
      account_id,
      salt,
      jwt_iat,
      jwt_nonce,
      public_key_limbs: publicKey.limbs.public_key_limbs,
      public_key_redc_limbs: publicKey.limbs.public_key_redc_limbs,
      public_key_hash: publicKey.hash,
    };
    if (showDebug) {
      console.log(input);
      console.log("public key", publicKey);
      console.log("jwt", jwtDecoded, jwt);
    }
    return input;
  }

  async checkJwt(
    jwt: Awaited<ReturnType<typeof this.prepareJwt>> | string,
    expectedNonce: string,
  ): Promise<boolean> {
    jwt = typeof jwt === "string" ? await this.prepareJwt(jwt) : jwt;
    const jwtNonceMatches = isEqual(toNoirNonce(expectedNonce), jwt.jwt_nonce);
    const expirationMargin = Math.min(
      20 * 60 /*seconds*/,
      JWT_EXPIRATION_TIME / 2,
    );
    const jwtExpired =
      jwt.jwt_iat + JWT_EXPIRATION_TIME <
      Math.floor((Date.now() - expirationMargin) / 1000);
    return jwtNonceMatches && !jwtExpired;
  }
}

const getNoir = utils.lazyValue(async () => {
  // const initNoirC = await import("@noir-lang/noirc_abi");
  // const initACVM = await import("@noir-lang/acvm_js");
  // const acvm = await import("@noir-lang/acvm_js/web/acvm_js_bg.wasm");
  // const noirc = await import("@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm");
  // await Promise.all([await fetch(acvm), await fetch(noirc)]);
  
  try {
    const noir = new Noir(circuit as any);
    const threads =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 1;
    console.log(`Using ${threads} threads, and get noir by circuit bytecode...`);
    const backend = new UltraPlonkBackend(circuit.bytecode, { threads });
    console.log(`fetched, now return the data`);
    return { noir, backend };
  } catch (e) {
    return {noir: null, backend: null}
  }
});

async function getAccountIdFromJwt(jwtDecoded: ReturnType<typeof decodeJwt>) {
  const { Fr } = await import("@aztec/bb.js");
  const salt = Fr.ZERO;
  const accountId = (
    await pedersenHash([
      ...noirPackBytes(
        utils.arrayPadEnd(
          Array.from(Bytes.fromString(jwtDecoded.payload.sub)),
          JWT_SUB_MAX_LEN,
          0,
        ),
      ),
      ...noirPackBytes(
        utils.arrayPadEnd(
          Array.from(Bytes.fromString(jwtDecoded.payload.aud)),
          JWT_AUD_MAX_LEN,
          0,
        ),
      ),
      salt,
    ])
  ).toString() as `0x${string}`;

  return { accountId, salt: salt.toString() as `0x${string}` };
}

function toNoirNonce(nonce: string) {
  return Array.from(Bytes.fromString(nonce));
}
