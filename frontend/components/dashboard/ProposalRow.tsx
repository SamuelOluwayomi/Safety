"use client";

import {
  CheckCircle,
  Clock,
  Play,
  XCircle,
  ArrowSquareOut,
  Spinner,
} from "@phosphor-icons/react";
import type { Address } from "viem";

import { addressLink } from "@/lib/chains";
import type { OnChainPayout } from "@/lib/hooks/usePayouts";
import type { NetworkKey } from "@/lib/deployments";
import { truncateAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import InfoTooltip from "@/components/ui/InfoTooltip";
import CopyButton from "@/components/ui/CopyButton";

interface ProposalRowProps {
  payout: OnChainPayout;
  onFinalize?: () => void;
  finalizing?: boolean;
  connectedAddress?: Address;
  networkKey?: NetworkKey;
}

export default function ProposalRow({
  payout,
  onFinalize,
  finalizing,
  connectedAddress,
  networkKey = "arbitrumSepolia",
}: ProposalRowProps) {
  const { requestId, recipient, amountHandle, finalized } = payout;

  const isOwner =
    connectedAddress?.toLowerCase() === recipient.toLowerCase();

  return (
    <article
      className={cn(
        "border-document bg-cream p-5 space-y-4 shadow-sm",
        finalized && "opacity-75 bg-paper",
      )}
    >
      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {finalized ? (
              <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-charcoal/70 bg-paper border-charcoal/20">
                <CheckCircle size={12} weight="bold" />
                Finalized &amp; Transferred
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 border-emerald-900/30 font-bold">
                <Play size={12} weight="bold" />
                Ready to Finalize
              </span>
            )}
            <span className="font-mono text-[10px] text-charcoal/50 uppercase font-bold">
              Request #{requestId}
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold">Confidential Payout Request</h3>
        </div>

        {/* Amount — always redacted (handle is an encrypted bytes32) */}
        <div className="text-right font-mono text-xs shrink-0">
          <span className="flex items-center justify-end text-[10px] uppercase text-charcoal/50 mb-1">
            Encrypted Amount
            <InfoTooltip content="The numerical dollar amount is sealed on-chain as a Nox handle bytes32 identifier. Block explorers see only the encrypted handle." />
          </span>
          <span className="inline-flex items-center gap-1 redacted-bar px-2.5 py-0.5 text-[11px] tracking-widest text-accent-red font-bold">
            REDACTED
          </span>
        </div>
      </div>

      {/* ── Metadata ── */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
        <div className="flex justify-between sm:block">
          <dt className="text-charcoal/50 uppercase flex items-center">
            Recipient
            <InfoTooltip content="Destination EVM address that will receive the USDC payout upon finalization." />
          </dt>
          <dd className="pt-0.5 flex items-center gap-1">
            <a
              href={addressLink(recipient, networkKey)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-red transition-colors inline-flex items-center gap-1 font-bold text-charcoal"
            >
              {truncateAddress(recipient, 6)}
              {isOwner && (
                <span className="text-accent-red font-bold"> (Your Wallet)</span>
              )}
              <ArrowSquareOut size={11} />
            </a>
            <CopyButton text={recipient} label="recipient address" />
          </dd>
        </div>

        <div className="flex justify-between sm:block">
          <dt className="text-charcoal/50 uppercase flex items-center">
            Nox Amount Handle
            <InfoTooltip content="The 32-byte ciphertext handle representing the encrypted value in the Nox TEE enclave." />
          </dt>
          <dd className="break-all text-charcoal/70 font-mono pt-0.5 flex items-center gap-1">
            <span>{amountHandle.slice(0, 18)}…</span>
            <CopyButton text={amountHandle} label="Nox amount handle" />
          </dd>
        </div>
      </dl>

      {/* ── Finalize action ── */}
      {!finalized && onFinalize && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-document-t">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFinalize}
              disabled={finalizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-document bg-charcoal text-cream font-mono text-[11px] uppercase tracking-wider hover:bg-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              {finalizing ? (
                <>
                  <Spinner size={13} className="animate-spin" />
                  Fetching Nox Proofs &amp; Finalizing…
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Finalize &amp; Transfer Tokens
                </>
              )}
            </button>
            <InfoTooltip content="Fetches public decryption proofs from iExec Nox TEE, approves Safe transaction hash, and executes finalizePayout() on-chain to release standard USDC tokens." />
          </div>
          <span className="font-mono text-[10px] text-charcoal/50 uppercase">
            Decrypts proof · Releases USDC to recipient
          </span>
        </div>
      )}
    </article>
  );
}
