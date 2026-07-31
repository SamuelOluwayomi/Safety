/**
 * finalize-payout-and-execute.ts
 *
 * All-in-one script:
 *   1. Reads pending payout from on-chain (handles for amount + debitSuccess)
 *   2. Fetches public decryption proofs from Nox
 *   3. Encodes finalizePayout calldata
 *   4. Approves the Safe tx hash
 *   5. Executes execTransaction immediately
 *
 * Run from: contracts/
 *   pnpm hardhat run .\scripts\finalize-payout-and-execute.ts --network arbitrumSepolia
 */

import { createViemHandleClient } from "@iexec-nox/handle";
import { encodeFunctionData, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { network } from "hardhat";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running this script`);
  return v;
}

const MODULE_ADDRESS = requireEnv("MODULE_ADDRESS") as `0x${string}`;
const SAFE_ADDRESS   = requireEnv("SAFE_ADDRESS")   as `0x${string}`;
const REQUEST_ID     = BigInt(process.env.REQUEST_ID ?? "0");

// ── Hardhat viem clients ──────────────────────────────────────────────
const networkName = process.env.NETWORK ?? "arbitrumSepolia";
const { viem } = await network.create(networkName);
const [walletClient] = await viem.getWalletClients();
if (!walletClient?.account) throw new Error(`No wallet — set private key for ${networkName} in .env`);

const publicClient = await viem.getPublicClient();
const signerAddress = walletClient.account.address;

console.log(`\n═══ Finalize Payout + Execute ═══════════════════════════`);
console.log(`Signer:     ${signerAddress}`);
console.log(`Safe:       ${SAFE_ADDRESS}`);
console.log(`Module:     ${MODULE_ADDRESS}`);
console.log(`Request ID: ${REQUEST_ID}`);
console.log(`════════════════════════════════════════════════════════\n`);

// ── Step 1: Read pending payout from chain ────────────────────────────
console.log(`[1/5] Reading pending payout #${REQUEST_ID} from chain…`);
const payout = (await publicClient.readContract({
  address: MODULE_ADDRESS,
  abi: [{
    type: "function",
    name: "pendingPayouts",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "recipient",      type: "address" },
      { name: "amount",         type: "bytes32" },
      { name: "debitSuccess",   type: "bytes32" },
      { name: "finalized",      type: "bool"    },
    ],
    stateMutability: "view",
  }],
  functionName: "pendingPayouts",
  args: [REQUEST_ID],
} as any)) as [string, `0x${string}`, `0x${string}`, boolean];

const [recipient, amountHandle, debitSuccessHandle, finalized] = payout;

if (finalized) throw new Error(`Request #${REQUEST_ID} is already finalized.`);

console.log(`      recipient:          ${recipient}`);
console.log(`      amountHandle:       ${amountHandle}`);
console.log(`      debitSuccessHandle: ${debitSuccessHandle}`);

// ── Step 2: Fetch public decryption proofs from Nox ───────────────────
console.log(`\n[2/5] Fetching public decryption proofs from Nox…`);
const handleClient = await createViemHandleClient(walletClient);
const amountDecryption       = await handleClient.publicDecrypt(amountHandle);
const debitSuccessDecryption = await handleClient.publicDecrypt(debitSuccessHandle);

console.log(`      amount (decrypted):       ${amountDecryption.value}`);
console.log(`      debitSuccess (decrypted): ${debitSuccessDecryption.value}`);

// ── Step 3: Encode finalizePayout calldata ─────────────────────────────
console.log(`\n[3/5] Encoding finalizePayout calldata…`);
const finalizePayoutData = encodeFunctionData({
  abi: [{
    type: "function",
    name: "finalizePayout",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId",                type: "uint256" },
      { name: "amountDecryptionProof",    type: "bytes"   },
      { name: "debitSuccessDecryptionProof", type: "bytes" },
    ],
    outputs: [],
  }],
  functionName: "finalizePayout",
  args: [
    REQUEST_ID,
    amountDecryption.decryptionProof as Hex,
    debitSuccessDecryption.decryptionProof as Hex,
  ],
});
console.log(`      calldata: ${finalizePayoutData.slice(0, 30)}…`);

// ── Step 4: Get Safe nonce and tx hash, then approveHash ──────────────
console.log(`\n[4/5] Approving Safe transaction hash…`);
const safeNonce = await publicClient.readContract({
  address: SAFE_ADDRESS,
  abi: [{ name: "nonce", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
  functionName: "nonce",
} as any) as bigint;

const onChainTxHash = await publicClient.readContract({
  address: SAFE_ADDRESS,
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
    MODULE_ADDRESS,
    0n,
    finalizePayoutData,
    0,
    0n, 0n, 0n,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    safeNonce,
  ],
} as any) as `0x${string}`;

console.log(`      Safe nonce:  ${safeNonce}`);
console.log(`      Safe txHash: ${onChainTxHash}`);

const approveHashTx = await walletClient.writeContract({
  address: SAFE_ADDRESS,
  abi: [{
    name: "approveHash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "hashToApprove", type: "bytes32" }],
    outputs: [],
  }],
  functionName: "approveHash",
  args: [onChainTxHash],
} as any) as `0x${string}`;

const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHashTx });
console.log(`      approveHash tx: ${approveHashTx}`);
console.log(`      Confirmed in block ${approveReceipt.blockNumber}`);

const preValidatedSig = `0x000000000000000000000000${signerAddress.slice(2).toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001` as Hex;

// ── Step 5: Execute execTransaction ───────────────────────────────────
console.log(`\n[5/5] Executing Safe transaction…`);
const execData = encodeFunctionData({
  abi: [{
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
  }] as const,
  functionName: "execTransaction",
  args: [
    MODULE_ADDRESS,
    0n,
    finalizePayoutData,
    0,
    0n, 0n, 0n,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    preValidatedSig,
  ],
});

const execHash = await walletClient.sendTransaction({
  to: SAFE_ADDRESS,
  data: execData,
  gas: 1000000n,
} as any) as `0x${string}`;

const receipt = await publicClient.waitForTransactionReceipt({ hash: execHash });

console.log(`\n═══════════════════════════════════════════════════════════`);
if (receipt.status === "success") {
  console.log(`🎉 SUCCESS! finalizePayout executed on-chain.`);
  console.log(`   Tx Hash:    ${execHash}`);
  console.log(`   Request #${REQUEST_ID} is now finalized.`);
  console.log(`\n   Recipient ${recipient} should have received the USDC transfer.`);
} else {
  console.log(`❌ execTransaction reverted. Tx Hash: ${execHash}`);
  console.log(`   This means the inner finalizePayout call failed.`);
}
console.log(`═══════════════════════════════════════════════════════════\n`);
