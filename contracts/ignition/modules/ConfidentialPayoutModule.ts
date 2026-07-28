import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ConfidentialPayoutModule", (m) => {
  const tokenAddress = m.getParameter(
    "tokenAddress",
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  );
  const safeAddress = m.getParameter("safeAddress");

  const payoutModule = m.contract("ConfidentialPayoutModule", [
    tokenAddress,
    safeAddress,
  ]);

  return { payoutModule };
});
