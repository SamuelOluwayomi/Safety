import { erc20Abi, formatUnits, getContract } from "viem";
import { network } from "hardhat";

function requireEnv(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value?.startsWith("0x")) {
    throw new Error(`Set ${name} before running this script`);
  }
  return value as `0x${string}`;
}

const TOKEN_ADDRESS = requireEnv("TOKEN_ADDRESS");
const OWNER_ADDRESS = requireEnv("OWNER_ADDRESS");
const SAFE_ADDRESS = requireEnv("SAFE_ADDRESS");
const MODULE_ADDRESS = requireEnv("MODULE_ADDRESS");
const tokenSymbol = process.env.TOKEN_SYMBOL ?? "TOKEN";
const tokenDecimals = Number(process.env.TOKEN_DECIMALS ?? "6");
const networkName = process.env.NETWORK ?? "arbitrumSepolia";

const { viem } = await network.create(networkName);
const publicClient = await viem.getPublicClient();

const token = getContract({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  client: { public: publicClient },
});

const [ownerBalance, safeBalance, moduleBalance] = await Promise.all([
  token.read.balanceOf([OWNER_ADDRESS]),
  token.read.balanceOf([SAFE_ADDRESS]),
  token.read.balanceOf([MODULE_ADDRESS]),
]);

console.log(`${networkName} ${tokenSymbol} balances`);
console.log("---------------------");
console.log(`Owner:  ${formatUnits(ownerBalance, tokenDecimals)} ${tokenSymbol}`);
console.log(`Safe:   ${formatUnits(safeBalance, tokenDecimals)} ${tokenSymbol}`);
console.log(`Module: ${formatUnits(moduleBalance, tokenDecimals)} ${tokenSymbol}`);
