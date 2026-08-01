---
sidebar_position: 4
title: Nox Revert Issues
---

# Nox TEE Revert Issues

## "insufficient encrypted balance"

Thrown by `finalizePayout` when `Nox.publicDecrypt(debitSuccess)` returns `false`.

This means that at the time `requestPayout` was called, the module's encrypted balance was lower than the requested amount. The `Nox.safeSub` operation returned `debitSuccess = false`, and `Nox.select` left the balance unchanged.

**No funds are at risk.** The payout is in a permanently failed state for this `requestId`. A new `requestPayout` must be submitted after depositing sufficient USDC.

## "Nox.fromExternal failed" / Handle Proof Mismatch

If `requestPayout` reverts during `Nox.fromExternal(handle, proof)`, the proof does not match the handle or was generated for a different `appContract`.

**Causes:**
- The `appContract` passed to `/api/nox/encrypt` was incorrect (e.g. demo module address instead of the custom module).
- The handle was generated on a different chain than the one being transacted on.
- The proof expired (Nox proofs have a TTL — re-encrypt if waiting too long between encryption and submission).

**Fix:** Re-call `/api/nox/encrypt` with the correct `appContract` matching the actual deployed module address and retry.

## Constructor Revert During Deployment

Deploying `ConfidentialPayoutModule` must not call any Nox operations in the constructor. If you see a deployment revert, check that no Nox calls are in `constructor()`.

The correct pattern (used by Safety) is:

```solidity
constructor() {}  // Empty — no Nox ops

function initialize(...) external {
    // No Nox ops here either — just set storage
}

function deposit(...) external onlySafe {
    if (!encryptedBalanceSeeded) {
        encryptedBalance = Nox.toEuint256(0);  // Safe here — contract is deployed
        // ...
    }
}
```

## TEE Enclave Timeout

Nox TEE operations call off-chain enclaves that can occasionally time out under high load.

**Symptoms:** The `execTransaction` transaction is stuck pending, or the `/api/nox/public-decrypt` request hangs for more than 30 seconds.

**Fix:** Retry. If the transaction was submitted but the enclave did not respond, the transaction will either succeed later or fail and be droppable. If the API call timed out, simply retry the finalize action.

## Nox Error Codes

| Error | Meaning |
|---|---|
| `NoxACLNotAllowed` | The caller does not have ACL permission to decrypt this handle |
| `NoxHandleExpired` | The ciphertext handle has expired (rare, usually in development) |
| `NoxProofInvalid` | The proof bytes do not match the handle |
| `NoxNotSeeded` | Attempted Nox operation on an un-initialized encrypted type |

These errors appear as on-chain revert reasons visible on block explorers.
