/**
 * Client-side localStorage cache for deployed module addresses.
 *
 * Key: `module:<networkKey>:<safeAddress (lower)>`
 * Value: checksummed module address string
 *
 * This survives Next.js hot-reloads and page refreshes, unlike the
 * in-memory server-side Map which resets on every restart.
 */

const prefix = "safety_module";

function storageKey(networkKey: string, safeAddress: string): string {
  return `${prefix}:${networkKey}:${safeAddress.toLowerCase()}`;
}

export function getCachedModule(networkKey: string, safeAddress: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(storageKey(networkKey, safeAddress));
  } catch {
    return null;
  }
}

export function setCachedModule(
  networkKey: string,
  safeAddress: string,
  moduleAddress: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(networkKey, safeAddress), moduleAddress);
  } catch {
    /* ignore QuotaExceededError etc. */
  }
}

export function clearCachedModule(networkKey: string, safeAddress: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(networkKey, safeAddress));
  } catch {
    /* noop */
  }
}
