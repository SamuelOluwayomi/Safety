import type { Address } from "viem";

// ── Deployed addresses (Arbitrum Sepolia) ────────────────────────────
export const ADDRESSES = {
  module:     "0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4" as Address,
  safe:       "0x9064c9876bec81da527dB6A6BFBF6Bd4fB68ecD0" as Address,
  usdc:       "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address,
  usdcDecimals: 6,
} as const;

// ── ABIs ──────────────────────────────────────────────────────────────

export const SAFE_ABI = [
  {
    name: "nonce",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getOwners",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getThreshold",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isModuleEnabled",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "module", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getTransactionHash",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "to",             type: "address" },
      { name: "value",          type: "uint256" },
      { name: "data",           type: "bytes"   },
      { name: "operation",      type: "uint8"   },
      { name: "safeTxGas",      type: "uint256" },
      { name: "baseGas",        type: "uint256" },
      { name: "gasPrice",       type: "uint256" },
      { name: "gasToken",       type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce",         type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "approveHash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "hashToApprove", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "execTransaction",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "to",             type: "address" },
      { name: "value",          type: "uint256" },
      { name: "data",           type: "bytes"   },
      { name: "operation",      type: "uint8"   },
      { name: "safeTxGas",      type: "uint256" },
      { name: "baseGas",        type: "uint256" },
      { name: "gasPrice",       type: "uint256" },
      { name: "gasToken",       type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "signatures",     type: "bytes"   },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

export const MODULE_ABI = [
  {
    name: "token",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "safe",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "nextRequestId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "pendingPayouts",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "recipient",    type: "address" },
      { name: "amount",       type: "bytes32" },
      { name: "debitSuccess", type: "bytes32" },
      { name: "finalized",    type: "bool"    },
    ],
  },
  {
    name: "requestPayout",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient",    type: "address" },
      { name: "amountHandle", type: "bytes32" },
      { name: "amountProof",  type: "bytes"   },
    ],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    name: "finalizePayout",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId",                  type: "uint256" },
      { name: "amountDecryptionProof",      type: "bytes"   },
      { name: "debitSuccessDecryptionProof", type: "bytes"  },
    ],
    outputs: [],
  },
  // Events
  {
    name: "PayoutRequested",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
    ],
  },
  {
    name: "PayoutFinalized",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount",    type: "uint256", indexed: false },
    ],
  },
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "from",   type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/** Build the prevalidated sig for a 1/1 Safe where signerAddress has called approveHash */
export function buildPrevalidatedSig(signerAddress: Address): `0x${string}` {
  return `0x000000000000000000000000${signerAddress.slice(2).toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001` as `0x${string}`;
}
