"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import type { Address, Hex } from "viem";
import { toast } from "sonner";
import { SAFE_ABI, MODULE_ABI, ZERO_ADDRESS, buildPrevalidatedSig } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";
import { getCachedModule, setCachedModule } from "@/lib/utils/module-cache";

interface ProposePayoutArgs {
  recipient: Address;
  amountUsdc: string; // e.g. "5" or "100.50"
  safeAddress?: Address;
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
    async ({ recipient, amountUsdc, safeAddress, memo: _memo }: ProposePayoutArgs) => {
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

        let moduleAddress = addresses.module;
        let targetSafe = safeAddress ?? addresses.safe;

        if (safeAddress && safeAddress.toLowerCase() !== addresses.safe.toLowerCase()) {
          // 1. Check localStorage first
          const cached = getCachedModule(deployment.key, safeAddress);
          if (cached) {
            moduleAddress = cached as Address;
          } else {
            // 2. Fall back to server API
            try {
              const res = await fetch("/api/safe/deploy-module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ safeAddress, networkKey: deployment.key }),
              });
              const resData = await res.json();
              if (resData.moduleAddress) {
                setCachedModule(deployment.key, safeAddress, resData.moduleAddress);
                moduleAddress = resData.moduleAddress as Address;
              }
            } catch (apiErr) {
              console.warn("[useProposePayout] Failed to resolve module address", apiErr);
            }
          }
        }

        // ── Step 1: Encrypt amount via Nox API route ─────────────────
        setStep("encrypting");
        toast.loading("Encrypting amount via Nox TEE…", { id: "propose" });

        const encryptRes = await fetch("/api/nox/encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountRaw.toString(),
            owner: targetSafe,
            appContract: moduleAddress,
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
          address: targetSafe,
          abi: SAFE_ABI,
          functionName: "nonce",
        });

        const safeTxHash = await publicClient.readContract({
          address: targetSafe,
          abi: SAFE_ABI,
          functionName: "getTransactionHash",
          args: [
            moduleAddress,
            0n,
            calldata,
            0,
            0n, 0n, 0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            safeNonce,
          ],
        });

        // ── Step 4: Sign on Safe (approveHash) ───────────────────────
        setStep("approving");
        toast.loading("Sign proposal in wallet (approveHash)…", { id: "propose" });

        const approveHash = await walletClient.writeContract({
          address: targetSafe,
          abi: SAFE_ABI,
          functionName: "approveHash",
          args: [safeTxHash],
          gas: 150_000n,
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // ── Step 5: Execute proposal on Safe (execTransaction) ───────
        setStep("executing");
        toast.loading("Executing payout proposal on Safe…", { id: "propose" });

        const sig = buildPrevalidatedSig(signerAddress);

        const execHash = await walletClient.writeContract({
          address: targetSafe,
          abi: SAFE_ABI,
          functionName: "execTransaction",
          args: [
            moduleAddress,
            0n,
            calldata,
            0,
            0n, 0n, 0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            sig,
          ],
          // requestPayout does ~10 Nox ops (fromExternal, safeSub, select,
          // 3×allowThis, 3×allow, 2×allowPublicDecryption) — needs >300k gas.
          gas: 600_000n,
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
