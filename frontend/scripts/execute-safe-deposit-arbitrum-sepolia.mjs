import Safe from "@safe-global/protocol-kit";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodeFunctionData, parseUnits } from "viem";

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
const tokenAddress = requireEnv("TOKEN_ADDRESS");
const moduleAddress = requireEnv("MODULE_ADDRESS");
const tokenSymbol = process.env.TOKEN_SYMBOL ?? "TOKEN";
const tokenDecimals = Number(process.env.TOKEN_DECIMALS ?? "6");
const amountLabel = process.env.DEPOSIT_AMOUNT ?? "1";
const amount = parseUnits(amountLabel, tokenDecimals);

const approveData = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "approve",
      stateMutability: "nonpayable",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
  ],
  functionName: "approve",
  args: [moduleAddress, amount],
});

const depositData = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "deposit",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
  ],
  functionName: "deposit",
  args: [amount],
});

const protocolKit = await Safe.init({
  provider,
  signer,
  safeAddress,
});

const safeTransaction = await protocolKit.createTransaction({
  transactions: [
    {
      to: tokenAddress,
      value: "0",
      data: approveData,
    },
    {
      to: moduleAddress,
      value: "0",
      data: depositData,
    },
  ],
});

const signedSafeTransaction = await protocolKit.signTransaction(safeTransaction);
const result = await protocolKit.executeTransaction(signedSafeTransaction);

console.log(`Executed Safe deposit for ${amountLabel} ${tokenSymbol}`);
console.log("Result:", result);
