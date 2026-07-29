import { encodeFunctionData, parseUnits } from "viem";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const SAFE_ADDRESS = "0x81A397a3654e461A043B1DCf3591689873Be2a8C";
const MODULE_ADDRESS = "0xDA61800A39739E1E32860dB58ecA7764bd5209eB";

const amountLabel = process.env.DEPOSIT_USDC ?? "1";
const amount = parseUnits(amountLabel, 6);

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
  chainId: "11155111",
  createdAt: Date.now(),
  meta: {
    name: `Safety deposit ${amountLabel} USDC`,
    description:
      "Approve ConfidentialPayoutModule to spend Safe-held USDC, then deposit into encrypted treasury balance.",
    txBuilderVersion: "1.18.0",
    createdFromSafeAddress: SAFE_ADDRESS,
    createdFromOwnerAddress: "",
  },
  transactions: [
    {
      to: USDC_ADDRESS,
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
