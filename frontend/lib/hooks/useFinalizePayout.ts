"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { encodeFunctionData } from "viem";
import type { Hex } from "viem";
import { toast } from "sonner";
import { SAFE_ABI, MODULE_ABI, ZERO_ADDRESS, buildPrevalidatedSig } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";
import type { OnChainPayout } from "@/lib/hooks/usePayouts";

type Step =
  | "idle"
  | "decrypting"
  | "approving"
  | "executing"
  | "success"
  | "error";

export function useFinalizePayout(deployment: DeploymentConfig) {
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: deployment.chainId });
  const { addresses } = deployment;

  const finalize = useCallback(
    async (payout: OnChainPayout) => {
      if (!walletClient?.account || !publicClient) {
        toast.error("Wallet not connected");
        return;
      }

      const { requestId, amountHandle, debitSuccessHandle } = payout;
      const signerAddress = walletClient.account.address;
      const toastId = `finalize-${requestId}`;

      try {
        if (chainId !== deployment.chainId) {
          await switchChainAsync({ chainId: deployment.chainId });
        }

        // ── Step 1: Fetch public decryption proofs from Nox ───────────
        setStep("decrypting");
        toast.loading("Fetching decryption proofs from Nox TEE…", { id: toastId });

        const decryptRes = await fetch("/api/nox/public-decrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountHandle,
            debitSuccessHandle,
            chainId: deployment.chainId,
          }),
        });

        if (!decryptRes.ok) {
          const err = await decryptRes.json().catch(() => ({ error: decryptRes.statusText }));
          throw new Error(`Nox decrypt failed: ${err.error ?? decryptRes.statusText}`);
        }

        const { amountProof, debitSuccessProof } = (await decryptRes.json()) as {
          amountProof: Hex;
          debitSuccessProof: Hex;
        };

        // ── Step 2: Encode finalizePayout calldata ────────────────────
        const calldata = encodeFunctionData({
          abi: MODULE_ABI,
          functionName: "finalizePayout",
          args: [BigInt(requestId), amountProof, debitSuccessProof],
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
        toast.loading("Approving Safe transaction hash…", { id: toastId });

        const approveHash = await walletClient.writeContract({
          address: addresses.safe,
          abi: SAFE_ABI,
          functionName: "approveHash",
          args: [safeTxHash],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // ── Step 5: execTransaction ───────────────────────────────────
        setStep("executing");
        toast.loading("Submitting finalizePayout via Safe…", { id: toastId });

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
          throw new Error("finalizePayout reverted on-chain");
        }

        setTxHash(execHash);
        setStep("success");
        toast.success(`Payout #${requestId} finalized! 🎉`, {
          id: toastId,
          description: `Tx: ${execHash.slice(0, 10)}…`,
        });
      } catch (err: unknown) {
        setStep("error");
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("Finalize failed", { id: toastId, description: msg });
        console.error("[useFinalizePayout]", err);
      }
    },
    [addresses.module, addresses.safe, chainId, deployment.chainId, publicClient, switchChainAsync, walletClient],
  );

  function reset() {
    setStep("idle");
    setTxHash(null);
  }

  return {
    finalize,
    step,
    txHash,
    isIdle: step === "idle",
    isLoading: step === "decrypting" || step === "approving" || step === "executing",
    isSuccess: step === "success",
    isError: step === "error",
    reset,
  };
}
