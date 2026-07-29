import { encodeFunctionData, parseUnits } from "viem";

function requireEnv(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value?.startsWith("0x")) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value as `0x${string}`;
}

const TOKEN_ADDRESS = requireEnv("TOKEN_ADDRESS");
const SAFE_ADDRESS = requireEnv("SAFE_ADDRESS");
const MODULE_ADDRESS = requireEnv("MODULE_ADDRESS");
const chainId = process.env.CHAIN_ID ?? "421614";
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
  args: [MODULE_ADDRESS, amount],
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

const transactionBuilderJson = {
  version: "1.0",
  chainId,
  createdAt: Date.now(),
  meta: {
    name: `Safety deposit ${amountLabel} ${tokenSymbol}`,
    description:
      `Approve ConfidentialPayoutModule to spend Safe-held ${tokenSymbol}, then deposit into encrypted treasury balance.`,
    txBuilderVersion: "1.18.0",
    createdFromSafeAddress: SAFE_ADDRESS,
    createdFromOwnerAddress: "",
  },
  transactions: [
    {
      to: TOKEN_ADDRESS,
      value: "0",
      data: approveData,
      contractMethod: {
        inputs: [
          { name: "spender", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
        ],
        name: "approve",
        payable: false,
      },
      contractInputsValues: {
        spender: MODULE_ADDRESS,
        amount: amount.toString(),
      },
    },
    {
      to: MODULE_ADDRESS,
      value: "0",
      data: depositData,
      contractMethod: {
        inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
        name: "deposit",
        payable: false,
      },
      contractInputsValues: {
        amount: amount.toString(),
      },
    },
  ],
};

console.log(JSON.stringify(transactionBuilderJson, null, 2));
