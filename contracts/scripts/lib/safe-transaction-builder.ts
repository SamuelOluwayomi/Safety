import type { Hex } from "viem";

export type SafeTransactionBuilderJson = {
  version: "1.0";
  chainId: string;
  createdAt: number;
  meta: {
    name: string;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: Hex;
    createdFromOwnerAddress: string;
  };
  transactions: Array<{
    to: Hex;
    value: string;
    data: Hex;
    contractMethod?: {
      inputs: Array<{
        name: string;
        type: string;
        internalType: string;
      }>;
      name: string;
      payable: boolean;
    };
    contractInputsValues?: Record<string, string>;
  }>;
};

export function printSafeTransactionBuilderJson(payload: SafeTransactionBuilderJson): void {
  console.log(JSON.stringify(payload, null, 2));
}
