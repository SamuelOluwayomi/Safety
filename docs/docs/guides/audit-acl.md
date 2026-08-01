---
sidebar_position: 6
title: Audit Access
---

# Granting Audit Access

The `grantAuditorAccess` function allows a Safe to give specific external addresses the ability to generate decryption proofs for a payout's amount handle.

## Use Case

A DAO treasurer wants to allow an external accountant or DAO governance contract to independently verify the exact amounts of specific payouts without revealing all encrypted balances.

## How It Works

`grantAuditorAccess(requestId, auditorAddress)` calls `Nox.allow(pendingPayouts[requestId].amount, auditor)` on-chain, adding the auditor to the ACL for that specific handle.

The auditor can then query the Nox TEE with their wallet to generate a decryption proof for the amount handle and read the plaintext value.

## Calling It

This function is currently a direct contract call (not yet surfaced in the dashboard UI). To call it manually:

```typescript
import { encodeFunctionData } from "viem";
import { MODULE_ABI } from "@/lib/contracts";

const calldata = encodeFunctionData({
  abi: MODULE_ABI,
  functionName: "grantAuditorAccess",
  args: [requestId, auditorAddress],
});

// Then submit via Safe execTransaction
await writeContract({
  address: safeAddress,
  abi: SAFE_ABI,
  functionName: "execTransaction",
  args: [moduleAddress, 0n, calldata, 0, 0n, 0n, 0n, ZERO_ADDRESS, ZERO_ADDRESS, sig],
});
```

## Scope of Access

Granting audit access gives the auditor the ability to decrypt one specific payout's `amount` handle only. It does not give access to:
- The overall encrypted balance
- Other payouts' amounts
- The `debitSuccess` flag of any payout
