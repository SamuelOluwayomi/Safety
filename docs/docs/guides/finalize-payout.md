---
sidebar_position: 5
title: Finalize Payout
---

# Finalize a Payout

Finalizing executes the USDC transfer to the recipient. It requires fetching public decryption proofs from the Nox TEE and submitting a second Safe transaction.

## Prerequisites

- A `requestPayout` transaction has already been executed and a `requestId` exists.
- The debit success flag must be `true` (i.e., the module had sufficient encrypted balance at request time).

## Steps

1. Open the dashboard.
2. Find the pending payout in the **Payout Queue** section.
3. Click **Finalize** on the payout row.

## What Happens Internally

### Step 1: Read Pending Payout

The hook reads `pendingPayouts[requestId]` from the module:

```typescript
const [recipient, amountHandle, debitHandle, finalized] = await readContract({
  functionName: "pendingPayouts",
  args: [requestId],
})
```

### Step 2: Fetch Public Decryption Proofs

The frontend calls `/api/nox/public-decrypt`:

```
POST /api/nox/public-decrypt
Body: { handle: "0x000...", debitHandle: "0x000...", chainId: 11155111 }
Response: { amountProof: "0x...", debitSuccessProof: "0x..." }
```

The Nox TEE verifies that both handles have `allowPublicDecryption` set in their ACL, then generates the decryption proofs.

### Step 3: Build finalizePayout Calldata

```typescript
encodeFunctionData({
  abi: MODULE_ABI,
  functionName: "finalizePayout",
  args: [requestId, amountProof, debitSuccessProof],
})
```

### Step 4: Approve and Execute

Same pattern as `requestPayout`: `approveHash` then `execTransaction` with 600,000 gas.

## On-Chain Settlement

Inside `finalizePayout`:

1. `Nox.publicDecrypt(debitSuccess, debitSuccessProof)` — verify the proof and get the plaintext boolean.
2. Revert if `debitSucceeded == false` (balance was insufficient at request time).
3. `Nox.publicDecrypt(amount, amountProof)` — reveal the plaintext amount.
4. `payout.finalized = true` — mark as settled.
5. `IERC20.safeTransfer(recipient, amountPlaintext)` — send USDC.
6. Emit `PayoutFinalized(requestId, recipient, amountPlaintext)`.

## Why Two Separate Transactions Are Needed

The `requestPayout` transaction handles the encrypted balance deduction. The `finalizePayout` transaction handles the actual token transfer. They are split because:

1. The public decryption proof can only be generated after the handles are stored on-chain with `allowPublicDecryption` set.
2. Generating the proof off-chain requires a round trip to the Nox TEE after the handles exist on-chain.
3. A single transaction cannot both store the handle and consume a proof for it.

## Gas Budget

| Transaction | Gas Limit |
|---|---|
| `approveHash` | 150,000 |
| `execTransaction → finalizePayout` | 600,000 |
