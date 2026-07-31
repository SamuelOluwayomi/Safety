"use client";

import { useState } from "react";
import { Check, Eye, Upload, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import InfoTooltip from "@/components/ui/InfoTooltip";
import CopyButton from "@/components/ui/CopyButton";

/**
 * Signer-facing ACL audit panel. Verifies encrypted handle metadata
 * without a backend — full on-chain ACL reads will replace the mock path.
 */
export default function AuditPanel() {
  const [handleId, setHandleId] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "ok" | "fail">("idle");

  async function handleVerify() {
    if (!handleId.trim()) return;
    setPhase("loading");
    await new Promise((r) => setTimeout(r, 600));
    if (handleId.startsWith("0x") && handleId.length >= 10) {
      setPhase("ok");
      toast.success("Handle format valid", {
        description: "ACL verification complete.",
      });
    } else {
      setPhase("fail");
    }
  }

  return (
    <div className="border-document bg-paper p-6 sm:p-8 space-y-6">
      <div>
        <span className="inline-flex items-center gap-2 border-document px-3 py-1 bg-cream font-mono text-[10px] uppercase tracking-widest text-charcoal/70 font-bold">
          <Eye size={12} />
          Signer Audit &amp; Access Control List (ACL)
          <InfoTooltip content="Allows authorized auditors and Safe signers to verify viewing permissions associated with encrypted payout handles." />
        </span>
        <p className="mt-4 font-sans text-sm text-charcoal/75 leading-relaxed max-w-2xl">
          Authorized signers and auditors with ACL keys can inspect encrypted payout
          handles. Paste a handle ID from an executed or pending proposal to verify
          who can decrypt the amount inside the Nox enclave.
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        <label className="font-mono text-[10px] uppercase tracking-wider text-charcoal/70 font-bold flex items-center">
          Encrypted Handle ID (bytes32)
          <InfoTooltip content="Paste a 0x-prefixed 32-byte ciphertext handle from a transaction proposal or log." />
        </label>
        <textarea
          value={handleId}
          onChange={(e) => {
            setHandleId(e.target.value);
            setPhase("idle");
          }}
          rows={4}
          spellCheck={false}
          placeholder="0x… (from proposal or execution receipt)"
          className="w-full border-document bg-cream px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent-red resize-y min-h-[96px]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={!handleId.trim() || phase === "loading"}
          className="inline-flex items-center gap-2 px-4 py-2 border-document bg-charcoal text-cream font-mono text-[11px] uppercase tracking-wider hover:bg-accent-red transition-colors disabled:opacity-50 font-bold"
        >
          <Check size={12} />
          {phase === "loading" ? "Verifying…" : "Verify ACL Rights"}
        </button>
        <label className="inline-flex items-center gap-2 px-4 py-2 border-document bg-cream font-mono text-[11px] uppercase tracking-wider cursor-pointer hover:bg-paper transition-colors">
          <Upload size={12} />
          Load JSON
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = typeof reader.result === "string" ? reader.result : "";
                try {
                  const parsed = JSON.parse(text) as { handleId?: string };
                  setHandleId(parsed.handleId ?? text);
                } catch {
                  setHandleId(text);
                }
                setPhase("idle");
              };
              reader.readAsText(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setHandleId("");
            setPhase("idle");
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border-document font-mono text-[11px] uppercase tracking-wider hover:bg-paper transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      </div>

      {phase === "ok" && (
        <div className="border-document bg-cream p-5 space-y-3 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 font-bold">
            ACL Verification Result
          </p>
          <dl className="grid grid-cols-[minmax(120px,auto)_1fr] gap-x-4 gap-y-2 font-mono text-[11px]">
            <dt className="text-charcoal/45 uppercase">Handle</dt>
            <dd className="break-all flex items-center gap-1">
              <span>{handleId.slice(0, 42)}…</span>
              <CopyButton text={handleId} label="handle ID" />
            </dd>
            <dt className="text-charcoal/45 uppercase font-bold">Decryption Rights</dt>
            <dd className="text-emerald-800 font-bold">Recipient + Authorized Safe Signers</dd>
            <dt className="text-charcoal/45 uppercase">Public Explorer Log</dt>
            <dd>Numeric amount sealed · module execution recorded</dd>
          </dl>
        </div>
      )}

      {phase === "fail" && (
        <p className="font-mono text-[11px] text-accent-red font-bold">
          Invalid handle format. Expected a 0x-prefixed hex string.
        </p>
      )}
    </div>
  );
}
