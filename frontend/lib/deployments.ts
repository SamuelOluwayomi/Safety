import type { Address } from "viem";

export type NetworkKey = "arbitrumSepolia" | "sepolia";

export interface DeploymentConfig {
  key: NetworkKey;
  label: string;
  chainId: 421614 | 11155111;
  safePrefix: "arbsep" | "sep";
  explorerUrl: string;
  tokenSymbol: "USDC";
  tokenDecimals: 6;
  addresses: {
    module: Address;
    safe: Address;
    usdc: Address;
  };
}

export const DEPLOYMENTS: Record<NetworkKey, DeploymentConfig> = {
  arbitrumSepolia: {
    key: "arbitrumSepolia",
    label: "Arbitrum Sepolia",
    chainId: 421614,
    safePrefix: "arbsep",
    explorerUrl: "https://sepolia.arbiscan.io",
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    addresses: {
      module: "0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4",
      safe: "0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0",
      usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    },
  },
  sepolia: {
    key: "sepolia",
    label: "Ethereum Sepolia",
    chainId: 11155111,
    safePrefix: "sep",
    explorerUrl: "https://sepolia.etherscan.io",
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    addresses: {
      module: "0xDA61800A39739E1E32860dB58ecA7764bd5209eB",
      safe: "0x81A397a3654e461A043B1DCf3591689873Be2a8C",
      usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    },
  },
};

export const NETWORK_OPTIONS = [
  DEPLOYMENTS.arbitrumSepolia,
  DEPLOYMENTS.sepolia,
] as const;

export const DEFAULT_NETWORK_KEY: NetworkKey =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID) === DEPLOYMENTS.sepolia.chainId
    ? "sepolia"
    : "arbitrumSepolia";

export function getDeployment(key: NetworkKey): DeploymentConfig {
  return DEPLOYMENTS[key];
}
