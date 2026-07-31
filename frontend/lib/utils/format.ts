import type { Address } from "viem";

export function truncateAddress(address: Address | string, chars = 4): string {
  const a = address as string;
  return `${a.slice(0, 6 + chars - 4)}…${a.slice(-chars)}`;
}

export function fmtTimestamp(iso: string): string {
  return iso.replace("T", " ").slice(0, 19) + " UTC";
}
