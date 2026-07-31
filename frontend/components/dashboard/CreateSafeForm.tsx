"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircle,
  Plus,
  Trash,
  Warning,
  ShieldPlus,
  Spinner,
  ArrowLeft,
  ArrowSquareOut,
  Lock,
  Users,
  Cpu,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { useDeploySafe, type DeployStep } from "@/lib/hooks/useDeploySafe";
import type { NetworkKey } from "@/lib/deployments";
import { getDeployment } from "@/lib/deployments";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import InfoTooltip from "@/components/ui/InfoTooltip";

interface CreateSafeFormProps {
  networkKey: NetworkKey;
  onCreated: (safeAddress: Address) => void;
  onCancel: () => void;
}

const STEP_LABELS: Record<DeployStep, string> = {
  idle: "Deploy Safe",
  deploying: "1/2 Deploying Safe proxy…",
  "waiting-deploy": "Confirming deployment…",
  "enabling-module": "2/2 Enabling privacy module…",
  success: "Done",
  error: "Retry Deploy",
};

const STEP_DETAIL: Record<DeployStep, string> = {
  idle: "",
  deploying: "Approve the wallet transaction to deploy your Safe contract.",
  "waiting-deploy": "Waiting for on-chain confirmation, this takes ~15 seconds.",
  "enabling-module": "Approve a second transaction to enable ConfidentialPayoutModule.",
  success: "",
  error: "Something went wrong. Check console for details and retry.",
};

