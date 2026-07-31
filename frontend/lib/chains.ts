import { arbitrumSepolia, sepolia } from "viem/chains";
import type { NetworkKey } from "@/lib/deployments";
import { DEPLOYMENTS } from "@/lib/deployments";

export const ARBITRUM_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ??
  "https://sepolia-rollup.arbitrum.io/rpc";
export const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://11155111.rpc.thirdweb.com";

export const SUPPORTED_CHAINS = [arbitrumSepolia, sepolia] as const;
export const ACTIVE_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? arbitrumSepolia.id,
);
export const CHAIN =
  SUPPORTED_CHAINS.find((chain) => chain.id === ACTIVE_CHAIN_ID) ??
  arbitrumSepolia;

export function addressLink(address: string, networkKey: NetworkKey = "arbitrumSepolia"): string {
  return `${DEPLOYMENTS[networkKey].explorerUrl}/address/${address}`;
}

export function txLink(hash: string, networkKey: NetworkKey = "arbitrumSepolia"): string {
  return `${DEPLOYMENTS[networkKey].explorerUrl}/tx/${hash}`;
}

export function safeAppLink(
  safeAddress: string,
  networkKey: NetworkKey = "arbitrumSepolia",
): string {
  return `https://app.safe.global/home?safe=${DEPLOYMENTS[networkKey].safePrefix}:${safeAddress}`;
}
