---
sidebar_position: 4
title: Module Cache
---

# Module Cache (localStorage)

**File:** `lib/utils/module-cache.ts`

The module cache is a thin localStorage wrapper that persists the `ConfidentialPayoutModule` address for each `(networkKey, safeAddress)` pair across page refreshes and Next.js server restarts.

## Why It Exists

The Next.js server holds deployed module addresses in an in-memory `Map`. This map is lost whenever the server process restarts (e.g. local dev HMR, Vercel cold starts). Without a persistent client-side cache, every page load after a restart would trigger a new `/api/safe/deploy-module` call, which would either fail (because the server-side map is empty) or deploy a duplicate module.

The localStorage cache acts as the single source of truth on the client side.

## Key Format

```
safety_module:<networkKey>:<safeAddress (lowercase)>
```

**Examples:**

| Network | Safe Address | localStorage Key |
|---|---|---|
| `sepolia` | `0x81A397...` | `safety_module:sepolia:0x81a397a3654e461a043b1dcf3591689873be2a8c` |
| `arbitrumSepolia` | `0x9064...` | `safety_module:arbitrumSepolia:0x9064c9876bec81da527db6a6bfbf6bd4fb68ecd0` |

## API

```typescript
import { getCachedModule, setCachedModule, clearCachedModule } from "@/lib/utils/module-cache";

// Read
const moduleAddress = getCachedModule("sepolia", safeAddress);
// Returns: "0xDA61800A..." or null

// Write
setCachedModule("sepolia", safeAddress, "0xDA61800A...");

// Delete
clearCachedModule("sepolia", safeAddress);
```

All three functions are SSR-safe: they check `typeof window === "undefined"` before accessing `localStorage` and silently return/no-op on the server.

## Where It Is Set

The cache is written in two places:

1. **`useDeploySafe`** — after a new Safe + module are deployed together.
2. **All hooks that call `/api/safe/deploy-module`** — after the API returns a module address.

## Where It Is Read

All hooks that need the module address read from the cache first:

- `useDepositToTreasury`
- `useProposePayout`
- `useFinalizePayout`
- `usePayouts`

## Clearing the Cache

If you deploy a new module manually (e.g. via the deploy script) and need to override the cached address, call `clearCachedModule` from the browser console:

```javascript
localStorage.removeItem("safety_module:sepolia:0x81a397a3654e461a043b1dcf3591689873be2a8c");
```

Then reload the page. The app will call `/api/safe/deploy-module` and set the new address.