export default function CreateSafeForm({
  networkKey,
  onCreated,
  onCancel,
}: CreateSafeFormProps) {
  const { address: connectedAddress } = useAccount();
  const { setSafeAddress } = useDashboardStore();
  const deployment = getDeployment(networkKey);

  const { deploy, step, isLoading, safeAddress, txHash, reset } = useDeploySafe();

  const [additionalOwners, setAdditionalOwners] = useState<string[]>([]);
  const [newOwner, setNewOwner] = useState("");
  const [threshold, setThreshold] = useState(1);
  const [ownerError, setOwnerError] = useState("");

  const totalOwners = 1 + additionalOwners.length; // connected wallet + extras

  function addOwner() {
    const trimmed = newOwner.trim();
    if (!isAddress(trimmed)) {
      setOwnerError("Invalid Ethereum address");
      return;
    }
    if (
      trimmed.toLowerCase() === connectedAddress?.toLowerCase() ||
      additionalOwners.some((o) => o.toLowerCase() === trimmed.toLowerCase())
    ) {
      setOwnerError("Address already added");
      return;
    }
    setAdditionalOwners((prev) => [...prev, trimmed]);
    setNewOwner("");
    setOwnerError("");
  }

  function removeOwner(idx: number) {
    setAdditionalOwners((prev) => prev.filter((_, i) => i !== idx));
    setThreshold((t) => Math.min(t, totalOwners - 1));
  }

  async function handleDeploy() {
    if (!connectedAddress) {
      toast.error("Connect your wallet first.");
      return;
    }

    const result = await deploy({
      ownerAddress: connectedAddress,
      additionalOwners: additionalOwners as Address[],
      threshold,
      networkKey,
    });

    if (result) {
      setSafeAddress(result);
      onCreated(result);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success" && safeAddress) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-emerald-700 flex items-center justify-center">
            <CheckCircle size={28} className="text-white" weight="bold" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-800 font-bold">
            Safe Deployed &amp; Module Active
          </p>
          <h3 className="font-serif text-xl font-bold text-charcoal">
            Your confidential treasury is ready.
          </h3>
        </div>

        <div className="border-document bg-cream p-4 space-y-2 font-mono text-xs">
          <p className="text-[10px] uppercase text-charcoal/50 tracking-wider">New Safe Address</p>
          <p className="break-all font-bold text-charcoal text-[11px]">{safeAddress}</p>
        </div>

        {txHash && (
          <a
            href={`${deployment.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-accent-red underline"
          >
            View deployment tx <ArrowSquareOut size={12} />
          </a>
        )}

        <button
          type="button"
          onClick={() => onCreated(safeAddress)}
          className="w-full border-document bg-charcoal text-cream py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors font-bold"
        >
          Open Dashboard →
        </button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 divide-y divide-charcoal/15">
      {/* Header */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 border-document px-3 py-1 bg-cream font-mono text-[10px] uppercase tracking-widest text-accent-red font-bold">
            <ShieldPlus size={12} />
            Create New Safe
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-[10px] uppercase text-charcoal/50 hover:text-accent-red transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={12} />
            Back
          </button>
        </div>

        <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
          Deploys a Gnosis Safe 1.4.1 multisig contract on {deployment.label} and automatically
          enables the ConfidentialPayoutModule — two wallet approvals, done in-app.
        </p>

        {/* Explainer chips */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="border-document bg-cream p-2.5 flex items-start gap-2">
            <Lock size={14} className="text-accent-red shrink-0 mt-0.5" />
            <span className="font-sans text-[10px] text-charcoal/75 leading-tight">
              Privacy module auto-enabled — amounts stay encrypted on-chain
            </span>
          </div>
          <div className="border-document bg-cream p-2.5 flex items-start gap-2">
            <Cpu size={14} className="text-accent-red shrink-0 mt-0.5" />
            <span className="font-sans text-[10px] text-charcoal/75 leading-tight">
              iExec Nox TEE handles all amount encryption via hardware enclaves
            </span>
          </div>
        </div>
      </div>

      {/* Owners */}
      <div className="p-5 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60 font-bold flex items-center">
          <Users size={12} className="mr-1.5" />
          Safe Owners
          <InfoTooltip content="Ethereum addresses that can sign Safe transactions. The wallet you connected is always the first owner." />
        </div>

        {/* Connected wallet (read-only, always first owner) */}
        <div className="border-document bg-charcoal text-cream p-3 flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="break-all text-[10px]">
            {connectedAddress ?? "Not connected"}
          </span>
          <span className="shrink-0 bg-accent-red px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold text-white">
            You
          </span>
        </div>

        {/* Extra owners */}
        {additionalOwners.map((owner, idx) => (
          <div
            key={owner}
            className="border-document bg-cream p-3 flex items-center justify-between gap-2 font-mono text-[11px]"
          >
            <span className="break-all text-[10px] text-charcoal/80">{owner}</span>
            <button
              type="button"
              onClick={() => removeOwner(idx)}
              className="shrink-0 p-1 text-charcoal/40 hover:text-accent-red transition-colors"
            >
              <Trash size={13} />
            </button>
          </div>
        ))}

        {/* Add owner input */}
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newOwner}
              onChange={(e) => {
                setNewOwner(e.target.value);
                setOwnerError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && addOwner()}
              placeholder="0x… additional owner address"
              className="flex-1 border-document bg-cream px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-red"
            />
            <button
              type="button"
              onClick={addOwner}
              className="border-document bg-charcoal text-cream px-3 py-2 font-mono text-[11px] uppercase hover:bg-accent-red transition-colors flex items-center gap-1"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
          {ownerError && (
            <p className="font-mono text-[10px] text-accent-red">{ownerError}</p>
          )}
        </div>
      </div>

      {/* Threshold */}
      <div className="p-5 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60 font-bold flex items-center">
          Signature Threshold
          <InfoTooltip content="How many of the owners must sign a transaction before it can execute. Common setups: 1/1 (single owner), 2/3 (multisig committee)." />
        </div>

        <div className="flex items-center gap-4">
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="border-document bg-cream px-4 py-2 font-mono text-sm font-bold focus:outline-none focus:ring-1 focus:ring-accent-red cursor-pointer"
          >
            {Array.from({ length: totalOwners }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="font-mono text-sm text-charcoal/70">
            out of <strong>{totalOwners}</strong> owner{totalOwners !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="font-sans text-[11px] text-charcoal/60">
          {threshold === 1 && totalOwners === 1
            ? "Single owner. Only your wallet needs to sign each payout."
            : `${threshold}/${totalOwners} multisig. Any ${threshold} of the ${totalOwners} owners can sign.`}
        </p>
      </div>

      {/* Network info */}
      <div className="p-5 font-mono text-[10px] text-charcoal/55 space-y-1">
        <div className="flex justify-between">
          <span className="uppercase tracking-wider">Network</span>
          <span className="font-bold text-charcoal">{deployment.label}</span>
        </div>
        <div className="flex justify-between">
          <span className="uppercase tracking-wider">Module address</span>
          <span className="break-all text-charcoal">
            {deployment.addresses.module.slice(0, 10)}…
          </span>
        </div>
        <div className="flex justify-between">
          <span className="uppercase tracking-wider">Estimated gas</span>
          <span className="text-charcoal">~300k gas (2 txns)</span>
        </div>
      </div>

      {/* Error banner */}
      {step === "error" && (
        <div className="px-5 py-3 flex items-start gap-2 bg-red-50 border-b border-accent-red/30 font-mono text-[11px] text-accent-red">
          <Warning size={14} className="shrink-0 mt-0.5" />
          <span>{STEP_DETAIL.error}</span>
        </div>
      )}

      {/* Progress detail */}
      {isLoading && STEP_DETAIL[step] && (
        <div className="px-5 py-3 flex items-start gap-2 bg-paper border-b border-charcoal/10 font-sans text-xs text-charcoal/70">
          <Spinner size={14} className="shrink-0 mt-0.5 animate-spin text-accent-red" />
          <span>{STEP_DETAIL[step]}</span>
        </div>
      )}

      {/* Deploy button */}
      <div className="p-5">
        <button
          type="button"
          onClick={handleDeploy}
          disabled={isLoading || !connectedAddress}
          className="w-full border-document bg-charcoal text-cream py-3 font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size={14} className="animate-spin" />
              <span>{STEP_LABELS[step]}</span>
            </>
          ) : (
            <>
              <ShieldPlus size={14} />
              <span>{STEP_LABELS[step]}</span>
            </>
          )}
        </button>

        <p className="mt-2 font-sans text-[10px] text-charcoal/50 text-center">
          You will sign 2 wallet transactions. Make sure you have testnet ETH.
        </p>
      </div>
    </div>
  );
}
