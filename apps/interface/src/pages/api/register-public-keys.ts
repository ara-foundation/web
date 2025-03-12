export const prerender = false;
import type { APIRoute } from 'astro';
import "@scripts/shieldlabs/libs/polyfills.js";

import { lib } from "@scripts/shieldlabs/libs";
import { ChainIdSchema } from "@scripts/shieldlabs/libs/chain";
import deployments from "@shield-labs/zklogin-contracts/deployments.json";
import { PublicKeyRegistry__factory } from "@shield-labs/zklogin-contracts/typechain-types";
import { config } from "dotenv";
import { compact } from "lodash-es";
import {
  createWalletClient,
  getContract,
  http,
  isAddressEqual,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

export const GET: APIRoute = async({request}) => {
    return new Response(JSON.stringify({
        path: new URL(request.url).pathname
      })
    )
}

export const POST: APIRoute = async ({ request }) => {
  config();

  const body = z
    .object({
      chainId: ChainIdSchema,
    })
    .parse(await request.json());

    console.log(process.env.REGISTRY_OWNER_PRIVATE_KEY!);
  const privateKey = process.env.REGISTRY_OWNER_PRIVATE_KEY! as Hex;
  if (!privateKey) {
    return new Response(
        JSON.stringify({message: "misconfigured: signer"}), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
    );
  }

  const chain = lib.chain.chainById(body.chainId);
  const owner = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    chain,
    transport: http(),
    account: owner,
  });

  const publicKeyRegistry = getContract({
    address: deployments[chain.id].contracts.PublicKeyRegistry as Address,
    abi: PublicKeyRegistry__factory.abi,
    client,
  });

  if (!isAddressEqual(await publicKeyRegistry.read.owner(), owner.address)) {
    return new Response(
        JSON.stringify({message: "misconfigured: owner"}), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
    );
  }

  const publicKeys = await lib.zkLogin.publicKeyRegistry.getPublicKeys();
  const pendingPublicKeys = compact(
    await Promise.all(
      publicKeys.map(async (publicKey) => {
        const isValid = await publicKeyRegistry.read.isPublicKeyHashValid([
          publicKey.authProviderId,
          publicKey.hash,
        ]);
        if (isValid) {
          return undefined;
        }
        return publicKey;
      }),
    ),
  );
  if (pendingPublicKeys.length === 0) {
    return Response.json({ hash: null });
  }
  console.log(`updating ${pendingPublicKeys.length} public keys`);
  try {
    const hash = await publicKeyRegistry.write.setPublicKeysValid([
      pendingPublicKeys.map((publicKey) => ({
        providerId: publicKey.authProviderId,
        publicKeyHash: publicKey.hash,
        valid: true,
      })),
    ]);
    return new Response(
        JSON.stringify({hash: hash}), {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(
        JSON.stringify({message: "Failed to send transaction"}), {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
    );
  }
}
