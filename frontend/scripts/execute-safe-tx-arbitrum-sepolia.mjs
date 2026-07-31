import Safe from "@safe-global/protocol-kit";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(path) {
  const envPath = resolve(process.cwd(), path);
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match || match[1].startsWith("#")) continue;

    const [, key, rawValue = ""] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
}

loadDotEnv(".env");
loadDotEnv("../contracts/.env");

function requireEnv(name) {
  const value = process.env[name];
  if (!value?.startsWith("0x")) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value;
}

const provider =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
const signer = requireEnv("ARBITRUM_SEPOLIA_PRIVATE_KEY");
const safeAddress = requireEnv("SAFE_ADDRESS");
const targetAddress = process.env.TARGET_ADDRESS ?? process.env.MODULE_ADDRESS;
if (!targetAddress?.startsWith("0x")) {
  throw new Error("Set TARGET_ADDRESS or MODULE_ADDRESS before running this script");
}

const txData = requireEnv("TX_DATA");

console.log(`\nExecuting Safe transaction on Arbitrum Sepolia...`);
console.log(`Safe:   ${safeAddress}`);
console.log(`Target: ${targetAddress}`);
console.log(`Data:   ${txData.slice(0, 10)}... (${(txData.length - 2) / 2} bytes)`);

const protocolKit = await Safe.init({
  provider,
  signer,
  safeAddress,
});

const safeNonce = await protocolKit.getNonce();
const safeVersion = protocolKit.getContractVersion();
const owners = await protocolKit.getOwners();

console.log(`\nSafe version: ${safeVersion}`);
console.log(`Safe nonce:   ${safeNonce}`);
console.log(`Safe owners:  ${owners.join(", ")}`);
console.log(`\nCreating transaction with nonce ${safeNonce}...`);

const safeTransaction = await protocolKit.createTransaction({
  transactions: [
    {
      to: targetAddress,
      value: "0",
      data: txData,
    },
  ],
  options: { nonce: safeNonce },
});

const txHash = await protocolKit.getTransactionHash(safeTransaction);
console.log(`Safe tx hash: ${txHash}`);
console.log(`Signing and executing...`);

const signedSafeTransaction = await protocolKit.signTransaction(safeTransaction);
const result = await protocolKit.executeTransaction(signedSafeTransaction);

console.log(`\nSuccessfully executed Safe transaction!`);
console.log("Tx Hash:", result.hash);

