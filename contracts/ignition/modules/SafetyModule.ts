import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SafetyModule", (m) => {
  // 1. Deploy Mock USDC token
  const mockUsdc = m.contract("MockERC20", ["Mock USDC", "mUSDC"]);

  // 2. Deploy ERC7984 Confidential Wrapper for Mock USDC
  const wrapper = m.contract("ERC7984ERC20Wrapper", [
    mockUsdc,
    "Confidential USDC",
    "cUSDC",
  ]);

  // 3. Deploy Confidential Payout Module (configured with a default Safe address parameter)
  const safeAddress = m.getParameter("safeAddress", "0x0000000000000000000000000000000000000001");
  const payoutModule = m.contract("ConfidentialPayoutModule", [
    mockUsdc,
    safeAddress,
  ]);

  return { mockUsdc, wrapper, payoutModule };
});
