---
sidebar_position: 1
title: Common Errors
---

# Common Errors

## "execTransaction reverted on-chain"

This is thrown by `useProposePayout` when the Safe `execTransaction` transaction reverts.

**Most common causes:**

| Cause | Fix |
|---|---|
| Gas too low | Safety uses 600,000 gas for all module calls. If you customized gas, increase it. |
| Wrong module address | Check that the `moduleAddress` in localStorage matches the one enabled on the Safe. Clear the cache and reload. |
| Module not enabled | Call `enableModule(moduleAddress)` on the Safe before calling any module functions. |
| Nox TEE timeout | The Nox proof generation timed out. Retry the transaction. |
| Invalid handle/proof | The handle and proof passed to `requestPayout` do not match. Re-encrypt the amount and retry. |

## "finalizePayout reverted on-chain"

Thrown by `useFinalizePayout` when the finalization transaction reverts.

**Most common causes:**

| Cause | Fix |
|---|---|
| `"already finalized"` | This `requestId` was already finalized. Check the payout history. |
| `"insufficient encrypted balance"` | The encrypted balance was insufficient when `requestPayout` was called. The debit flag is `false`. No funds are lost. |
| `"unknown request"` | The `requestId` does not exist on the module. Verify the module address. |
| Stale decryption proofs | Proofs are generated fresh per finalize attempt. If you waited too long, retry to get fresh proofs. |
| Wrong module in localStorage | Clear the cache with `localStorage.removeItem("safety_module:...")` and reload. |

## "not safe"

The `onlySafe` modifier reverted. `msg.sender` is not the Safe address linked to this module.

**Fix:** Ensure all module calls go through `Safe.execTransaction`, not direct calls. Verify that the `to` field in `execTransaction` is the module address, not the Safe address itself.

## "already initialized"

`initialize()` was called more than once on a module. This is expected behavior as a guard — the module is already set up. No action needed.

## Balance Shows 0 in the Dashboard

The USDC balance card on the dashboard shows the Safe wallet balance, not the module's encrypted balance.

**If the Safe wallet USDC balance shows 0:**
- The USDC may still be in the module (after a deposit). Check the transaction history on the block explorer.
- The Safe may be on the wrong network. Switch the network selector.
- The RPC may be stale. Wait and refresh, or switch to a different RPC.

## Module Address Mismatch After Server Restart

After a Next.js server restart, the in-memory module map is cleared. If the localStorage cache is also empty, the app may call `/api/safe/deploy-module` and deploy a second module.

**Fix:**

1. Open browser DevTools → Application → Local Storage.
2. Find the key `safety_module:<networkKey>:<safeAddress>`.
3. If missing, set it manually to the correct module address.

Or alternatively, clear the key and let the app re-deploy a new module (only do this if no funds are in the old module).

## Wallet Shows "Confirm Transaction" But Nothing Happens

The wallet prompt did not fire or was dismissed silently.

**Fix:**
- Make sure your wallet is unlocked.
- Check if the wallet app (MetaMask) has a pending request in its queue.
- Switch accounts and switch back to reset the connection.
