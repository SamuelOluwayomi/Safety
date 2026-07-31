import { http, fallback, createConfig } from "wagmi";
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
    [arbitrumSepolia.id]: fallback([
      http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL),
      http("https://sepolia-rollup.arbitrum.io/rpc"),
      http("https://arbitrum-sepolia-rpc.publicnode.com"),
      http("https://rpc.ankr.com/arbitrum_sepolia"),
    ]),
    [sepolia.id]: fallback([
      http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
      http("https://rpc.ankr.com/eth_sepolia"),
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      http("https://11155111.rpc.thirdweb.com"),
    ]),
  },
  ssr: true,
});
