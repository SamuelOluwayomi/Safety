---
sidebar_position: 2
title: ABIs
---

# Contract ABIs

All ABIs used by the frontend are defined in [`lib/contracts.ts`](file:///c:/Users/SAMUEL/Desktop/SAMUEL/Hackathon/safety/frontend/lib/contracts.ts).

## Safe ABI

The subset of the Gnosis Safe 1.4.1 ABI used by Safety:

```typescript
export const SAFE_ABI = [
  { name: "nonce",              stateMutability: "view",        outputs: [{ type: "uint256" }] },
  { name: "getOwners",          stateMutability: "view",        outputs: [{ type: "address[]" }] },
  { name: "getThreshold",       stateMutability: "view",        outputs: [{ type: "uint256" }] },
  { name: "isModuleEnabled",    inputs: [{ name: "module", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "enableModule",       inputs: [{ name: "module", type: "address" }] },
  { name: "getTransactionHash", inputs: [ to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, _nonce ] },
  { name: "approveHash",        inputs: [{ name: "hashToApprove", type: "bytes32" }] },
  { name: "execTransaction",    inputs: [ to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures ] },
] as const;
```

## Module ABI

The full ABI for `ConfidentialPayoutModule`:

```typescript
export const MODULE_ABI = [
  { name: "token",          stateMutability: "view",        outputs: [{ type: "address" }] },
  { name: "safe",           stateMutability: "view",        outputs: [{ type: "address" }] },
  { name: "initialize",     inputs: [token_, safe_] },
  { name: "nextRequestId",  stateMutability: "view",        outputs: [{ type: "uint256" }] },
  { name: "pendingPayouts", inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [recipient, amount (bytes32), debitSuccess (bytes32), finalized (bool)] },
  { name: "requestPayout",  inputs: [recipient, amountHandle (bytes32), amountProof (bytes)],
    outputs: [{ name: "requestId", type: "uint256" }] },
  { name: "finalizePayout", inputs: [requestId, amountDecryptionProof (bytes), debitSuccessDecryptionProof (bytes)] },
  { name: "deposit",        inputs: [{ name: "amount", type: "uint256" }] },
  // Events
  { name: "PayoutRequested", inputs: [requestId (indexed), recipient (indexed)] },
  { name: "PayoutFinalized", inputs: [requestId (indexed), recipient (indexed), amount] },
  { name: "Deposited",       inputs: [from (indexed), amount] },
] as const;
```

:::note encrypted handles appear as bytes32
`euint256` and `ebool` storage slots are returned as `bytes32` from the ABI because Solidity exposes encrypted handles as 32-byte values. The Nox TEE interprets these as ciphertext references, not raw integers.
:::

## ERC-20 ABI

```typescript
export const ERC20_ABI = [
  { name: "balanceOf",  inputs: [account],         outputs: [{ type: "uint256" }] },
  { name: "approve",    inputs: [spender, value],   outputs: [{ type: "bool" }] },
  { name: "allowance",  inputs: [owner, spender],   outputs: [{ type: "uint256" }] },
  { name: "decimals",                               outputs: [{ type: "uint8" }] },
  { name: "symbol",                                 outputs: [{ type: "string" }] },
] as const;
```

## Factory ABI

```typescript
export const FACTORY_ABI = [
  { name: "getOrCreateModule", inputs: [safeAddress], outputs: [{ name: "moduleAddress", type: "address" }] },
  { name: "getModule",         inputs: [safeAddress], outputs: [{ type: "address" }] },
] as const;
```

## Helper: buildPrevalidatedSig

Constructs a Gnosis Safe prevalidated signature (`v = 1`) for a signer who has already called `approveHash`:

```typescript
export function buildPrevalidatedSig(signerAddress: Address): `0x${string}` {
  return `0x000000000000000000000000${signerAddress.slice(2).toLowerCase()}${"0".repeat(64)}01` as `0x${string}`;
}
```

**Format:** 65 bytes total — `r` (signer address, right-padded to 32 bytes) + `s` (32 zero bytes) + `v` (1 byte = `0x01`).
