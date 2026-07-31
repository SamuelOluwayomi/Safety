"use client";

import { useState, useCallback } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { getWalletClient, switchChain } from "@wagmi/core";
import { encodeFunctionData, type Address, type Hex } from "viem";
import { toast } from "sonner";
import type { NetworkKey } from "@/lib/deployments";
import { DEPLOYMENTS } from "@/lib/deployments";
import { wagmiConfig, supportedChains } from "@/lib/wagmi/config";

// ── Safe factory & singleton addresses (same across all EVM networks) ────────
// SafeProxyFactory 1.4.1
const SAFE_PROXY_FACTORY = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67" as Address;
// Safe singleton 1.4.1
const SAFE_SINGLETON = "0x41675C099F32341bf84BFc5382aF534df5C7461a" as Address;
// CompatibilityFallbackHandler
const FALLBACK_HANDLER = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99" as Address;

// ── Minimal ABIs we need directly ───────────────────────────────────────────
const PROXY_FACTORY_ABI = [
  {
    name: "createProxyWithNonce",
    type: "function" as const,
    stateMutability: "nonpayable",
    inputs: [
      { name: "_singleton", type: "address" },
      { name: "initializer", type: "bytes" },
      { name: "saltNonce", type: "uint256" },
    ],
    outputs: [{ name: "proxy", type: "address" }],
  },
] as const;

const SAFE_SETUP_ABI = [
  {
    name: "setup",
    type: "function" as const,
    stateMutability: "nonpayable",
    inputs: [
      { name: "_owners", type: "address[]" },
      { name: "_threshold", type: "uint256" },
      { name: "to", type: "address" },
      { name: "data", type: "bytes" },
      { name: "fallbackHandler", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "payment", type: "uint256" },
      { name: "paymentReceiver", type: "address" },
    ],
    outputs: [],
  },
] as const;

