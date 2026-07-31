"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { MODULE_ABI } from "@/lib/contracts";
import type { DeploymentConfig } from "@/lib/deployments";

export interface OnChainPayout {
  requestId: number;
  recipient: `0x${string}`;
  amountHandle: `0x${string}`;
  debitSuccessHandle: `0x${string}`;
  finalized: boolean;
  // Populated only if decrypted
  decryptedAmount: string | null;
}

export function usePayouts(deployment: DeploymentConfig) {
  // 1. Get the total number of requests
  const { data: nextId, refetch: refetchCount } = useReadContract({
    address: deployment.addresses.module,
    abi: MODULE_ABI,
    functionName: "nextRequestId",
    chainId: deployment.chainId,
    query: { staleTime: 10_000 },
  });

  const count = Number(nextId ?? 0n);

  // 2. Read all pendingPayouts in one multicall
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: deployment.addresses.module,
    abi: MODULE_ABI,
    functionName: "pendingPayouts" as const,
    args: [BigInt(i)] as [bigint],
    chainId: deployment.chainId,
  }));

  const { data: rows, isLoading, refetch: refetchRows } = useReadContracts({
    contracts,
    query: { enabled: count > 0, staleTime: 10_000 },
  });

  const payouts: OnChainPayout[] = (rows ?? []).map((row, i) => {
    const [recipient, amount, debitSuccess, finalized] = (row.result ?? []) as [
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      boolean,
    ];
    return {
      requestId: i,
      recipient: recipient ?? "0x",
      amountHandle: amount ?? "0x",
      debitSuccessHandle: debitSuccess ?? "0x",
      finalized: finalized ?? false,
      decryptedAmount: null,
    };
  });

  function refetch() {
    refetchCount();
    refetchRows();
  }

  return { payouts, count, isLoading, refetch };
}

/** Convert a raw amount handle (bytes32) to a display string. */
export function fmtAmount(rawAmount: string | null, decimals = 6): string {
  if (!rawAmount) return "REDACTED";
  try {
    return `${formatUnits(BigInt(rawAmount), decimals)} USDC`;
  } catch {
    return "REDACTED";
  }
}
