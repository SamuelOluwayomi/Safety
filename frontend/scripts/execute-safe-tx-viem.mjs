/**
 * Executes a Safe transaction directly using viem (no protocol-kit),
 * computing the EIP-712 hash manually and signing with the private key.
 *
 * This bypasses protocol-kit's signing chain entirely to rule out
 * domain separator miscomputation as the GS013 root cause.
 */
import { createWalletClient, createPublicClient, http, encodeFunctionData, hexToBigInt, keccak256, encodeAbiParameters, parseAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
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
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running this script`);
  return v;
}

const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
const privateKey = requireEnv("ARBITRUM_SEPOLIA_PRIVATE_KEY");
const safeAddress = requireEnv("SAFE_ADDRESS");
const targetAddress = process.env.TARGET_ADDRESS ?? process.env.MODULE_ADDRESS;
if (!targetAddress?.startsWith("0x")) throw new Error("Set TARGET_ADDRESS or MODULE_ADDRESS");
const txData = requireEnv("TX_DATA");

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http(rpcUrl) });

// ── Fetch live Safe nonce ──────────────────────────────────────────────
const safeNonce = await publicClient.readContract({
  address: safeAddress,
  abi: [{ name: "nonce", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
  functionName: "nonce",
});

// ── Fetch on-chain domain separator for comparison ────────────────────
const onChainDomainSep = await publicClient.readContract({
  address: safeAddress,
  abi: [{ name: "domainSeparator", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] }],
  functionName: "domainSeparator",
});

console.log(`\nSafe:          ${safeAddress}`);
console.log(`Target:        ${targetAddress}`);
console.log(`Signer:        ${account.address}`);
console.log(`Safe nonce:    ${safeNonce}`);
console.log(`Chain ID:      ${arbitrumSepolia.id}`);
console.log(`On-chain domainSeparator: ${onChainDomainSep}`);

// ── Build EIP-712 typed data exactly as Safe 1.4.1 expects ────────────
const safeTxTypedData = {
  domain: {
    chainId: BigInt(arbitrumSepolia.id),
    verifyingContract: safeAddress,
  },
  types: {
    SafeTx: [
      { name: "to",              type: "address" },
      { name: "value",           type: "uint256" },
      { name: "data",            type: "bytes"   },
      { name: "operation",       type: "uint8"   },
      { name: "safeTxGas",       type: "uint256" },
      { name: "baseGas",         type: "uint256" },
      { name: "gasPrice",        type: "uint256" },
      { name: "gasToken",        type: "address" },
      { name: "refundReceiver",  type: "address" },
      { name: "nonce",           type: "uint256" },
    ],
  },
  primaryType: "SafeTx",
  message: {
    to:             targetAddress,
    value:          0n,
    data:           txData,
    operation:      0,
    safeTxGas:      0n,
    baseGas:        0n,
    gasPrice:       0n,
    gasToken:       "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce:          safeNonce,
  },
};

// ── Call getTransactionHash on the Safe to get the exact tx hash ─────
const onChainTxHash = await publicClient.readContract({
  address: safeAddress,
  abi: [{
    name: "getTransactionHash",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "to",             type: "address" },
      { name: "value",          type: "uint256" },
      { name: "data",           type: "bytes"   },
      { name: "operation",      type: "uint8"   },
      { name: "safeTxGas",      type: "uint256" },
      { name: "baseGas",        type: "uint256" },
      { name: "gasPrice",       type: "uint256" },
      { name: "gasToken",       type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce",         type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
  }],
  functionName: "getTransactionHash",
  args: [
    targetAddress,
    0n,
    txData,
    0,
    0n, 0n, 0n,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    safeNonce,
  ],
});

console.log(`On-chain tx hash:   ${onChainTxHash}`);

// ── Call approveHash on-chain from the owner account ─────────────────
console.log(`\nApproving transaction hash on-chain via approveHash()...`);
const approveHashTx = await walletClient.writeContract({
  address: safeAddress,
  abi: [{
    name: "approveHash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "hashToApprove", type: "bytes32" }],
    outputs: [],
  }],
  functionName: "approveHash",
  args: [onChainTxHash],
});

console.log(`approveHash tx sent: ${approveHashTx}`);
const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHashTx });
console.log(`approveHash confirmed in block ${approveReceipt.blockNumber}!`);

// Build standard Safe pre-validated signature (v = 1) for owner
// Format: r = owner_address (padded to 32 bytes), s = 0 (32 bytes), v = 1 (1 byte)
const preValidatedSig = `0x000000000000000000000000${account.address.slice(2).toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001`;

console.log(`\nPre-validated signature: ${preValidatedSig}`);
console.log(`Executing execTransaction...`);

const execTxAbi = [{
  name: "execTransaction",
  type: "function",
  stateMutability: "payable",
  inputs: [
    { name: "to",             type: "address" },
    { name: "value",          type: "uint256" },
    { name: "data",           type: "bytes"   },
    { name: "operation",      type: "uint8"   },
    { name: "safeTxGas",      type: "uint256" },
    { name: "baseGas",        type: "uint256" },
    { name: "gasPrice",       type: "uint256" },
    { name: "gasToken",       type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "signatures",     type: "bytes"   },
  ],
  outputs: [{ name: "success", type: "bool" }],
}];

console.log(`\nEncoding execTransaction calldata...`);
const execTxData = encodeFunctionData({
  abi: execTxAbi,
  functionName: "execTransaction",
  args: [
    targetAddress,
    0n,
    txData,
    0,
    0n, 0n, 0n,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    preValidatedSig,
  ],
});

console.log(`Submitting raw transaction (gas limit: 1,000,000)...`);
const execHash = await walletClient.sendTransaction({
  to: safeAddress,
  data: execTxData,
  gas: 1000000n,
});

console.log(`Transaction submitted! Hash: ${execHash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash: execHash });
console.log(`\n🎉 Safe Transaction Execution Completed!`);
console.log(`Tx Hash: ${execHash}`);
console.log(`Status:  ${receipt.status === 'success' ? 'SUCCESS ✅' : 'FAILED ❌ (Reverted)'}`);