// enableModule(address) on an already-deployed Safe
const SAFE_MODULE_ABI = [
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
  {
    name: "isModuleEnabled",
    type: "function" as const,
    stateMutability: "view",
    inputs: [{ name: "module", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export type DeployStep =
  | "idle"
  | "deploying"
  | "waiting-deploy"
  | "enabling-module"
  | "success"
  | "error";

export interface DeploySafeResult {
  safeAddress: Address | null;
  step: DeployStep;
  isLoading: boolean;
  txHash: Hex | null;
  deploy: (params: {
    ownerAddress: Address;
    additionalOwners?: Address[];
    threshold?: number;
    networkKey: NetworkKey;
  }) => Promise<Address | null>;
  reset: () => void;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/** Builds the prevalidated signature bytes for a 1/N Safe where
 *  `signerAddress` is the sole signing owner calling execTransaction. */
function buildPrevalidatedSig(signerAddress: Address): Hex {
  return `0x000000000000000000000000${signerAddress
    .slice(2)
    .toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001` as Hex;
}

export function useDeploySafe(): DeploySafeResult {
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();

  const [step, setStep] = useState<DeployStep>("idle");
  const [safeAddress, setSafeAddress] = useState<Address | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  const reset = useCallback(() => {
    setStep("idle");
    setSafeAddress(null);
    setTxHash(null);
  }, []);

  const deploy = useCallback(
    async ({
      ownerAddress,
      additionalOwners = [],
      threshold = 1,
      networkKey,
    }: {
      ownerAddress: Address;
      additionalOwners?: Address[];
      threshold?: number;
      networkKey: NetworkKey;
    }): Promise<Address | null> => {
      if (!isConnected || !publicClient) {
        toast.error("Wallet not connected. Please connect your wallet first.");
        return null;
      }

      const deployment = DEPLOYMENTS[networkKey];
      const moduleAddress = deployment.addresses.module;

      // Resolve the viem chain object for explicit chain arg on writeContract
      const chain = supportedChains.find((c) => c.id === deployment.chainId);
      if (!chain) {
        toast.error(`Unsupported chain id: ${deployment.chainId}`);
        return null;
      }

      // Fetch active wallet client
      let walletClient = await getWalletClient(wagmiConfig as any).catch((err) => {
        console.error("[getWalletClient error]", err);
        return null;
      });

      if (!walletClient) {
        toast.error("Could not reach wallet. Please make sure your wallet extension (e.g. MetaMask) is unlocked and connected.");
        return null;
      }

      // Check if wallet is on target network; switch if needed
      if (walletClient.chain?.id !== deployment.chainId) {
        try {
          toast.loading(`Switching wallet to ${deployment.label}…`, { id: "switch-chain" });
          await switchChain(wagmiConfig as any, { chainId: deployment.chainId });
          toast.success(`Switched to ${deployment.label}`, { id: "switch-chain" });

          // Refetch walletClient after chain switch
          const refetched = await getWalletClient(wagmiConfig as any).catch(() => null);
          if (refetched) walletClient = refetched;
        } catch (switchErr: any) {
          console.error("[switchChain error]", switchErr);
          toast.error(`Please switch your wallet network to ${deployment.label}`, { id: "switch-chain" });
          return null;
        }
      }

      // Deduplicate and sort owners (Safe requires sorted owner list)
      const allOwners = [ownerAddress, ...additionalOwners]
        .map((a) => a.toLowerCase() as Address)
        .filter((a, i, arr) => arr.indexOf(a) === i)
        .sort() as Address[];

      const clampedThreshold = Math.max(
        1,
        Math.min(threshold, allOwners.length),
      );

      // ── STEP 1: Build setup() calldata ─────────────────────────────
      const setupData = encodeFunctionData({
        abi: SAFE_SETUP_ABI,
        functionName: "setup",
        args: [
          allOwners,
          BigInt(clampedThreshold),
          ZERO_ADDRESS, // no delegate call on setup
          "0x",         // no delegate call data
          FALLBACK_HANDLER,
          ZERO_ADDRESS, // no payment token
          0n,
          ZERO_ADDRESS, // no payment receiver
        ],
      });

      // ── STEP 2: Deploy SafeProxy via ProxyFactory ──────────────────
      setStep("deploying");
      try {
        const saltNonce = BigInt(Date.now());

        toast.loading("Deploying Safe proxy contract…", { id: "safe-deploy" });

        const deployHash = await walletClient.writeContract({
          address: SAFE_PROXY_FACTORY,
          abi: PROXY_FACTORY_ABI,
          functionName: "createProxyWithNonce",
          args: [SAFE_SINGLETON, setupData, saltNonce],
          chain,
          account: walletClient.account,
        });

        setTxHash(deployHash);
        setStep("waiting-deploy");
        toast.loading("Waiting for deployment confirmation…", { id: "safe-deploy" });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: deployHash,
        });

        // ── STEP 3: Extract deployed Safe address from logs ──────────
        // ProxyCreation event: 0x4f51fbe0 topic, address in topic[1]
        const proxyCreationTopic =
          "0x4f51fbe0f23d807cd0c70e28c60c2c5a03b5dbd6f61fb7e7fc46baf40c0e9c90";

        let deployedSafe: Address | null = null;

        for (const log of receipt.logs) {
          if (
            log.topics[0]?.toLowerCase() === proxyCreationTopic.toLowerCase() &&
            log.topics[1]
          ) {
            deployedSafe = `0x${log.topics[1].slice(26)}` as Address;
            break;
          }
        }

        // Fallback 1: contractAddress from receipt
        if (!deployedSafe && receipt.contractAddress) {
          deployedSafe = receipt.contractAddress;
        }

        // Fallback 2: Any log emitted by the new Safe contract during setup()
        if (!deployedSafe) {
          const innerLog = receipt.logs.find(
            (l) => l.address.toLowerCase() !== SAFE_PROXY_FACTORY.toLowerCase(),
          );
          if (innerLog) {
            deployedSafe = innerLog.address as Address;
          }
        }

        // Second fallback: compute deterministic address
        if (!deployedSafe) {
          // If we can't find it in logs, we abort gracefully
          toast.error("Could not determine deployed Safe address from receipt", { id: "safe-deploy" });
          setStep("error");
          return null;
        }

        setSafeAddress(deployedSafe);
        toast.success(`Safe deployed at ${deployedSafe.slice(0, 10)}…`, { id: "safe-deploy" });

        // ── STEP 4: Enable the ConfidentialPayoutModule ──────────────
        setStep("enabling-module");
        toast.loading("Enabling ConfidentialPayoutModule on new Safe…", {
          id: "safe-enable",
        });

        // Build enableModule(moduleAddress) calldata
        const enableModuleData = encodeFunctionData({
          abi: SAFE_MODULE_ABI,
          functionName: "enableModule",
          args: [moduleAddress],
        });

        // Get Safe nonce
        const safeNonce = await publicClient.readContract({
          address: deployedSafe,
          abi: SAFE_MODULE_ABI,
          functionName: "nonce",
        }) as bigint;

        // Get tx hash from Safe
        const safeTxHash = await publicClient.readContract({
          address: deployedSafe,
          abi: SAFE_MODULE_ABI,
          functionName: "getTransactionHash",
          args: [
            deployedSafe,  // to: the Safe itself
            0n,            // value: 0 ETH
            enableModuleData,
            0,             // operation: Call
            0n,            // safeTxGas: 0
            0n,            // baseGas: 0
            0n,            // gasPrice: 0
            ZERO_ADDRESS,  // gasToken: 0
            ZERO_ADDRESS,  // refundReceiver: 0
            safeNonce,
          ],
        }) as Hex;

        // Build prevalidated signature for Safe owner (v=1, r=ownerAddress, s=0)
        // Since msg.sender == ownerAddress, Gnosis Safe validates this instantly on-chain
        const sig = buildPrevalidatedSig(ownerAddress);

        // execTransaction to enable the module
        const enableHash = await walletClient.writeContract({
          address: deployedSafe,
          abi: SAFE_MODULE_ABI,
          functionName: "execTransaction",
          args: [
            deployedSafe,
            0n,
            enableModuleData,
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

        await publicClient.waitForTransactionReceipt({ hash: enableHash });

        toast.success("Module enabled! Your Safe is ready.", { id: "safe-enable" });
        setStep("success");
        return deployedSafe;
      } catch (err: any) {
        console.error("[useDeploySafe]", err);
        const msg = err?.shortMessage ?? err?.message ?? "Transaction failed";
        toast.error(msg, { id: "safe-deploy" });
        toast.dismiss("safe-enable");
        setStep("error");
        return null;
      }
    },
    [isConnected, publicClient],
  );

  return {
    safeAddress,
    step,
    isLoading: step === "deploying" || step === "waiting-deploy" || step === "enabling-module",
    txHash,
    deploy,
    reset,
  };
}
