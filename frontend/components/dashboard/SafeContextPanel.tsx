"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { ShieldCheck, ArrowSquareOut, Globe, ShieldPlus } from "@phosphor-icons/react";
import type { Address } from "viem";

import { safeAppLink } from "@/lib/chains";
import type { SafeContext } from "@/lib/safe/types";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { NETWORK_OPTIONS, getDeployment, type NetworkKey } from "@/lib/deployments";
import { truncateAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import InfoTooltip from "@/components/ui/InfoTooltip";
import CreateSafeForm from "@/components/dashboard/CreateSafeForm";

interface SafeContextPanelProps {
  safe: SafeContext | null;
  onLinkDemo: () => void;
}

type PanelView = "link" | "create";

export default function SafeContextPanel({
  safe,
  onLinkDemo,
}: SafeContextPanelProps) {
  const { safeAddress, setSafeAddress, networkKey, setNetworkKey } =
    useDashboardStore();

  const [view, setView] = useState<PanelView>("link");

  const deployment = getDeployment(networkKey);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("safeAddress") ?? "").trim();
    if (isAddress(raw)) setSafeAddress(raw);
  }

  function handleSafeCreated(addr: Address) {
    setSafeAddress(addr);
    setView("link"); // return to normal view (dashboard loads via setSafeAddress)
  }

  return (
    <aside className="border-document bg-paper lg:sticky lg:top-24 lg:self-start divide-y divide-charcoal/15">
      {/* Network Chooser Bar */}
      <div className="p-4 bg-cream flex items-center justify-between border-document-b font-mono text-xs">
        <span className="flex items-center gap-1 uppercase text-[10px] tracking-wider text-charcoal/60">
          <Globe size={14} className="text-accent-red" />
          Target Network
          <InfoTooltip content="Selects the target testnet blockchain (Arbitrum Sepolia or Ethereum Sepolia). All contract reads, Nox TEE proofs, and Safe transactions route to this network." />
        </span>
        <select
          value={networkKey}
          onChange={(e) => {
            setNetworkKey(e.target.value as NetworkKey);
            setView("link");
          }}
          className="bg-paper border-document px-2 py-1 font-mono text-xs text-charcoal font-bold cursor-pointer focus:outline-none"
        >
          {NETWORK_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Create Safe Form ─────────────────────────────────────────────── */}
      {!safe && view === "create" && (
        <CreateSafeForm
          networkKey={networkKey}
          onCreated={handleSafeCreated}
          onCancel={() => setView("link")}
        />
      )}

      {/* ── Link Existing Safe ────────────────────────────────────────────── */}
      {!safe && view === "link" && (
        <div className="p-6 space-y-6">
          <div className="inline-flex items-center gap-2 border-document px-3 py-1 bg-cream font-mono text-[10px] uppercase tracking-widest text-accent-red">
            <ShieldCheck size={12} />
            Link Safe Address
          </div>
          <p className="font-sans text-sm text-charcoal/75 leading-relaxed">
            Connect a Gnosis Safe multi-signature wallet to view confidential treasury queues and propose encrypted payouts.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-charcoal/55">
              Safe address ({deployment.label})
              <InfoTooltip content="Enter your Safe multisig contract address. Safety's payout module must be enabled on this Safe." />
            </label>
            <input
              name="safeAddress"
              type="text"
              defaultValue={safeAddress ?? deployment.addresses.safe}
              placeholder="0x…"
              className="w-full border-document bg-cream px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent-red"
            />
            <button
              type="submit"
              className="w-full border-document bg-charcoal text-cream py-2.5 font-mono text-xs uppercase tracking-wider hover:bg-accent-red transition-colors font-bold"
            >
              Connect Safe Address
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-charcoal/30">
            <div className="flex-1 border-t border-charcoal/15" />
            <span className="font-mono text-[10px] uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-charcoal/15" />
          </div>

          {/* Create New Safe CTA */}
          <button
            type="button"
            onClick={() => setView("create")}
            className="w-full border-document bg-paper border-accent-red/30 py-3 font-mono text-xs uppercase tracking-wider hover:bg-cream transition-colors font-bold text-accent-red flex items-center justify-center gap-2"
          >
            <ShieldPlus size={14} />
            Create New Safe In-App
          </button>

          <div className="border-document-t pt-4">
            <button
              type="button"
              onClick={onLinkDemo}
              className="w-full text-left font-mono text-[11px] uppercase tracking-wider text-charcoal/60 hover:text-accent-red transition-colors"
            >
              → Load deployed demo Safe
            </button>
          </div>
        </div>
      )}

      {/* ── Connected Safe Info ───────────────────────────────────────────── */}
      {safe && (
        <>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-red mb-1 flex items-center">
                  Active Safe
                  <InfoTooltip content="The connected Gnosis Safe multi-signature account that controls the confidential treasury module." />
                </div>
                <h2 className="font-serif text-2xl font-bold">{safe.name}</h2>
              </div>
              <a
                href={safeAppLink(safe.address, networkKey)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-document hover:bg-cream transition-colors"
                aria-label="Open in Safe app"
              >
                <ArrowSquareOut size={16} />
              </a>
            </div>
            <p className="font-mono text-xs break-all text-charcoal/70">{safe.address}</p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="border-document bg-cream p-3">
                <span className="flex items-center text-[10px] uppercase text-charcoal/45 mb-1">
                  Threshold
                  <InfoTooltip content="Minimum signer approvals required by the Safe to execute transactions." />
                </span>
                <span className="font-bold text-lg">
                  {safe.threshold} / {safe.signerCount}
                </span>
              </div>
              <div className="border-document bg-cream p-3">
                <span className="flex items-center text-[10px] uppercase text-charcoal/45 mb-1">
                  Module
                  <InfoTooltip content="Shows whether ConfidentialPayoutModule is enabled on the Safe contract." />
                </span>
                <span
                  className={cn(
                    "font-bold text-xs uppercase",
                    safe.moduleEnabled ? "text-emerald-700" : "text-accent-red",
                  )}
                >
                  {safe.moduleEnabled ? "Enabled" : "Not enabled"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 flex items-center">
              Balances
              <InfoTooltip content="Breakdown of encrypted treasury balances inside the module vs. unencrypted public tokens in the Safe." />
            </div>
            <div className="space-y-3">
              <div className="border-document bg-charcoal text-cream p-4">
                <div className="font-mono text-[10px] uppercase text-cream/60 mb-1 flex items-center justify-between">
                  <span>Confidential Treasury (ERC-7984)</span>
                  <InfoTooltip content="Total USDC deposited into the confidential payout module as encrypted handles." />
                </div>
                <span className="font-mono text-lg tracking-widest redacted-bar px-2 py-0.5 inline-block text-accent-red font-bold">
                  {safe.wrappedBalanceLabel}
                </span>
              </div>
              <div className="border-document bg-cream p-4">
                <div className="font-mono text-[10px] uppercase text-charcoal/55 mb-1 flex items-center justify-between">
                  <span>Plain ERC-20 (Public Balance)</span>
                  <InfoTooltip content="Standard USDC balance held in the module contract address on-chain." />
                </div>
                <span className="font-mono text-sm font-bold">{safe.publicBalanceLabel}</span>
              </div>
            </div>
          </div>

          {safe.moduleAddress && (
            <div className="p-6 font-mono text-[10px] text-charcoal/55 space-y-1">
              <span className="uppercase tracking-wider flex items-center">
                Payout module
                <InfoTooltip content="Deployed ConfidentialPayoutModule smart contract address on this network." />
              </span>
              <span className="block break-all font-bold text-charcoal">
                {truncateAddress(safe.moduleAddress, 8)}
              </span>
            </div>
          )}

          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={() => { setSafeAddress(null); setView("link"); }}
              className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60 hover:text-accent-red transition-colors flex items-center gap-1"
            >
              ← Switch or Change Safe Address
            </button>
            <button
              type="button"
              onClick={() => { setSafeAddress(null); setView("create"); }}
              className="font-mono text-[10px] uppercase tracking-wider text-accent-red hover:underline transition-colors flex items-center gap-1"
            >
              <ShieldPlus size={11} />
              Create a New Safe Instead
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
