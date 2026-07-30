import { createViemHandleClient } from "@iexec-nox/handle";
import { encodeFunctionData, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { network } from "hardhat";

import {
  printSafeTransactionBuilderJson,
  type SafeTransactionBuilderJson,
} from "./lib/safe-transaction-builder.js";

function requireEnv(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value?.startsWith("0x")) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value as `0x${string}`;
}

const MODULE_ADDRESS = requireEnv("MODULE_ADDRESS");
const SAFE_ADDRESS = requireEnv("SAFE_ADDRESS");
const requestId = BigInt(process.env.REQUEST_ID ?? "0");
const chainId = process.env.CHAIN_ID ?? "421614";
const networkName = process.env.NETWORK ?? "arbitrumSepolia";

const { viem } = await network.create(networkName);
const [walletClient] = await viem.getWalletClients();

if (!walletClient?.account) {
  throw new Error(
    `No wallet on ${networkName}. Set ARBITRUM_SEPOLIA_PRIVATE_KEY in contracts/.env`,
  );
}

if (walletClient.chain?.id !== arbitrumSepolia.id) {
  throw new Error(
    `Wallet chain ${walletClient.chain?.id} != Arbitrum Sepolia (${arbitrumSepolia.id}). Check hardhat network config.`,
  );
}

const publicClient = await viem.getPublicClient();

const payout = (await publicClient.readContract({
  address: MODULE_ADDRESS,
  abi: [
    {
      type: "function",
      name: "pendingPayouts",
      inputs: [{ name: "requestId", type: "uint256" }],
      outputs: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "bytes32" },
        { name: "debitSuccess", type: "bytes32" },
        { name: "finalized", type: "bool" },
      ],
      stateMutability: "view",
    },
  ] as const,
  functionName: "pendingPayouts",
  args: [requestId],
} as any)) as [string, `0x${string}`, `0x${string}`, boolean];

const [recipient, amountHandle, debitSuccessHandle, finalized] = payout;

if (finalized) {
  throw new Error(`Request #${requestId} is already finalized.`);
}

console.log(`Generating public decryption proofs for payout request #${requestId}…`);
console.log(`Recipient: ${recipient}`);
console.log(`Amount handle: ${amountHandle}`);
console.log(`Debit success handle: ${debitSuccessHandle}`);

const handleClient = await createViemHandleClient(walletClient);

const amountDecryption = await handleClient.publicDecrypt(amountHandle);
const debitSuccessDecryption = await handleClient.publicDecrypt(debitSuccessHandle);

const finalizePayoutData = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "finalizePayout",
      stateMutability: "nonpayable",
      inputs: [
        { name: "requestId", type: "uint256" },
        { name: "amountDecryptionProof", type: "bytes" },
        { name: "debitSuccessDecryptionProof", type: "bytes" },
      ],
      outputs: [],
    },
  ] as const,
  functionName: "finalizePayout",
  args: [
    requestId,
    amountDecryption.decryptionProof as Hex,
    debitSuccessDecryption.decryptionProof as Hex,
  ],
});

const transactionBuilderJson: SafeTransactionBuilderJson = {
  version: "1.0",
  chainId,
  createdAt: Date.now(),
  meta: {
    name: `Safety finalizePayout request #${requestId}`,
    description:
      "Finalizes confidential payout request by revealing public decryption proofs and transferring ERC-20 tokens.",
    txBuilderVersion: "1.18.0",
    createdFromSafeAddress: SAFE_ADDRESS,
    createdFromOwnerAddress: walletClient.account.address,
  },
  transactions: [
    {
      to: MODULE_ADDRESS,
      value: "0",
      data: finalizePayoutData,
      contractMethod: {
        inputs: [
          { name: "requestId", type: "uint256", internalType: "uint256" },
          { name: "amountDecryptionProof", type: "bytes", internalType: "bytes" },
          { name: "debitSuccessDecryptionProof", type: "bytes", internalType: "bytes" },
        ],
        name: "finalizePayout",
        payable: false,
      },
      contractInputsValues: {
        requestId: requestId.toString(),
        amountDecryptionProof: amountDecryption.decryptionProof,
        debitSuccessDecryptionProof: debitSuccessDecryption.decryptionProof,
      },
    },
  ],
};

console.log("\n--- Raw Calldata for Safe Transaction ---");
console.log(finalizePayoutData);
console.log("\n--- Safe Transaction Builder JSON ---\n");
printSafeTransactionBuilderJson(transactionBuilderJson);
