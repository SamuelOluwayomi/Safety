"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet } from "@phosphor-icons/react";
import { toast } from "sonner";
import CopyButton from "@/components/ui/CopyButton";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-2 px-4 py-2 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-wider opacity-50 cursor-not-allowed"
      >
        <Wallet size={16} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            disconnect();
            toast.info("Wallet disconnected");
          }}
          title="Click to disconnect"
          className="flex items-center gap-2 px-4 py-2 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-wider hover:bg-accent-red transition-colors font-bold"
        >
          <Wallet size={16} />
          <span>{truncateAddress(address)}</span>
        </button>
        <CopyButton
          text={address}
          label="wallet address"
          className="p-2 border-document bg-cream text-charcoal hover:bg-paper"
        />
      </div>
    );
  }

  async function handleConnect() {
    setLoading(true);
    try {
      // Find an injected connector or fallback to first available
      const targetConnector =
        connectors.find((c) => c.id === "injected" || c.type === "injected") ??
        connectors[0];

      if (targetConnector) {
        await connectAsync({ connector: targetConnector });
        toast.success("Wallet connected!");
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        toast.success("Wallet connected!");
      } else {
        toast.error("No Web3 wallet found. Please install MetaMask.");
      }
    } catch (err: any) {
      console.error("[ConnectWallet]", err);
      if (
        err?.name === "ConnectorAlreadyConnectedError" ||
        err?.message?.includes("already connected") ||
        err?.code === 4200 ||
        err?.message?.includes("HTTP Status code")
      ) {
        toast.success("Wallet connected!");
      } else if (err?.code === -32002 || err?.message?.includes("already pending")) {
        toast.warning("Connection request already pending! Please open your MetaMask / wallet extension popup to approve.", {
          duration: 6000,
        });
      } else if (err?.code === 4001 || err?.message?.includes("rejected")) {
        toast.error("Wallet connection rejected by user.");
      } else {
        toast.error(`Connection error: ${err?.shortMessage ?? err?.message ?? "Failed to connect"}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const isConnecting = isPending || loading;

  return (
    <button
      type="button"
      disabled={isConnecting}
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-wider hover:bg-accent-red transition-colors disabled:opacity-50 font-bold"
    >
      <Wallet size={16} />
      <span>{isConnecting ? "Connecting…" : "Connect Wallet"}</span>
    </button>
  );
}
