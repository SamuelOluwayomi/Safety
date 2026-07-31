"use client";

import { useState, useCallback } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { getWalletClient, switchChain } from "@wagmi/core";
import { encodeFunctionData, type Address, type Hex } from "viem";
import { toast } from "sonner";
import type { DeploymentConfig } from "@/lib/deployments";
import { wagmiConfig, supportedChains } from "@/lib/wagmi/config";
import { buildPrevalidatedSig } from "@/lib/contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const SAFE_ABI = [
  {
    name: "enableModule",
    type: "function" as const,
    stateMutability: "nonpayable",
    inputs: [{ name: "module", type: "address" }],
    outputs: [],
  },
  {
    name: "execTransaction",
    type: "function" as const,
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "signatures", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "getTransactionHash",
    type: "function" as const,
    stateMutability: "view",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "nonce",
    type: "function" as const,
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useEnableModule(deployment: DeploymentConfig) {
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const enableModule = useCallback(
    async (safeAddress: Address): Promise<boolean> => {
      if (!isConnected || !publicClient) {
        toast.error("Wallet not connected");
        return false;
      }

      // Resolve the viem chain object for explicit chain arg
      const chain = supportedChains.find((c) => c.id === deployment.chainId);
      if (!chain) {
        toast.error(`Unsupported chain id: ${deployment.chainId}`);
        return false;
      }

      let walletClient = await getWalletClient(wagmiConfig as any).catch((err) => {
        console.error("[getWalletClient error]", err);
        return null;
      });

      if (!walletClient) {
        toast.error("Could not reach wallet. Please make sure your wallet is connected.");
        return false;
      }

      if (walletClient.chain?.id !== deployment.chainId) {
        try {
          toast.loading(`Switching wallet to ${deployment.label}…`, { id: "switch-chain" });
          await switchChain(wagmiConfig as any, { chainId: deployment.chainId });
          toast.success(`Switched to ${deployment.label}`, { id: "switch-chain" });

          const refetched = await getWalletClient(wagmiConfig as any).catch(() => null);
          if (refetched) walletClient = refetched;
        } catch (switchErr: any) {
          console.error("[switchChain error]", switchErr);
          toast.error(`Please switch your wallet network to ${deployment.label}`, { id: "switch-chain" });
          return false;
        }
      }

      setIsLoading(true);
      try {
        const moduleAddress = deployment.addresses.module as Address;

        // Build enableModule(moduleAddress) calldata
        const enableData = encodeFunctionData({
          abi: SAFE_ABI,
          functionName: "enableModule",
          args: [moduleAddress],
        });

        toast.loading("Reading Safe nonce…", { id: "enable-module" });

        // Read Safe nonce
        const safeNonce = await publicClient.readContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: "nonce",
        }) as bigint;

        // Get the Safe tx hash to sign
        const safeTxHash = await publicClient.readContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: "getTransactionHash",
          args: [
            safeAddress,   // to: Safe itself (self-call to enableModule)
            0n,
            enableData,
            0,             // Call
            0n,
            0n,
            0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            safeNonce,
          ],
        }) as Hex;

        // Build prevalidated signature for Safe owner
        const sig = buildPrevalidatedSig(walletClient.account.address);

        toast.loading("Submitting enableModule transaction…", { id: "enable-module" });

        const txHash = await walletClient.writeContract({
          address: safeAddress,
          abi: SAFE_ABI,
          functionName: "execTransaction",
          args: [
            safeAddress,
            0n,
            enableData,
            0,
            0n,
            0n,
            0n,
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            sig,
          ],
          chain,
          account: walletClient.account,
        });

        toast.loading("Confirming…", { id: "enable-module" });
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        toast.success("Module enabled! Refreshing Safe data…", { id: "enable-module" });
        return true;
      } catch (err: any) {
        console.error("[useEnableModule]", err);
        const msg = err?.shortMessage ?? err?.message ?? "Transaction failed";
        toast.error(msg, { id: "enable-module" });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, publicClient, deployment],
  );

  return { enableModule, isLoading };
}
