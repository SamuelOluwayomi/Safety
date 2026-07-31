/**
 * request-payout-and-execute.ts
 *
 * All-in-one script:
 *   1. Encrypts the payout amount via Nox (fresh proof, no expiry risk)
 *   2. Encodes requestPayout calldata
 *   3. Gets the Safe tx hash from the chain
 *   4. Calls approveHash to pre-validate the tx
 *   5. Executes execTransaction immediately with the pre-validated sig
 *
 * Run from: contracts/
 *   pnpm hardhat run .\scripts\request-payout-and-execute.ts --network arbitrumSepolia
 */

import { createViemHandleClient } from "@iexec-nox/handle";
import { encodeFunctionData, parseUnits, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { network } from "hardhat";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running this script`);
  return v;
}

const MODULE_ADDRESS  = requireEnv("MODULE_ADDRESS")  as `0x${string}`;
const SAFE_ADDRESS    = requireEnv("SAFE_ADDRESS")    as `0x${string}`;
const RECIPIENT       = (process.env.RECIPIENT_ADDRESS ?? process.env.OWNER_ADDRESS) as `0x${string}`;
const tokenDecimals   = Number(process.env.TOKEN_DECIMALS ?? "6");
const payoutLabel     = process.env.PAYOUT_AMOUNT    ?? "5";
const payoutAmount    = parseUnits(payoutLabel, tokenDecimals);
const tokenSymbol     = process.env.TOKEN_SYMBOL     ?? "USDC";

if (!RECIPIENT?.startsWith("0x")) throw new Error("Set RECIPIENT_ADDRESS or OWNER_ADDRESS");

// ── Hardhat viem clients ──────────────────────────────────────────────
const { viem } = await network.create("arbitrumSepolia");
const [walletClient] = await viem.getWalletClients();
if (!walletClient?.account) throw new Error("No wallet — set ARBITRUM_SEPOLIA_PRIVATE_KEY in .env");
if (walletClient.chain?.id !== arbitrumSepolia.id)
  throw new Error(`Wrong chain: ${walletClient.chain?.id} ≠ ${arbitrumSepolia.id}`);

const publicClient = await viem.getPublicClient();
const signerAddress = walletClient.account.address;

console.log(`\n═══ Request Payout + Execute ════════════════════════════`);
console.log(`Signer:    ${signerAddress}`);
console.log(`Safe:      ${SAFE_ADDRESS}`);
console.log(`Module:    ${MODULE_ADDRESS}`);
console.log(`Recipient: ${RECIPIENT}`);
console.log(`Amount:    ${payoutLabel} ${tokenSymbol}`);
console.log(`════════════════════════════════════════════════════════\n`);

// Wrap walletClient so Nox sets owner = MODULE_ADDRESS in the proof
// (matching msg.sender when ConfidentialPayoutModule calls Nox.fromExternal on-chain)
const wrappedWalletClient = {
  ...walletClient,
  getAddresses: async () => [MODULE_ADDRESS],
  getAddress: async () => MODULE_ADDRESS,
  account: {
    ...walletClient.account,
    address: MODULE_ADDRESS,
  },
} as any;

console.log(`[1/5] Encrypting ${payoutLabel} ${tokenSymbol} via Nox (owner = MODULE_ADDRESS)…`);
const handleClient = await createViemHandleClient(wrappedWalletClient);
const { handle, handleProof: amountProof } = await handleClient.encryptInput(
  payoutAmount,
  "uint256",
  MODULE_ADDRESS,
);
console.log(`      handle:      ${handle}`);
console.log(`      proofLength: ${(amountProof as string).length / 2 - 1} bytes`);

// ── Step 2: Encode requestPayout calldata ─────────────────────────────
console.log(`\n[2/5] Encoding requestPayout calldata…`);
const requestPayoutData = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "requestPayout",
      stateMutability: "nonpayable",
      inputs: [
        { name: "recipient",    type: "address" },
        { name: "amountHandle", type: "bytes32" },
        { name: "amountProof",  type: "bytes"   },
      ],
      outputs: [{ name: "requestId", type: "uint256" }],
    },
  ],
  functionName: "requestPayout",
  args: [RECIPIENT, handle as Hex, amountProof as Hex],
});
console.log(`      calldata: ${requestPayoutData.slice(0, 30)}…`);

// ── Step 3: Get Safe tx hash from chain ───────────────────────────────
console.log(`\n[3/5] Fetching Safe nonce and transaction hash…`);
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
    requestPayoutData,
    0,
    0n, 0n, 0n,
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000",
    safeNonce,
  ],
} as any) as `0x${string}`;

console.log(`      Safe nonce:  ${safeNonce}`);
console.log(`      Safe txHash: ${onChainTxHash}`);

// ── Step 4: approveHash ───────────────────────────────────────────────
console.log(`\n[4/5] Calling approveHash on Safe…`);
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

// Build pre-validated signature (v = 1)
const preValidatedSig = `0x000000000000000000000000${signerAddress.slice(2).toLowerCase()}000000000000000000000000000000000000000000000000000000000000000001` as Hex;

// ── Step 5: Execute execTransaction ───────────────────────────────────
console.log(`\n[5/5] Executing Safe transaction…`);
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
}] as const;

const execData = encodeFunctionData({
  abi: execTxAbi,
  functionName: "execTransaction",
  args: [
    MODULE_ADDRESS,
    0n,
    requestPayoutData,
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
  const nextRequestId = await publicClient.readContract({
    address: MODULE_ADDRESS,
    abi: [{ name: "nextRequestId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
    functionName: "nextRequestId",
  } as any) as bigint;
  console.log(`🎉 SUCCESS! Safe tx executed.`);
  console.log(`   Tx Hash:       ${execHash}`);
  console.log(`   nextRequestId: ${nextRequestId} (payout requestId was ${nextRequestId - 1n})`);
  console.log(`\n   Next: run prepare-safe-finalize-payout.ts with REQUEST_ID=${nextRequestId - 1n}`);
} else {
  console.log(`❌ execTransaction reverted. Tx Hash: ${execHash}`);
  console.log(`   This means the inner requestPayout call still failed.`);
  console.log(`   Check logs for Nox errors.`);
}
console.log(`═══════════════════════════════════════════════════════════\n`);
