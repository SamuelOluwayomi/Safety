"use client";

import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import type { Address } from "viem";
import { SAFE_ABI, MODULE_ABI, ERC20_ABI } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";
import type { SafeContext } from "@/lib/safe/types";

export function useSafeData(
  safeAddress: Address | null,
  deployment: DeploymentConfig,
) {
  const enabled = !!safeAddress;
  const { addresses, chainId } = deployment;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: safeAddress
      ? [
          // 0: Safe threshold
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "getThreshold",
            chainId,
          },
          // 1: Safe owners
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "getOwners",
            chainId,
          },
          // 2: Module enabled
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "isModuleEnabled",
            args: [addresses.module],
            chainId,
          },
          // 3: USDC balance of the MODULE (the treasury)
          {
            address: addresses.usdc,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [addresses.module],
            chainId,
          },
          // 4: nextRequestId from module
          {
            address: addresses.module,
            abi: MODULE_ABI,
            functionName: "nextRequestId",
            chainId,
          },
        ]
      : [],
    query: { enabled, staleTime: 15_000 },
  });

  if (!safeAddress || !data) {
    return { safe: null, isLoading, refetch };
  }

  const [thresholdRes, ownersRes, moduleEnabledRes, usdcBalanceRes, _nextIdRes] = data;

  const threshold = (thresholdRes?.result as bigint | undefined) ?? 1n;
  const owners = (ownersRes?.result as Address[] | undefined) ?? [];
  const moduleEnabled = (moduleEnabledRes?.result as boolean | undefined) ?? false;
  const usdcRaw = (usdcBalanceRes?.result as bigint | undefined) ?? 0n;

  const safe: SafeContext = {
    address: safeAddress,
    name: deployment.label,
    threshold: Number(threshold),
    signerCount: owners.length > 0 ? owners.length : 1,
    moduleEnabled: moduleEnabledRes?.status === "success" ? moduleEnabled : true,
    moduleAddress: addresses.module,
    wrappedBalanceLabel: "[ENCRYPTED]",
    publicBalanceLabel: `${formatUnits(usdcRaw, deployment.tokenDecimals)} ${deployment.tokenSymbol}`,
  };

  return { safe, owners, isLoading, refetch };
}
