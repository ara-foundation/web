import { lib } from "@scripts/shieldlabs/libs";
import { ethers } from "ethers";
import { assert } from "ts-essentials";
import type { Address } from "viem";
import { ethersSignerToWalletClient, getBundlerClient } from "@scripts/shieldlabs/libs/viemClients";
import { useEffect, useState } from "react";

export const SendEthModalId = "send-eth-modal";

interface Props {
  jwt?: string;
  signer?: ethers.Wallet;
}

function formatEther(balance: bigint): string {
  return `${ethers.formatEther(balance)} ETH`;
}

function SendEthModal({jwt, signer}: Props) {
  const [balance, setBalance] = useState<bigint>(0n);
  const [balanceFetched, setBalanceFetched] = useState<boolean>(false);

  const [recipient, setRecipient] = useState<Address | null>(null);
  const [amount, setAmount] = useState<bigint>(0n);

  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (signer === undefined) {
      return;
    }
    if (!jwt) {
      setBalance(0n);
    } else {
      fetchBalance();
    }
  }, [jwt, signer])

  const fetchBalance = async() => {
    if (signer === undefined) {
      return;
    }
    const account = await lib.jwtAccount.getAccount(jwt!, signer);
    const raw = await signer.provider!.getBalance(account.address);
    setBalance(raw);
    setBalanceFetched(true);
  }

  const onRecipientChange = (addr: string) => {
    try {
      setRecipient(addr as Address);
    } catch(e) {
      setRecipient(`0x00`);
    }
  };

  const onAmountChange = (value: string) => {
    try {
      setAmount(BigInt(value));
    } catch (e) {
      setAmount(0n);
    }
  }

  const onSubmit = async () => {
    assert(jwt, "no session");
    if (recipient == null) {
      return;
    }
    if (amount == 0n) {
      return;
    }
    if (signer === undefined) {
      return;
    }

    setSubmitted(true);

    try {
      const bundlerClient = getBundlerClient(
        await ethersSignerToWalletClient(signer),
      );
      const account = await lib.jwtAccount.getAccount(jwt, signer);
      const tx = await bundlerClient.sendUserOperation({
        account,
        calls: [
          {
            to: recipient,
            value: ethers.parseEther(amount.toString()),
          },
        ],
      });
      console.log(tx);
    } finally {
      setSubmitted(false);
    }
  }

  return (
    <dialog id={SendEthModalId} className="modal">
    <div className="modal-box">
      <h3 className="font-bold text-lg">Send ETH!</h3>
      <p className="pb-4 text-gray-400">
        Balance: {!balanceFetched ? "fetching..." : formatEther(balance)}
      </p>
            <div className="py-4 text-gray-600 ">
              <label className="input w-full mb-2">
                Recipient
                <input type="text" className="grow" placeholder="0x..." value={recipient == null ? '' : recipient} onChange={(e) => onRecipientChange(e.target.value)} />
              </label>
              <label className="input w-full mb-2">
                Amount
                <input type="number" className="grow" placeholder="0.01" value={amount.toString()} onChange={(e) => onAmountChange(e.target.value)} />
              </label>
            </div>
            <div className="py-2 flex justify-center">
              <button className="btn btn-primary" onClick={onSubmit} disabled={submitted}>{submitted ? "Waiting..." : "Send"}</button>
            </div>
            <div className="modal-action">
            <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn">Close</button>
            </form>
            </div>
        </div>
        </dialog>
    )
}

export default SendEthModal;