import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address } from "viem";

import type { DashboardTab } from "@/lib/safe/types";
import {
  DEFAULT_NETWORK_KEY,
  type NetworkKey,
} from "@/lib/deployments";

interface DashboardState {
  networkKey: NetworkKey;
  safeAddresses: Record<NetworkKey, Address | null>;
  safeAddress: Address | null;
  tab: DashboardTab;
  setNetworkKey: (networkKey: NetworkKey) => void;
  setSafeAddress: (address: Address | null) => void;
  setTab: (tab: DashboardTab) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      networkKey: DEFAULT_NETWORK_KEY,
      safeAddresses: {
        arbitrumSepolia: null,
        sepolia: null,
      },
      safeAddress: null,
      tab: "queue",
      setNetworkKey: (networkKey) =>
        set((state) => ({
          networkKey,
          safeAddress: state.safeAddresses[networkKey] ?? null,
          tab: "queue",
        })),
      setSafeAddress: (address) =>
        set((state) => {
          const updated = {
            ...state.safeAddresses,
            [state.networkKey]: address,
          };
          return {
            safeAddresses: updated,
            safeAddress: address,
          };
        }),
      setTab: (tab) => set({ tab }),
    }),
    { name: "safety-dashboard-v3" },
  ),
);
