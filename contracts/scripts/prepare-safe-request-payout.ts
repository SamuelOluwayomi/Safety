import { createViemHandleClient } from "@iexec-nox/handle";
import { encodeFunctionData, parseUnits, type Hex } from "viem";
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
const RECIPIENT = requireEnv("RECIPIENT_ADDRESS");
const chainId = process.env.CHAIN_ID ?? "421614";
const tokenDecimals = Number(process.env.TOKEN_DECIMALS ?? "6");
const payoutLabel = process.env.PAYOUT_AMOUNT ?? "5";
const payoutAmount = parseUnits(payoutLabel, tokenDecimals);
const networkName = process.env.NETWORK ?? "arbitrumSepolia";
const tokenSymbol = process.env.TOKEN_SYMBOL ?? "USDC";

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

console.log(`Encrypting ${payoutLabel} ${tokenSymbol} for requestPayout…`);
console.log(`Signer: ${walletClient.account.address}`);
console.log(`Module: ${MODULE_ADDRESS}`);

const wrappedWalletClient = {
  ...walletClient,
  getAddresses: async () => [MODULE_ADDRESS],
  getAddress: async () => MODULE_ADDRESS,
  account: {
    ...walletClient.account,
    address: MODULE_ADDRESS,
  },
} as any;

const handleClient = await createViemHandleClient(wrappedWalletClient);
const { handle, handleProof: amountProof } = await handleClient.encryptInput(
  payoutAmount,
  "uint256",
  MODULE_ADDRESS,
);

const requestPayoutData = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "requestPayout",
      stateMutability: "nonpayable",
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amountHandle", type: "bytes32" },
        { name: "amountProof", type: "bytes" },
      ],
      outputs: [{ name: "requestId", type: "uint256" }],
    },
  ],
  functionName: "requestPayout",
  args: [RECIPIENT, handle as Hex, amountProof as Hex],
});

const publicClient = await viem.getPublicClient();
const nextRequestId = (await publicClient.readContract({
  address: MODULE_ADDRESS,
  abi: [
    {
      type: "function",
      name: "nextRequestId",
      inputs: [],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
  ] as const,
  functionName: "nextRequestId",
} as any)) as bigint;

const transactionBuilderJson: SafeTransactionBuilderJson = {
  version: "1.0",
  chainId,
  createdAt: Date.now(),
  meta: {
    name: `Safety requestPayout ${payoutLabel} ${tokenSymbol}`,
    description:
      "Confidential payout request. Amount is encrypted via iExec Nox; only the module call appears on-chain until finalize.",
    txBuilderVersion: "1.18.0",
    createdFromSafeAddress: SAFE_ADDRESS,
    createdFromOwnerAddress: walletClient.account.address,
  },
  transactions: [
    {
      to: MODULE_ADDRESS,
      value: "0",
      data: requestPayoutData,
      contractMethod: {
        inputs: [
          { name: "recipient", type: "address", internalType: "address" },
          { name: "amountHandle", type: "bytes32", internalType: "externalEuint256" },
          { name: "amountProof", type: "bytes", internalType: "bytes" },
        ],
        name: "requestPayout",
        payable: false,
      },
      contractInputsValues: {
        recipient: RECIPIENT,
        amountHandle: handle as string,
        amountProof: amountProof as string,
      },
    },
  ],
};

console.log("\n--- Raw Calldata for Safe Transaction ---");
console.log(requestPayoutData);
console.log("\n--- Expected requestId (if this is the next payout) ---");
console.log(nextRequestId.toString());
console.log("\n--- Safe Transaction Builder JSON ---\n");

printSafeTransactionBuilderJson(transactionBuilderJson);

console.log("\n--- Next step ---");
console.log(
  "Execute this single transaction through your 1/1 Safe, then run prepare-safe-finalize-payout.ts with REQUEST_ID set.",
);
