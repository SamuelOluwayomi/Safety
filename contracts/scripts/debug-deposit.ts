import { createPublicClient, http, formatUnits } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  const safe = "0x101a4e60f25E490248Dd1b18394fC6644cC3fcBd";
  const moduleAddress = "0xb2ac030bf7b24d51cbe1041392c9a0d669eb2f58";
  const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  const client = createPublicClient({
    chain: sepolia,
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  });

  const storedSafe = await client.readContract({
    address: moduleAddress as `0x${string}`,
    abi: [{ name: "safe", type: "function", inputs: [], outputs: [{ type: "address" }] }],
    functionName: "safe",
  } as any);

  const storedToken = await client.readContract({
    address: moduleAddress as `0x${string}`,
    abi: [{ name: "token", type: "function", inputs: [], outputs: [{ type: "address" }] }],
    functionName: "token",
  } as any);

  const safeUsdcBalance = (await client.readContract({
    address: usdcAddress as `0x${string}`,
    abi: [{ name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }],
    functionName: "balanceOf",
    args: [safe],
  } as any)) as bigint;

  const allowance = (await client.readContract({
    address: usdcAddress as `0x${string}`,
    abi: [{ name: "allowance", type: "function", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] }],
    functionName: "allowance",
    args: [safe, moduleAddress],
  } as any)) as bigint;

  console.log("\n==========================================");
  console.log("🔍 DIAGNOSTIC RESULTS:");
  console.log("==========================================");
  console.log("Module Address:                  ", moduleAddress);
  console.log("Target Safe Address:             ", safe);
  console.log("Stored Safe in Module:          ", storedSafe);
  console.log("Stored Token in Module:         ", storedToken);
  console.log("Safe USDC Balance:              ", formatUnits(safeUsdcBalance, 6), "USDC");
  console.log("USDC Allowance (Safe -> Module):", formatUnits(allowance, 6), "USDC");
  console.log("==========================================\n");

  try {
    console.log("Simulating deposit(28 USDC) call from Safe to Module via eth_call...");
    const res = await client.call({
      account: safe as `0x${string}`,
      to: moduleAddress as `0x${string}`,
      data: "0xb6b55f250000000000000000000000000000000000000000000000000000000001ab3f00", // deposit(28000000)
    });
    console.log("✅ Simulation SUCCESS! Raw output:", res);
  } catch (err: any) {
    console.error("❌ Simulation REVERTED:", err?.shortMessage || err?.message || err);
  }
}

main().catch(console.error);
