"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, PaperPlaneTilt, CheckCircle, Warning } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { isAddress, type Address } from "viem";
import { z } from "zod";

import { useProposePayout } from "@/lib/hooks/useProposePayout";
import type { DeploymentConfig } from "@/lib/deployments";
import InfoTooltip from "@/components/ui/InfoTooltip";

const schema = z.object({
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .refine((v) => isAddress(v), "Invalid address"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  memo: z.string().max(120).optional(),
  grantAclToSigners: z.boolean(),
});

type FormValues = {
  recipient: string;
  amount: string;
  memo?: string;
  grantAclToSigners: boolean;
};

interface ProposePayoutFormProps {
  deployment: DeploymentConfig;
  safeAddress?: Address;
  onSuccess?: () => void;
}

export default function ProposePayoutForm({ deployment, safeAddress, onSuccess }: ProposePayoutFormProps) {
  const { propose, step, txHash, reset } = useProposePayout(deployment);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      recipient: "",
      amount: "",
      memo: "",
      grantAclToSigners: true,
    },
  });

  async function onSubmit(values: FormValues) {
    await propose({
      recipient: values.recipient as Address,
      amountUsdc: values.amount,
      memo: values.memo,
      safeAddress,
    });
  }

  // After success: show confirmation, then allow another
  if (step === "success") {
    return (
      <div className="border-document bg-paper p-8 space-y-6 text-center">
        <CheckCircle size={40} className="mx-auto text-emerald-600" />
        <div className="space-y-1">
          <p className="font-serif text-xl font-bold text-charcoal">Payout proposed!</p>
          <p className="font-mono text-xs text-charcoal/60">
            The requestPayout Safe transaction has been executed on {deployment.label}.
          </p>
        </div>
        {txHash && (
          <a
            href={`${deployment.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-[11px] text-accent-red underline font-bold"
          >
            View Transaction on {deployment.label} Explorer ↗
          </a>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              resetForm({ recipient: "", amount: "", memo: "", grantAclToSigners: true });
              onSuccess?.();
            }}
            className="px-5 py-2.5 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors font-bold"
          >
            View Signature Queue →
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              resetForm({ recipient: "", amount: "", memo: "", grantAclToSigners: true });
            }}
            className="px-5 py-2.5 border-document bg-paper font-mono text-xs uppercase tracking-widest hover:bg-cream transition-colors"
          >
            Propose Another Payout
          </button>
        </div>
      </div>
    );
  }

  const stepLabel: Record<"idle" | "encrypting" | "approving" | "executing" | "success" | "error", string> = {
    idle:       "Propose to Safe",
    encrypting: "1/3 Encrypting via Nox…",
    approving:  "2/3 Approving Hash…",
    executing:  "3/3 Executing Safe Tx…",
    success:    "Done",
    error:      "Propose to Safe",
  };

  const disabled = isSubmitting || (step !== "idle" && step !== "error");

  return (
    <div className="border-document bg-paper p-6 sm:p-8 space-y-6">
      <div>
        <span className="inline-flex items-center gap-2 border-document px-3 py-1 bg-cream font-mono text-[10px] uppercase tracking-widest text-accent-red font-bold">
          <Lock size={12} />
          New Confidential Payout ({deployment.label})
          <InfoTooltip content="Creates a confidential payment proposal. The numeric amount is encrypted client-side using iExec Nox TEE before hitting the blockchain." />
        </span>
        <p className="mt-4 font-sans text-sm text-charcoal/75 leading-relaxed max-w-2xl">
          Amount is encrypted client-side via iExec Nox before the Safe transaction
          is proposed. Signers approve using the standard multisig flow — the public
          Safe log shows a module call, not the plaintext value.
        </p>
      </div>

      {step === "error" && (
        <div className="flex items-start gap-3 border border-accent-red/30 bg-red-50 px-4 py-3 font-mono text-[11px] text-accent-red">
          <Warning size={16} className="shrink-0 mt-0.5" />
          <span>Transaction failed. Check browser console for details and try again.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-charcoal/70 font-bold flex items-center">
            Recipient EVM Address
            <InfoTooltip content="The destination Ethereum wallet address that will receive the USDC payout upon finalization." />
          </label>
          <input
            {...register("recipient")}
            placeholder="0x…"
            className="w-full border-document bg-cream px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent-red"
          />
          {errors.recipient && (
            <p className="font-mono text-[11px] text-accent-red">
              {errors.recipient.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-charcoal/70 font-bold flex items-center">
            Amount {deployment.tokenSymbol} — Encrypted on submit
            <InfoTooltip content="Numeric payout value. This amount is encrypted off-chain into a Nox handle bytes32 string so block explorers never see the dollar value." />
          </label>
          <input
            {...register("amount")}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full border-document bg-cream px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent-red"
          />
          {errors.amount && (
            <p className="font-mono text-[11px] text-accent-red">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-charcoal/70 font-bold flex items-center">
            Internal Memo (Public to Safe Signers)
            <InfoTooltip content="A human-readable memo or reference ID (e.g. 'Invoice #104') for internal multisig accounting." />
          </label>
          <input
            {...register("memo")}
            placeholder="Invoice ref, grant ID…"
            className="w-full border-document bg-cream px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent-red"
          />
        </div>

        <label className="flex items-start gap-3 border-document bg-cream p-4 cursor-pointer">
          <input
            type="checkbox"
            {...register("grantAclToSigners")}
            className="mt-0.5"
          />
          <span className="font-mono text-[11px] text-charcoal/80 leading-relaxed">
            Grant ACL view permissions to Safe signers so auditors can inspect and decrypt the amount inside the Nox TEE. Recipient always gets automatic decrypt rights upon settlement.
          </span>
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 px-6 py-3 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
        >
          {disabled && step !== "idle" ? (
            <span className="animate-pulse">{stepLabel[step]}</span>
          ) : (
            <>
              <PaperPlaneTilt size={14} />
              {stepLabel[step]}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
