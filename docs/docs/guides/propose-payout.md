---
sidebar_position: 4
title: Propose Payout
---

# Propose a Payout

Proposing a payout encrypts the amount client-side and submits a `requestPayout` through the Safe. The encrypted amount is stored on-chain as a `bytes32` handle invisible to block explorers.

## Steps

1. Open the dashboard.
2. Click **Propose Payout**.
3. Enter:
   - **Recipient address** — the wallet that will receive the USDC.
   - **Amount** — human-readable USDC (e.g. `50` for 50 USDC).
4. Click **Submit**.

## What Happens Internally

### Step 1: Encrypt the Amount

The frontend calls `/api/nox/encrypt`:

```
POST /api/nox/encrypt
Body: { amount: "50000000", owner: "0x...", appContract: "0x...", chainId: 11155111 }
Response: { handle: "0x000...", proof: "0x..." }
```

The `handle` is a 32-byte Nox ciphertext reference. The `proof` is the TEE's attestation that the handle was correctly created by the specified owner for the specified app contract.

### Step 2: Build requestPayout Calldata

```typescript
encodeFunctionData({
  abi: MODULE_ABI,
  functionName: "requestPayout",
  args: [recipientAddress, handle, proof],
})
```

### Step 3: Compute Safe Transaction Hash

```typescript
safeTxHash = await readContract({
  functionName: "getTransactionHash",
  args: [moduleAddress, 0n, calldata, 0, 0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS, nonce],
})
```

### Step 4: Approve Hash

```typescript
await writeContract({
  functionName: "approveHash",
  args: [safeTxHash],
  gas: 150_000n,
})
```

### Step 5: Execute Transaction

```typescript
const sig = buildPrevalidatedSig(signerAddress);
await writeContract({
  functionName: "execTransaction",
  args: [moduleAddress, 0n, calldata, 0, 0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS, sig],
  gas: 600_000n,
})
```

## On-Chain Result

After `requestPayout` executes:

- A `PendingPayout{recipient, amount (encrypted), debitSuccess (encrypted), finalized: false}` is stored at `pendingPayouts[requestId]`.
- `PayoutRequested(requestId, recipient)` is emitted.
- The encrypted balance is debited (conditionally, using `Nox.select`).

## Multisig Flows

For multi-signer Safes (threshold > 1), additional signers must call `approveHash(safeTxHash)` before `execTransaction` can be called. The current Safety dashboard supports 1-of-N flows; for M > 1, signers must call `approveHash` independently and then any signer can submit `execTransaction`.
