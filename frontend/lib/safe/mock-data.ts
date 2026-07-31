import type { Address } from "viem";

import type { SafeContext, TreasuryProposal } from "./types";

const DEMO_SAFE = "0x042aA33200000000000000000000000000000001" as Address;
const SIGNER_A = "0x1111111111111111111111111111111111111111" as Address;
const SIGNER_B = "0x2222222222222222222222222222222222222222" as Address;
const SIGNER_C = "0x3333333333333333333333333333333333333333" as Address;

export const DEMO_SAFE_ADDRESS = DEMO_SAFE;

export function buildDemoSafe(safeAddress: Address, userAddress?: Address): SafeContext {
  return {
    address: safeAddress,
    name: "Ops Treasury",
    threshold: 2,
    signerCount: 3,
    moduleEnabled: true,
    moduleAddress: "0xSafety00000000000000000000000000000001" as Address,
    wrappedBalanceLabel: "[ENCRYPTED]",
    publicBalanceLabel: "12,400.00 USDC (visible)",
  };
}

export function buildDemoProposals(userAddress?: Address): TreasuryProposal[] {
  const you = userAddress?.toLowerCase();

  return [
    {
      id: "prop-001",
      recipient: "0x7a8121Ab000000000000000000000000004b21" as Address,
      token: "cUSDC",
      decryptedAmount: null,
      confirmations: 1,
      threshold: 2,
      signers: [
        {
          address: SIGNER_A,
          signed: true,
          isYou: you === SIGNER_A.toLowerCase(),
        },
        {
          address: SIGNER_B,
          signed: false,
          isYou: you === SIGNER_B.toLowerCase(),
        },
        {
          address: SIGNER_C,
          signed: false,
          isYou: you === SIGNER_C.toLowerCase(),
        },
      ],
      status: "awaiting_signatures",
      createdAt: "2026-07-25T14:22:00.000Z",
      safeTxHash:
        "0xabc12300000000000000000000000000000000000000000000000000000001",
      memo: "Contractor settlement — Q2",
    },
    {
      id: "prop-002",
      recipient: "0x9f3300Cd000000000000000000000000008812" as Address,
      token: "cUSDC",
      decryptedAmount: you ? "3,250.00 USDC" : null,
      confirmations: 2,
      threshold: 2,
      signers: [
        { address: SIGNER_A, signed: true },
        { address: SIGNER_B, signed: true, isYou: you === SIGNER_B.toLowerCase() },
        { address: SIGNER_C, signed: false },
      ],
      status: "ready_to_execute",
      createdAt: "2026-07-24T09:10:00.000Z",
      safeTxHash:
        "0xdef45600000000000000000000000000000000000000000000000000000002",
      memo: "Grant disbursement",
    },
    {
      id: "prop-003",
      recipient: "0x4c8811Ee00000000000000000000000000aa99" as Address,
      token: "cUSDC",
      decryptedAmount: you ? "890.00 USDC" : null,
      confirmations: 2,
      threshold: 2,
      signers: [
        { address: SIGNER_A, signed: true },
        { address: SIGNER_C, signed: true },
        { address: SIGNER_B, signed: false },
      ],
      status: "executed",
      createdAt: "2026-07-20T16:45:00.000Z",
      executedAt: "2026-07-21T11:02:00.000Z",
      safeTxHash:
        "0x789abc00000000000000000000000000000000000000000000000000000003",
      executionTxHash:
        "0x99988800000000000000000000000000000000000000000000000000000004",
      memo: "Vendor invoice #4412",
    },
  ];
}
