"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import type { Address, Hex } from "viem";
import { toast } from "sonner";
import { SAFE_ABI, MODULE_ABI, ZERO_ADDRESS, buildPrevalidatedSig } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";

interface ProposePayoutArgs {
  recipient: Address;
  amountUsdc: string; // e.g. "5" or "100.50"
  memo?: string;
}

type Step =
  | "idle"
  | "encrypting"
  | "approving"
  | "executing"
  | "success"
  | "error";

export function useProposePayout(deployment: DeploymentConfig) {
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: deployment.chainId });
  const { addresses } = deployment;

  const propose = useCallback(
    async ({ recipient, amountUsdc, memo: _memo }: ProposePayoutArgs) => {
      if (!walletClient?.account || !publicClient) {
        toast.error("Wallet not connected");
        return;
      }

      const signerAddress = walletClient.account.address;
      const amountRaw = parseUnits(amountUsdc, deployment.tokenDecimals);

      try {
        if (chainId !== deployment.chainId) {
          await switchChainAsync({ chainId: deployment.chainId });
        }

        // ── Step 1: Encrypt amount via Nox API route ─────────────────
        setStep("encrypting");
        toast.loading("Encrypting amount via Nox TEE…", { id: "propose" });

        const encryptRes = await fetch("/api/nox/encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountRaw.toString(),
            owner: addresses.safe,
            appContract: addresses.module,
            chainId: deployment.chainId,
          }),
        });

        if (!encryptRes.ok) {
          const err = await encryptRes.json().catch(() => ({ error: encryptRes.statusText }));
          throw new Error(`Nox encrypt failed: ${err.error ?? encryptRes.statusText}`);
        }

        const { handle, proof } = (await encryptRes.json()) as {
          handle: Hex;
          proof: Hex;
        };

        // ── Step 2: Encode requestPayout calldata ─────────────────────
        const calldata = encodeFunctionData({
          abi: MODULE_ABI,
          functionName: "requestPayout",
          args: [recipient, handle as `0x${string}`, proof as `0x${string}`],
        });

        // ── Step 3: Get Safe nonce + tx hash ──────────────────────────
        const safeNonce = await publicClient.readContract({
          address: addresses.safe,
          abi: SAFE_ABI,
          functionName: "nonce",
        });

        const safeTxHash = await publicClient.readContract({
          address: addresses.safe,
          abi: SAFE_ABI,
          functionName: "getTransactionHash",
          args: [
            addresses.module,
            0n,
            calldata,
            0,
            0n, 0n, 0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            safeNonce,
          ],
        });

        // ── Step 4: approveHash ───────────────────────────────────────
        setStep("approving");
        toast.loading("Approving Safe transaction hash…", { id: "propose" });

        const approveHash = await walletClient.writeContract({
          address: addresses.safe,
          abi: SAFE_ABI,
          functionName: "approveHash",
          args: [safeTxHash],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // ── Step 5: execTransaction ───────────────────────────────────
        setStep("executing");
        toast.loading("Submitting Safe transaction…", { id: "propose" });

        const sig = buildPrevalidatedSig(signerAddress);

        const execCalldata = encodeFunctionData({
          abi: SAFE_ABI,
          functionName: "execTransaction",
          args: [
            addresses.module,
            0n,
            calldata,
            0,
            0n, 0n, 0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            sig,
          ],
        });

        const execHash = await walletClient.sendTransaction({
          to: addresses.safe,
          data: execCalldata,
          gas: 1_000_000n,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: execHash });

        if (receipt.status !== "success") {
          throw new Error("execTransaction reverted on-chain");
        }

        // ── Parse requestId from PayoutRequested event ────────────────
        const payoutRequestedTopic =
          "0x" +
          Buffer.from(
            "PayoutRequested(uint256,address)",
          )
            .toString("hex"); // We'll just derive the requestId from nextRequestId - 1 after success

        setTxHash(execHash);
        setRequestId(null); // will refresh from chain
        setStep("success");
        toast.success("Payout proposed!", {
          id: "propose",
          description: `Tx: ${execHash.slice(0, 10)}…`,
        });
      } catch (err: unknown) {
        setStep("error");
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("Proposal failed", { id: "propose", description: msg });
        console.error("[useProposePayout]", err);
      }
    },
    [addresses.module, addresses.safe, chainId, deployment.chainId, deployment.tokenDecimals, publicClient, switchChainAsync, walletClient],
  );

  function reset() {
    setStep("idle");
    setTxHash(null);
    setRequestId(null);
  }

  return {
    propose,
    step,
    txHash,
    requestId,
    isIdle: step === "idle",
    isLoading: step === "encrypting" || step === "approving" || step === "executing",
    isSuccess: step === "success",
    isError: step === "error",
    reset,
  };
}
