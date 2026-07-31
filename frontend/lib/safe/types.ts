import type { Address } from "viem";

export type DashboardTab = "queue" | "propose" | "ledger" | "audit";

export type ProposalStatus =
  | "awaiting_signatures"
  | "ready_to_execute"
  | "executed"
  | "rejected";

export interface SignerState {
  address: Address;
  signed: boolean;
  isYou?: boolean;
}

export interface TreasuryProposal {
  id: string;
  recipient: Address;
  token: string;
  /** Plaintext only when ACL allows; otherwise null */
  decryptedAmount: string | null;
  confirmations: number;
  threshold: number;
  signers: SignerState[];
  status: ProposalStatus;
  createdAt: string;
  executedAt?: string;
  safeTxHash?: string;
  executionTxHash?: string;
  memo?: string;
}

export interface SafeContext {
  address: Address;
  name: string;
  threshold: number;
  signerCount: number;
  moduleEnabled: boolean;
  moduleAddress?: Address;
  wrappedBalanceLabel: string;
  publicBalanceLabel: string;
  moduleBalanceLabel: string;
}
