"use client";

import { useState, useCallback } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { getWalletClient, switchChain } from "@wagmi/core";
import { encodeFunctionData, parseUnits, type Address, type Hex } from "viem";
import { toast } from "sonner";

import type { DeploymentConfig } from "@/lib/deployments";
import { wagmiConfig, supportedChains } from "@/lib/wagmi/config";
import { SAFE_ABI, MODULE_ABI, ERC20_ABI, ZERO_ADDRESS, buildPrevalidatedSig } from "@/lib/contracts";
import { getCachedModule, setCachedModule } from "@/lib/utils/module-cache";

export function useDepositToTreasury(deployment: DeploymentConfig) {
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const deposit = useCallback(
    async (safeAddress: Address, amountString: string): Promise<boolean> => {
      if (!isConnected || !publicClient) {
        toast.error("Wallet not connected");
        return false;
      }

      const amountUnits = parseUnits(amountString.trim(), deployment.tokenDecimals);
      if (amountUnits <= 0n) {
        toast.error("Amount must be greater than 0");
        return false;
      }

      // Resolve chain object
      const chain = supportedChains.find((c) => c.id === deployment.chainId);
      if (!chain) {
        toast.error(`Unsupported chain id: ${deployment.chainId}`);
        return false;
      }

      // Fetch wallet client and check chain
      let walletClient = await getWalletClient(wagmiConfig as any).catch(() => null);
      if (!walletClient) {
        toast.error("Could not reach wallet");
        return false;
      }

      if (walletClient.chain?.id !== deployment.chainId) {
        try {
          toast.loading(`Switching wallet to ${deployment.label}…`, { id: "deposit-tx" });
          await switchChain(wagmiConfig as any, { chainId: deployment.chainId });
          const refetched = await getWalletClient(wagmiConfig as any).catch(() => null);
          if (refetched) walletClient = refetched;
        } catch {
          toast.error(`Please switch wallet to ${deployment.label}`, { id: "deposit-tx" });
          return false;
        }
      }

      setIsLoading(true);
      const usdcAddress = deployment.addresses.usdc;
      let moduleAddress = deployment.addresses.module;

      try {
        const sig = buildPrevalidatedSig(walletClient.account.address);

        // ── Resolve module address for custom Safes ─────────────────────
        if (safeAddress.toLowerCase() !== deployment.addresses.safe.toLowerCase()) {
          // 1. Check localStorage first (fastest, survives hot-reloads)
          const cached = getCachedModule(deployment.key, safeAddress);
          if (cached) {
            moduleAddress = cached as Address;
          } else {
            // 2. Ask the server to deploy/initialize if truly first time
            try {
              toast.loading("Deploying Confidential Module for your Safe…", { id: "deposit-tx" });
              const res = await fetch("/api/safe/deploy-module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ safeAddress, networkKey: deployment.key }),
              });
              const resData = await res.json();
              if (resData.error) {
                toast.error(`Module deployment failed: ${resData.error}`, { id: "deposit-tx" });
                return false;
              }
              if (resData.moduleAddress) {
                // Persist so every other hook finds the same address
                setCachedModule(deployment.key, safeAddress, resData.moduleAddress);
                moduleAddress = resData.moduleAddress as Address;
              }
            } catch (apiErr) {
              console.warn("[useDepositToTreasury] Module deployment API error", apiErr);
            }
          }

          // Check if module is enabled on custom Safe
          const isEnabled = (await publicClient.readContract({
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "isModuleEnabled",
            args: [moduleAddress],
          })) as boolean;

          if (!isEnabled) {
            toast.loading("Enabling Confidential Module on your Safe…", { id: "deposit-tx" });

            const enableData = encodeFunctionData({
              abi: SAFE_ABI,
              functionName: "enableModule",
              args: [moduleAddress],
            });

            const enableTx = await walletClient.writeContract({
              address: safeAddress,
              abi: SAFE_ABI,
              functionName: "execTransaction",
              args: [
                safeAddress, // to: Safe itself
                0n,
                enableData,
                0,
                0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS,
                sig,
              ],
              chain,
              account: walletClient.account,
              gas: 250_000n,
            });

            await publicClient.waitForTransactionReceipt({ hash: enableTx });
          }
        }

        // Check existing allowance of Safe -> Module
        const currentAllowance = (await publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [safeAddress, moduleAddress],
        })) as bigint;

        // ── STEP 1: Approve module on USDC if current allowance is insufficient ───
        if (currentAllowance < amountUnits) {
          toast.loading("Approving USDC for Confidential Payout Module…", { id: "deposit-tx" });

          const approveCalldata = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [moduleAddress, amountUnits],
          });

          const approveTx = await walletClient.writeContract({
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "execTransaction",
            args: [
              usdcAddress,   // to: USDC token contract
              0n,            // value: 0 ETH
              approveCalldata,
              0,             // operation: Call
              0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS,
              sig,
            ],
            chain,
            account: walletClient.account,
            gas: 250_000n,
          });

          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // ── STEP 2: Call deposit() on Module via Safe execTransaction ──
        toast.loading("Depositing USDC into Confidential Treasury Vault…", { id: "deposit-tx" });

        const depositCalldata = encodeFunctionData({
          abi: MODULE_ABI,
          functionName: "deposit",
          args: [amountUnits],
        });

        const depositTx = await walletClient.writeContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: "execTransaction",
          args: [
            moduleAddress, // to: Confidential Payout Module
            0n,            // value: 0 ETH
            depositCalldata,
            0,             // operation: Call
            0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS,
            sig,
          ],
          chain,
          account: walletClient.account,
          gas: 350_000n,
        });

        const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });

        const EXECUTION_FAILURE_TOPIC = "0x23428b18aced3eceb4ac0317d64736b38c0379967b951c07384280b4704116f9";
        const isFailure = depositReceipt.logs.some(
          (l) => l.topics[0]?.toLowerCase() === EXECUTION_FAILURE_TOPIC,
        );

        if (isFailure) {
          toast.error("Deposit call reverted on-chain inside Safe execution.", {
            id: "deposit-tx",
            duration: 8000,
          });
          return false;
        }

        toast.success(`Successfully deposited ${amountString} ${deployment.tokenSymbol} into Confidential Treasury!`, {
          id: "deposit-tx",
        });
        return true;
      } catch (err: any) {
        console.error("[useDepositToTreasury]", err);
        if (
          err?.message?.includes("tab is not active") ||
          err?.message?.includes("Requested resource not available")
        ) {
          toast.error("Browser tab lost focus during MetaMask prompt. Please keep the window focused and try again.", {
            id: "deposit-tx",
          });
        } else {
          const msg = err?.shortMessage ?? err?.message ?? "Deposit failed";
          toast.error(msg, { id: "deposit-tx" });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, publicClient, deployment],
  );

  return { deposit, isLoading };
}
