"use client";

import { useState, useEffect } from "react";
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import type { Address } from "viem";
import { SAFE_ABI, MODULE_ABI, ERC20_ABI } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";
import type { SafeContext } from "@/lib/safe/types";
import { getCachedModule, setCachedModule } from "@/lib/utils/module-cache";

export function useSafeData(
  safeAddress: Address | null,
  deployment: DeploymentConfig,
) {
  const enabled = !!safeAddress;
  const { addresses, chainId } = deployment;
  const [customModuleAddress, setCustomModuleAddress] = useState<Address | null>(null);

  // Auto-resolve or deploy standalone module for custom Safes.
  // Resolution order:
  //   1. localStorage (survives hot-reloads & page refreshes)
  //   2. Server API (deploys a fresh module the very first time)
  useEffect(() => {
    if (!safeAddress || safeAddress.toLowerCase() === addresses.safe.toLowerCase()) {
      setCustomModuleAddress(null);
      return;
    }

    // 1. Check localStorage first — fastest path, no network needed
    const cached = getCachedModule(deployment.key, safeAddress);
    if (cached) {
      setCustomModuleAddress(cached as Address);
      return;
    }

    // 2. Call server API (will deploy + initialize if truly first time)
    let isMounted = true;
    fetch("/api/safe/deploy-module", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ safeAddress, networkKey: deployment.key }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.moduleAddress) {
          setCachedModule(deployment.key, safeAddress, data.moduleAddress);
          setCustomModuleAddress(data.moduleAddress as Address);
        }
      })
      .catch((err) => console.warn("[useSafeData] Custom module resolution error", err));

    return () => {
      isMounted = false;
    };
  }, [safeAddress, deployment, addresses.safe]);

  const activeModule = customModuleAddress ?? addresses.module;

  const { data, isLoading, refetch, dataUpdatedAt } = useReadContracts({
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
          // 2: Module enabled check on activeModule
          {
            address: safeAddress,
            abi: SAFE_ABI,
            functionName: "isModuleEnabled",
            args: [activeModule],
            chainId,
          },
          // 3: USDC balance of the activeModule (treasury vault)
          {
            address: addresses.usdc,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [activeModule],
            chainId,
          },
          // 4: USDC balance of the SAFE WALLET (unwrapped public balance)
          {
            address: addresses.usdc,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [safeAddress],
            chainId,
          },
          // 5: nextRequestId from activeModule
          {
            address: activeModule,
            abi: MODULE_ABI,
            functionName: "nextRequestId",
            chainId,
          },
        ]
      : [],
    // Auto-refresh every 15 s (≈1 Sepolia block). Background polling paused
    // when the tab is hidden to save RPC credits.
    query: { enabled, staleTime: 0, refetchInterval: 15_000, refetchIntervalInBackground: false },
  });

  if (!safeAddress || !data) {
    return { safe: null, isLoading, refetch, dataUpdatedAt };
  }

  const [thresholdRes, ownersRes, moduleEnabledRes, moduleUsdcRes, safeUsdcRes, _nextIdRes] = data;

  const threshold = (thresholdRes?.result as bigint | undefined) ?? 1n;
  const owners = (ownersRes?.result as Address[] | undefined) ?? [];
  const moduleEnabled = (moduleEnabledRes?.result as boolean | undefined) ?? true;
  const moduleUsdcRaw = (moduleUsdcRes?.result as bigint | undefined) ?? 0n;
  const safeUsdcRaw = (safeUsdcRes?.result as bigint | undefined) ?? 0n;

  const safe: SafeContext = {
    address: safeAddress,
    name: deployment.label,
    threshold: Number(threshold),
    signerCount: owners.length > 0 ? owners.length : 1,
    moduleEnabled,
    moduleAddress: activeModule,
    wrappedBalanceLabel: "[ENCRYPTED]",
    publicBalanceLabel: `${formatUnits(safeUsdcRaw, deployment.tokenDecimals)} ${deployment.tokenSymbol}`,
    moduleBalanceLabel: `${formatUnits(moduleUsdcRaw, deployment.tokenDecimals)} ${deployment.tokenSymbol}`,
  };

  return { safe, owners, isLoading, refetch, dataUpdatedAt };
}
