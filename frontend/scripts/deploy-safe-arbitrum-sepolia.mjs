import Safe from "@safe-global/protocol-kit";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { arbitrumSepolia } from "viem/chains";

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
  if (!value) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value;
}

const provider =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
const signer = requireEnv("ARBITRUM_SEPOLIA_PRIVATE_KEY");
const owner = requireEnv("OWNER_ADDRESS");

const protocolKit = await Safe.init({
  provider,
  signer,
  predictedSafe: {
    safeAccountConfig: {
      owners: [owner],
      threshold: 1,
    },
  },
});

const safeAddress = await protocolKit.getAddress();
const isSafeDeployed = await protocolKit.isSafeDeployed();

console.log("Predicted Safe:", safeAddress);

if (isSafeDeployed) {
  console.log("Safe is already deployed.");
  process.exit(0);
}

const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
const client = await protocolKit.getSafeProvider().getExternalSigner();

if (!client) {
  throw new Error("Protocol Kit did not return an external signer");
}

const hash = await client.sendTransaction({
  to: deploymentTransaction.to,
  value: BigInt(deploymentTransaction.value),
  data: deploymentTransaction.data,
  chain: arbitrumSepolia,
});

console.log("Deployment tx:", hash);
console.log("Deployed Safe:", safeAddress);
