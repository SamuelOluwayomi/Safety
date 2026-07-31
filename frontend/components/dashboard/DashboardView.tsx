"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Compass, Lightbulb, CheckCircle, ArrowRight } from "@phosphor-icons/react";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import AuditPanel from "@/components/dashboard/AuditPanel";
import ProposalRow from "@/components/dashboard/ProposalRow";
import ProposePayoutForm from "@/components/dashboard/ProposePayoutForm";
import SafeContextPanel from "@/components/dashboard/SafeContextPanel";
import type { DashboardTab } from "@/lib/safe/types";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { getDeployment } from "@/lib/deployments";
import { useSafeData } from "@/lib/hooks/useSafeData";
import { usePayouts } from "@/lib/hooks/usePayouts";
import { useFinalizePayout } from "@/lib/hooks/useFinalizePayout";
import { cn } from "@/lib/utils/cn";
import InfoTooltip from "@/components/ui/InfoTooltip";

const TABS: { id: DashboardTab; label: string; tooltip: string }[] = [
  {
    id: "queue",
    label: "Signature Queue",
    tooltip: "Lists active confidential payout proposals that have been requested on-chain. Click 'Finalize & transfer' to fetch Nox TEE proofs and execute the payment.",
  },
  {
    id: "propose",
    label: "Propose Payout",
    tooltip: "Create a new encrypted payout request. Amount is encrypted client-side via iExec Nox before submitting the Safe multisig transaction.",
  },
  {
    id: "ledger",
    label: "Ledger History",
    tooltip: "History of all completed, finalized payouts where real USDC tokens were transferred to recipients.",
  },
  {
    id: "audit",
    label: "Audit / ACL",
    tooltip: "Inspect encrypted handle IDs to verify Access Control List (ACL) viewing permissions.",
  },
];

