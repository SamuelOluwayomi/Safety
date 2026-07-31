import { http, createConfig } from "wagmi";
import { arbitrumSepolia, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const supportedChains = [arbitrumSepolia, sepolia] as const;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc",
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://11155111.rpc.thirdweb.com",
    ),
  },
  ssr: true,
});
