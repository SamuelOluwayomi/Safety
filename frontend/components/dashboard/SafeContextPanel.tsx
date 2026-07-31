"use client";

import { useState } from "react";
import { isAddress } from "viem";
import {
  ShieldCheck,
  ArrowSquareOut,
  Globe,
  ShieldPlus,
  LockKey,
  ArrowDown,
  Spinner,
} from "@phosphor-icons/react";
import type { Address } from "viem";

import { safeAppLink } from "@/lib/chains";
import type { SafeContext } from "@/lib/safe/types";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { NETWORK_OPTIONS, getDeployment, type NetworkKey } from "@/lib/deployments";
import { truncateAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import InfoTooltip from "@/components/ui/InfoTooltip";
import CreateSafeForm from "@/components/dashboard/CreateSafeForm";
import CopyButton from "@/components/ui/CopyButton";
import { useDepositToTreasury } from "@/lib/hooks/useDepositToTreasury";
import { toast } from "sonner";

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
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);

  const deployment = getDeployment(networkKey);
  const { deposit, isLoading: isDepositing } = useDepositToTreasury(deployment);



  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("safeAddress") ?? "").trim();
    if (isAddress(raw)) setSafeAddress(raw);
  }

  function handleSafeCreated(addr: Address) {
    setSafeAddress(addr);
    setView("link");
  }

  async function handleDepositSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!safe?.address || !depositAmount.trim()) return;
    const ok = await deposit(safe.address, depositAmount.trim());
    if (ok) {
      setDepositAmount("");
      setShowDepositForm(false);
    }
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
            <div className="flex items-center gap-1">
              <p className="font-mono text-xs break-all text-charcoal/70">{safe.address}</p>
              <CopyButton text={safe.address} label="Safe address" />
            </div>
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

          {/* ── Balances Breakdown ── */}
          <div className="p-6 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50 flex items-center">
              Balances
              <InfoTooltip content="Breakdown of public tokens sitting in your Safe wallet vs. confidential tokens stored inside the module vault." />
            </div>
            <div className="space-y-3">
              {/* 1. Safe Public Balance */}
              <div className="border-document bg-cream p-4 space-y-2">
                <div className="font-mono text-[10px] uppercase text-charcoal/55 flex items-center justify-between">
                  <span>Safe Wallet Public Balance</span>
                  <InfoTooltip content="Standard public USDC held directly inside your Safe wallet contract. Click Deposit to move tokens into the confidential module." />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-charcoal">
                    {safe.publicBalanceLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDepositForm((prev) => !prev)}
                    className="border-document bg-charcoal text-cream px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:bg-accent-red transition-colors font-bold flex items-center gap-1"
                  >
                    <LockKey size={11} />
                    Deposit
                  </button>
                </div>
              </div>



              {/* 3. Deposit Form Dropdown */}
              {showDepositForm && (
                <form
                  onSubmit={handleDepositSubmit}
                  className="border-document bg-paper p-4 space-y-3 font-mono text-xs border-accent-red/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-accent-red font-bold flex items-center gap-1">
                      <ArrowDown size={12} />
                      Privatize USDC Into Vault
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDepositAmount(safe.publicBalanceLabel.split(" ")[0] ?? "")
                      }
                      className="text-[9px] uppercase underline text-charcoal/60 hover:text-accent-red"
                    >
                      Use Max
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount in USDC"
                      className="flex-1 border-document bg-cream px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-red"
                    />
                    <button
                      type="submit"
                      disabled={isDepositing || !depositAmount.trim()}
                      className="border-document bg-accent-red text-white px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-charcoal transition-colors font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      {isDepositing ? (
                        <>
                          <Spinner size={12} className="animate-spin" />
                          Depositing…
                        </>
                      ) : (
                        "Confirm Deposit"
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-charcoal/50 leading-tight">
                    Transfers USDC from Safe into Confidential Payout Module and encrypts the balance via Nox.
                  </p>
                </form>
              )}

              {/* 3. Confidential Treasury Vault Balance */}
              <div className="border-document bg-charcoal text-cream p-4">
                <div className="font-mono text-[10px] uppercase text-cream/60 mb-1 flex items-center justify-between">
                  <span>Confidential Treasury (ERC-7984)</span>
                  <InfoTooltip content="Total USDC deposited into the confidential payout module as encrypted handles." />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg tracking-widest redacted-bar px-2 py-0.5 inline-block text-accent-red font-bold">
                    {safe.wrappedBalanceLabel}
                  </span>
                  <span className="font-mono text-[11px] text-cream/70 font-bold">
                    ({safe.moduleBalanceLabel})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {safe.moduleAddress && (
            <div className="p-6 font-mono text-[10px] text-charcoal/55 space-y-1">
              <span className="uppercase tracking-wider flex items-center">
                Payout module
                <InfoTooltip content="Deployed ConfidentialPayoutModule smart contract address on this network." />
              </span>
              <div className="flex items-center gap-1 font-bold text-charcoal">
                <span className="break-all">{truncateAddress(safe.moduleAddress, 8)}</span>
                <CopyButton text={safe.moduleAddress} label="Payout module address" />
              </div>
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