export default function DashboardView() {
  const { address, isConnected } = useAccount();
  const { networkKey, safeAddress, tab, setSafeAddress, setTab } =
    useDashboardStore();

  const deployment = useMemo(
    () => getDeployment(networkKey),
    [networkKey],
  );


  // ── On-chain data ────────────────────────────────────────────────
  const { safe, isLoading: safeLoading, refetch: refetchSafe } = useSafeData(
    safeAddress,
    deployment,
  );
  const { payouts, isLoading: payoutsLoading, refetch: refetchPayouts } =
    usePayouts(deployment);
  const { finalize, isLoading: finalizing } = useFinalizePayout(deployment);

  const queue  = useMemo(() => payouts.filter((p) => !p.finalized), [payouts]);
  const ledger = useMemo(() => payouts.filter((p) => p.finalized),  [payouts]);

  function linkDemoSafe() {
    setSafeAddress(deployment.addresses.safe);
    toast.message(`Deployed Safe loaded for ${deployment.label}`, {
      description: `Address: ${deployment.addresses.safe}`,
    });
  }

  function handleRefresh() {
    refetchSafe();
    refetchPayouts();
    toast.info("Refreshed on-chain data");
  }

  return (
    <div className="flex-1 flex flex-col border-document-b">
      <header className="border-document-b bg-cream px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent-red flex items-center gap-1.5">
              <span>Exhibit C // Treasury Console ({deployment.label})</span>
              <InfoTooltip content="The command center for managing confidential payouts, viewing encrypted queues, and executing TEE settlements." />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
              Multisig <em className="italic font-normal text-accent-red">command.</em>
            </h1>
            <p className="font-sans text-sm text-charcoal/70 max-w-xl">
              Propose, sign, and execute confidential payouts through your Safe —
              amounts stay encrypted on-chain via iExec Nox TEE enclaves.
            </p>
          </div>

          {isConnected && (
            <div className="flex items-center gap-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-charcoal/60 border-document bg-paper px-4 py-2 flex items-center gap-2">
                <span>{payoutsLoading || safeLoading ? "Loading…" : `${queue.length} Pending · ${ledger.length} Settled`}</span>
                <InfoTooltip content="Shows count of active pending payout proposals vs. finalized transfers." />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="border-document bg-paper px-3 py-2 font-mono text-[11px] uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors font-bold"
              >
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Quick How-To Onboarding Guide */}
          <div className="border-document bg-paper p-5 font-sans text-xs space-y-3">
            <div className="flex items-center justify-between border-document-b pb-2">
              <div className="font-mono text-xs uppercase tracking-wider text-accent-red font-bold flex items-center gap-2">
                <Lightbulb size={16} />
                <span>QUICK START GUIDE // HOW TO EXECUTE A PAYOUT</span>
              </div>
              <span className="font-mono text-[10px] text-charcoal/50 uppercase">
                Step-by-step
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[11px] text-charcoal/80">
              <div className="border-document bg-cream p-3 space-y-1">
                <span className="text-accent-red font-bold block">1. SELECT SAFE &amp; NETWORK</span>
                <p className="font-sans text-[11px] text-charcoal/70">
                  Verify the active Safe on {deployment.label}. The console is auto-loaded with our deployed Safe contract.
                </p>
              </div>
              <div className="border-document bg-cream p-3 space-y-1">
                <span className="text-accent-red font-bold block">2. PROPOSE ENCRYPTED PAYOUT</span>
                <p className="font-sans text-[11px] text-charcoal/70">
                  Go to &apos;Propose Payout&apos;, enter recipient &amp; amount. Amount is encrypted client-side via Nox before signing.
                </p>
              </div>
              <div className="border-document bg-cream p-3 space-y-1">
                <span className="text-accent-red font-bold block">3. FINALIZE &amp; TRANSFER</span>
                <p className="font-sans text-[11px] text-charcoal/70">
                  In &apos;Signature Queue&apos;, click &apos;Finalize &amp; transfer&apos; to unwrap and send standard USDC to recipient.
                </p>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="border-document bg-paper p-10 text-center space-y-4 max-w-lg mx-auto">
              <p className="font-mono text-xs uppercase tracking-widest text-charcoal/55">
                Wallet Required
              </p>
              <p className="font-serif text-xl font-bold">
                Connect a Web3 wallet to access the treasury console.
              </p>
              <p className="font-sans text-xs text-charcoal/70">
                You will be able to propose confidential payouts, approve multisig transactions, and finalize token releases.
              </p>
              <div className="flex justify-center pt-2">
                <ConnectWalletButton />
              </div>
            </div>
          )}

          {isConnected && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <SafeContextPanel safe={safe} onLinkDemo={linkDemoSafe} />
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div
                  className="flex flex-wrap gap-1 border-document bg-paper p-1"
                  role="tablist"
                >
                  {TABS.map((t) => (
                    <div key={t.id} className="flex items-center">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                          "px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 font-bold",
                          tab === t.id
                            ? "bg-charcoal text-cream"
                            : "text-charcoal/60 hover:text-charcoal hover:bg-cream",
                        )}
                      >
                        <span>{t.label}</span>
                        {t.id === "queue" && queue.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-accent-red text-white text-[9px] rounded-full">
                            {queue.length}
                          </span>
                        )}
                      </button>
                      <div className="px-1">
                        <InfoTooltip content={t.tooltip} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── QUEUE ── */}
                {tab === "queue" && (
                  <div className="space-y-4">
                    {payoutsLoading ? (
                      <div className="border-document bg-paper p-8 font-mono text-xs uppercase text-charcoal/50 text-center animate-pulse">
                        Loading on-chain payout queue from {deployment.label}…
                      </div>
                    ) : queue.length === 0 ? (
                      <div className="border-document bg-paper p-8 space-y-4 text-center">
                        <p className="font-mono text-xs uppercase tracking-wider text-charcoal/60">
                          No Pending Proposals
                        </p>
                        <p className="font-sans text-xs text-charcoal/70 max-w-md mx-auto">
                          There are no active payout requests waiting for finalization on {deployment.label}. Click below to propose a new confidential payout!
                        </p>
                        <button
                          type="button"
                          onClick={() => setTab("propose")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors"
                        >
                          <span>Propose New Payout</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    ) : (
                      queue.map((p) => (
                        <ProposalRow
                          key={p.requestId}
                          payout={p}
                          onFinalize={async () => {
                            await finalize(p);
                            refetchPayouts();
                            refetchSafe();
                          }}
                          finalizing={finalizing}
                          connectedAddress={address}
                          networkKey={networkKey}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* ── PROPOSE ── */}
                {tab === "propose" && (
                  <ProposePayoutForm
                    deployment={deployment}
                    onSuccess={() => {
                      refetchPayouts();
                      refetchSafe();
                      setTab("queue");
                    }}
                  />
                )}

                {/* ── LEDGER ── */}
                {tab === "ledger" && (
                  <div className="space-y-4">
                    {payoutsLoading ? (
                      <div className="border-document bg-paper p-8 font-mono text-xs uppercase text-charcoal/50 text-center animate-pulse">
                        Loading ledger…
                      </div>
                    ) : ledger.length === 0 ? (
                      <div className="border-document bg-paper p-8 font-mono text-xs uppercase text-charcoal/50 text-center">
                        No executed payouts yet on {deployment.label}
                      </div>
                    ) : (
                      ledger.map((p) => (
                        <ProposalRow
                          key={p.requestId}
                          payout={p}
                          connectedAddress={address}
                          networkKey={networkKey}
                        />
                      ))
                    )}
                  </div>
                )}

                {tab === "audit" && <AuditPanel />}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
