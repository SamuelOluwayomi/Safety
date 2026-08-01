---
sidebar_position: 3
title: Module Resolution
---

# Module Resolution Issues

## The App Deployed a Second Module for My Safe

This happens when:
1. The server restarted and its in-memory map was cleared.
2. The localStorage cache was also empty (e.g. after clearing browser data).
3. The app called `/api/safe/deploy-module` and deployed a new instance.

**How to recover:**

If your funds are still in the original module, you need to point the app back at the correct module address.

1. Find the original module address on the block explorer by searching your Safe address and looking for `initialize` calls to `ConfidentialPayoutModule` contracts.
2. Open browser DevTools → Application → Local Storage.
3. Set the key `safety_module:<networkKey>:<yourSafeAddress (lowercase)>` to the original module address.
4. Reload the page.

## The Dashboard Shows the Wrong Module

If the dashboard is displaying an empty payout queue but you know payouts exist, the app may be reading from the wrong module.

**Check:**
1. Open DevTools Console and run:
   ```javascript
   localStorage.getItem("safety_module:sepolia:0x<your-safe-address-lowercase>");
   ```
2. Compare the returned address with the module address emitted in your `requestPayout` transactions on the block explorer.
3. If they differ, set the correct address as described above.

## Module Not Enabled Error

If the module is deployed but not enabled on the Safe, all `execTransaction → module.*` calls will fail with `GS104` (module not enabled) from the Safe contract.

**Fix:** Click the **Enable Module** button in the dashboard, or submit a transaction manually:

```typescript
const calldata = encodeFunctionData({
  abi: SAFE_ABI,
  functionName: "enableModule",
  args: [moduleAddress],
});

// Call via execTransaction with `to = safeAddress, data = calldata`
```

Note: `enableModule` is called with `to = safeAddress` (the Safe calls itself via `execTransaction`). This is a CALL operation, not a DELEGATECALL.

## isModuleEnabled Returns False After Enabling

The `isModuleEnabled` read may return a stale cached result. Wait for the `enableModule` transaction to be confirmed, then refresh the page.

## How to Verify Module Initialization On-Chain

Call `module.safe()` and `module.token()` via a block explorer's "Read Contract" feature. If both return non-zero addresses, the module is correctly initialized. If they return `0x000...`, `initialize()` was not called — run the deploy-module-for-safe script again.
