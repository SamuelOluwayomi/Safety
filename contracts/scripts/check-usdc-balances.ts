import { erc20Abi, formatUnits, getContract } from "viem";
import { network } from "hardhat";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const OWNER_ADDRESS = "0xA3AEfB2adB03Bcf57033A0C4376361696Ab71517";
const SAFE_ADDRESS = "0x81A397a3654e461A043B1DCf3591689873Be2a8C";
const MODULE_ADDRESS = "0xDA61800A39739E1E32860dB58ecA7764bd5209eB";

const { viem } = await network.create("sepolia");
const publicClient = await viem.getPublicClient();

const usdc = getContract({
  address: USDC_ADDRESS,
  abi: erc20Abi,
  client: { public: publicClient },
});

const [ownerBalance, safeBalance, moduleBalance] = await Promise.all([
  usdc.read.balanceOf([OWNER_ADDRESS]),
  usdc.read.balanceOf([SAFE_ADDRESS]),
  usdc.read.balanceOf([MODULE_ADDRESS]),
]);

console.log("Sepolia USDC balances");
console.log("---------------------");
console.log(`Owner:  ${formatUnits(ownerBalance, 6)} USDC`);
console.log(`Safe:   ${formatUnits(safeBalance, 6)} USDC`);
console.log(`Module: ${formatUnits(moduleBalance, 6)} USDC`);
