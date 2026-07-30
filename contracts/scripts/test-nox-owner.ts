import { createViemHandleClient } from "@iexec-nox/handle";
import { arbitrumSepolia } from "viem/chains";
import { network } from "hardhat";

const MODULE_ADDRESS = "0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4";

const { viem } = await network.create("arbitrumSepolia");
const [walletClient] = await viem.getWalletClients();

const wrappedClient = {
  ...walletClient,
  getAddresses: async () => [MODULE_ADDRESS],
  getAddress: async () => MODULE_ADDRESS,
  account: {
    ...walletClient.account,
    address: MODULE_ADDRESS,
  },
} as any;

const handleClient = await createViemHandleClient(wrappedClient);
const { handle, handleProof } = await handleClient.encryptInput(
  5000000n,
  "uint256",
  MODULE_ADDRESS
);

console.log("Encrypted successfully!");
console.log("Handle:", handle);

const proofBuf = Buffer.from((handleProof as string).slice(2), "hex");
const ownerInProof = "0x" + proofBuf.slice(0, 20).toString("hex");
const appContractInProof = "0x" + proofBuf.slice(20, 40).toString("hex");
console.log("Owner in proof:       ", ownerInProof);
console.log("Module address:       ", MODULE_ADDRESS);
console.log("App contract in proof:", appContractInProof);
console.log("Owner matches module? ", ownerInProof.toLowerCase() === MODULE_ADDRESS.toLowerCase());
