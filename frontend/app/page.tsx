"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeClosed,
  Key,
  ArrowRight,
  CheckCircle,
  FileCode,
  CurrencyCircleDollar,
  Cpu,
  Buildings,
  UserCheck,
  Lightning,
  ArrowsMerge,
  CaretDown,
  CaretUp,
  Globe,
} from "@phosphor-icons/react";

export default function Home() {
  const [activeDiffTab, setActiveDiffTab] = useState<"standard" | "safety">("safety");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ── 1. HERO SECTION ── */}
      <section className="w-full border-document-b py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Hero Copy */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 border-document px-3 py-1 bg-paper text-accent-red font-mono text-xs uppercase tracking-widest">
                <ShieldCheck size={14} />
                <span>EXHIBIT A // CONFIDENTIAL TREASURY LAYER</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal leading-[1.05]">
                Public Safe. <br />
                <span className="italic font-normal text-accent-red">
                  Private
                </span>{" "}
                payouts.
              </h1>
              <p className="font-sans text-base sm:text-lg text-charcoal/80 max-w-xl leading-relaxed">
                Safety adds an encrypted payout layer to your Safe multisig smart account. Signers approve transactions using native Safe multisig workflows, while transfer amounts stay sealed on-chain via iExec Nox TEE enclaves.
              </p>
            </div>

            {/* CTAs & Metrics */}
            <div className="space-y-8 pt-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-3 px-6 py-3.5 border-document bg-charcoal text-cream font-mono text-xs uppercase tracking-widest hover:bg-accent-red transition-colors shadow-sm"
                >
                  <span>Open Treasury Console</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#deep-dive"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 border-document bg-transparent text-charcoal font-mono text-xs uppercase tracking-widest hover:bg-paper transition-colors text-center"
                >
                  <FileCode size={16} />
                  <span>Read Architecture Specs</span>
                </a>
              </div>

              {/* Technical Metrics Bar */}
              <div className="grid grid-cols-3 border-document bg-paper p-4 text-center divide-x divide-charcoal font-mono">
                <div>
                  <div className="text-xl sm:text-2xl font-bold">100%</div>
                  <div className="text-[10px] uppercase text-charcoal/60">
                    Safe Plugin Native
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-accent-red">
                    TEE
                  </div>
                  <div className="text-[10px] uppercase text-charcoal/60">
                    iExec Nox Enclave
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold">DUAL</div>
                  <div className="text-[10px] uppercase text-charcoal/60">
                    Arb &amp; Eth Sepolia
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Card */}
          <div className="lg:col-span-5 border-document bg-paper p-6 flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between border-document-b pb-3 font-mono text-xs uppercase tracking-wider text-charcoal/70">
              <span>PAYOUT ATTRIBUTES LOG</span>
              <span className="text-accent-red font-bold">LIVE PREVIEW</span>
            </div>

            <div className="space-y-4">
              {/* Card 1: Standard On-Chain View */}
              <div className="border-document bg-cream p-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-charcoal/60">
                  <span>Standard Safe Execution (Public)</span>
                  <span className="text-accent-red font-bold">Unencrypted</span>
                </div>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Recipient:</span>
                    <span className="font-bold">0x7a81...4b21</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Public Amount:</span>
                    <span className="font-bold text-accent-red">
                      $50,000.00 USDC
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Safety Confidential Module View */}
              <div className="border-document bg-charcoal text-cream p-4 space-y-2 relative">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-cream/70">
                  <span className="flex items-center gap-1.5">
                    <Lock size={12} className="text-accent-red" />
                    <span>Safety Module Execution</span>
                  </span>
                  <span className="text-emerald-400 font-bold">Encrypted on Nox</span>
                </div>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-cream/70">Recipient:</span>
                    <span>0x7a81...4b21</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cream/70">Amount:</span>
                    <span className="px-2 py-0.5 bg-accent-red text-cream redacted-bar font-mono tracking-widest text-xs">
                      [REDACTED]
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="font-mono text-[11px] text-charcoal/70 border-document-t pt-3 flex items-start gap-2">
              <EyeClosed size={16} className="text-accent-red shrink-0 mt-0.5" />
              <span>
                Only the intended recipient and authorized auditors holding valid ACL keys can decrypt the settlement inside the TEE enclave.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT SAFE & THE PRIVACY PARADOX ── */}
      <section className="w-full border-document-b bg-paper py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-document-b pb-12">
            <div className="lg:col-span-6 space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-accent-red">
                UNDERSTANDING THE PROBLEM // SAFE TREASURIES
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
                What is Safe, and why does it need confidentiality?
              </h2>
              <p className="font-sans text-base text-charcoal/80 leading-relaxed">
                <strong>Safe (formerly Gnosis Safe)</strong> is the industry standard multi-signature smart contract wallet on Ethereum and EVM chains. It manages over <strong>$100 Billion</strong> in crypto assets for DAOs, Web3 startups, and institutional treasuries.
              </p>
              <p className="font-sans text-base text-charcoal/80 leading-relaxed">
                Safe uses <em>threshold approvals</em> (e.g. 2 of 3 signers must approve a transaction before it executes). However, because EVM blockchains are entirely public:
              </p>
            </div>
            <div className="lg:col-span-6 border-document bg-cream p-6 sm:p-8 space-y-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent-red font-bold">
                The Public Ledger Paradox
              </h3>
              <ul className="space-y-4 font-sans text-sm text-charcoal/80">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div>
                    <strong>Exposed Contractor Payroll:</strong> Every team member, contractor, and executive salary paid by a DAO is visible to competitors and bad actors on block explorers.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div>
                    <strong>Leaked Business Deals:</strong> Mergers, acquisition payouts, vendor agreements, and strategic investments leak confidential deal terms on-chain.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div>
                    <strong>Front-running &amp; Targeted Exploits:</strong> Public pending transactions allow front-running bots and attackers to inspect transaction amounts in real time.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* How Safety adds Privacy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-document bg-cream p-6 space-y-3">
              <div className="w-10 h-10 border-document bg-charcoal text-cream flex items-center justify-center font-mono">
                <Buildings size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold">Zero Protocol Forks</h3>
              <p className="font-sans text-sm text-charcoal/75 leading-relaxed">
                Safety operates as a standard <strong>Safe Module plugin</strong>. Organizations keep their audited Safe smart contracts intact without deploying risky core forks.
              </p>
            </div>

            <div className="border-document bg-cream p-6 space-y-3">
              <div className="w-10 h-10 border-document bg-accent-red text-cream flex items-center justify-center font-mono">
                <Cpu size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold">iExec Nox TEE Enclaves</h3>
              <p className="font-sans text-sm text-charcoal/75 leading-relaxed">
                Amounts are processed inside hardware-isolated <strong>Trusted Execution Environments (TEEs)</strong>. The raw values are never revealed to RPC nodes or public logs.
              </p>
            </div>

            <div className="border-document bg-cream p-6 space-y-3">
              <div className="w-10 h-10 border-document bg-charcoal text-cream flex items-center justify-center font-mono">
                <UserCheck size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold">Granular ACL Controls</h3>
              <p className="font-sans text-sm text-charcoal/75 leading-relaxed">
                Recipients receive automatic decrypt permission upon settlement. Safe signers can grant explicit view access to auditors without public disclosure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. END-TO-END SYSTEM WORKFLOW & DIAGRAM ── */}
      <section id="architecture" className="w-full border-document-b bg-cream py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-2 border-document-b pb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-accent-red">
              EXHIBIT B // END-TO-END ARCHITECTURE &amp; FLOW DIAGRAM
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
              How a Confidential Payout Moves Through Safety
            </h2>
            <p className="font-sans text-sm text-charcoal/70 max-w-2xl">
              An end-to-end breakdown of how client-side encryption, Safe multisig approvals, on-chain Nox verification, and JIT unwrapping interact.
            </p>
          </div>

          {/* VISUAL ARCHITECTURE SEQUENCE DIAGRAM */}
          <div className="border-document bg-paper p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-document-b pb-4 gap-2 font-mono text-xs uppercase tracking-wider text-charcoal/70">
              <span>PROTOCOL SEQUENCE FLOW</span>
              <span className="text-accent-red font-bold">CLIENT → NOX TEE → SAFE MODULE → RECIPIENT</span>
            </div>

            {/* Step Cards Stack */}
            <div className="space-y-6 font-mono text-xs">
              {/* Step 1 */}
              <div className="border-document bg-cream p-5 space-y-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-document-b pb-2">
                  <div className="font-bold text-accent-red flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-accent-red text-cream flex items-center justify-center text-xs font-bold">1</span>
                    <span>CLIENT BROWSER</span>
                  </div>
                  <span className="text-[10px] bg-paper px-2 py-0.5 border border-charcoal/15 text-charcoal/60 uppercase">
                    Off-chain Nox SDK
                  </span>
                </div>
                <p className="text-charcoal/85 text-xs sm:text-sm pt-1 leading-relaxed">
                  Proposer inputs payout amount (e.g. 5,000 USDC) and Recipient address in the UI, then executes{" "}
                  <code className="bg-paper px-2 py-0.5 border border-charcoal/20 font-bold text-accent-red">
                    handleClient.encryptInput()
                  </code>.
                </p>
              </div>

              {/* Connector 1 */}
              <div className="flex items-center justify-center font-mono text-xs text-accent-red py-1">
                <div className="border-document bg-cream px-4 py-1.5 flex items-center gap-2 shadow-xs text-[11px]">
                  <span>↓</span>
                  <span>Generates encrypted <strong>amountHandle</strong> + <strong>amountProof</strong> (bound to Safe address)</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-document bg-charcoal text-cream p-5 space-y-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-document-b border-cream/20 pb-2">
                  <div className="font-bold text-cream flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-accent-red text-cream flex items-center justify-center text-xs font-bold">2</span>
                    <span>SAFE MULTISIG APPROVAL</span>
                  </div>
                  <span className="text-[10px] bg-cream/10 px-2 py-0.5 border border-cream/20 text-cream/70 uppercase">
                    Safe 1.4.1 Multisig
                  </span>
                </div>
                <p className="text-cream/90 text-xs sm:text-sm pt-1 leading-relaxed">
                  Signers review transaction details (memo &amp; recipient) and approve the Safe transaction hash via{" "}
                  <code className="bg-cream/15 px-2 py-0.5 border border-cream/30 font-bold text-emerald-300">
                    approveHash()
                  </code>{" "}
                  &amp;{" "}
                  <code className="bg-cream/15 px-2 py-0.5 border border-cream/30 font-bold text-emerald-300">
                    execTransaction()
                  </code>.
                </p>
              </div>

              {/* Connector 2 */}
              <div className="flex items-center justify-center font-mono text-xs text-accent-red py-1">
                <div className="border-document bg-cream px-4 py-1.5 flex items-center gap-2 shadow-xs text-[11px]">
                  <span>↓</span>
                  <span>Invokes ConfidentialPayoutModule.requestPayout(recipient, handle, proof)</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-document bg-cream p-5 space-y-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-document-b pb-2">
                  <div className="font-bold text-accent-red flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-accent-red text-cream flex items-center justify-center text-xs font-bold">3</span>
                    <span>NOX COMPUTE ON-CHAIN VERIFIER</span>
                  </div>
                  <span className="text-[10px] bg-paper px-2 py-0.5 border border-charcoal/15 text-charcoal/60 uppercase">
                    On-chain TEE Verification
                  </span>
                </div>
                <p className="text-charcoal/85 text-xs sm:text-sm pt-1 leading-relaxed">
                  <code className="bg-paper px-2 py-0.5 border border-charcoal/20 font-bold text-accent-red">
                    Nox.fromExternal()
                  </code>{" "}
                  validates the proof signature inside the TEE context. The internal balance is securely deducted via{" "}
                  <code className="bg-paper px-2 py-0.5 border border-charcoal/20 font-bold text-accent-red">
                    Nox.safeSub()
                  </code>.
                </p>
              </div>

              {/* Connector 3 */}
              <div className="flex items-center justify-center font-mono text-xs text-accent-red py-1">
                <div className="border-document bg-cream px-4 py-1.5 flex items-center gap-2 shadow-xs text-[11px]">
                  <span>↓</span>
                  <span>Payout request is queued on-chain with unique Request ID</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border-document bg-paper p-5 space-y-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-document-b pb-2">
                  <div className="font-bold text-emerald-800 flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-cream flex items-center justify-center text-xs font-bold">4</span>
                    <span>JIT SETTLEMENT &amp; UNWRAPPING</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 px-2 py-0.5 border border-emerald-900/20 text-emerald-800 font-bold uppercase">
                    USDC Transfer Released
                  </span>
                </div>
                <p className="text-charcoal/85 text-xs sm:text-sm pt-1 leading-relaxed">
                  <code className="bg-cream px-2 py-0.5 border border-charcoal/20 font-bold text-emerald-800">
                    finalizePayout()
                  </code>{" "}
                  fetches public decryption proofs from Nox TEE, unwraps the exact plaintext amount, and transfers real USDC to the recipient.
                </p>
              </div>
            </div>
          </div>

          {/* 5 Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-document bg-paper p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-mono text-xs text-accent-red font-bold uppercase tracking-wider">
                  STEP 01 // DEPOSIT &amp; ACCOUNTING
                </div>
                <h3 className="font-serif text-2xl font-bold text-charcoal">
                  Deposit Treasury ERC-20
                </h3>
                <p className="font-sans text-sm text-charcoal/80 leading-relaxed">
                  The Safe deposits standard USDC into the module contract. The module converts the balance into encrypted accounting handles via <code className="font-mono text-xs bg-cream px-1">Nox.toEuint256()</code>.
                </p>
              </div>
              <div className="pt-4 border-document-t font-mono text-[11px] text-charcoal/60 flex items-center gap-2">
                <CurrencyCircleDollar size={16} className="text-accent-red" />
                <span>USDC to Encrypted euint256</span>
              </div>
            </div>

            <div className="border-document bg-paper p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-mono text-xs text-accent-red font-bold uppercase tracking-wider">
                  STEP 02 // MULTISIG SIGN-OFF
                </div>
                <h3 className="font-serif text-2xl font-bold text-charcoal">
                  Native Safe Approval
                </h3>
                <p className="font-sans text-sm text-charcoal/80 leading-relaxed">
                  Proposers encrypt the amount client-side. Safe signers review the recipient and memo, then execute the proposal using Safe&apos;s native threshold signatures.
                </p>
              </div>
              <div className="pt-4 border-document-t font-mono text-[11px] text-charcoal/60 flex items-center gap-2">
                <Key size={16} className="text-accent-red" />
                <span>Native Safe Multisig Threshold</span>
              </div>
            </div>

            <div className="border-document bg-paper p-6 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-mono text-xs text-accent-red font-bold uppercase tracking-wider">
                  STEP 03 // JIT UNWRAPPING
                </div>
                <h3 className="font-serif text-2xl font-bold text-charcoal">
                  Public Decryption &amp; Transfer
                </h3>
                <p className="font-sans text-sm text-charcoal/80 leading-relaxed">
                  Upon finalization, Nox generates public decryption proofs for the amount and debit status. The module unwraps the exact USDC amount and transfers it to the recipient.
                </p>
              </div>
              <div className="pt-4 border-document-t font-mono text-[11px] text-charcoal/60 flex items-center gap-2">
                <CheckCircle size={16} className="text-accent-red" />
                <span>Verifiable On-Chain Unwrapping</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. BLOCK EXPLORER DIFF SIMULATOR ── */}
      <section className="w-full border-document-b bg-paper py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2 border-document-b pb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-accent-red">
              EXHIBIT C // ON-CHAIN AUDIT SIMULATOR
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
              Compare What Block Explorers See
            </h2>
            <p className="font-sans text-sm text-charcoal/70 max-w-2xl">
              Toggle between standard Safe executions and Safety confidential module executions to see what is visible on Arbiscan and Etherscan.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-document bg-cream p-1 max-w-md font-mono text-xs uppercase">
            <button
              onClick={() => setActiveDiffTab("standard")}
              className={`flex-1 py-2.5 px-4 text-center transition-colors ${
                activeDiffTab === "standard"
                  ? "bg-charcoal text-cream font-bold"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Standard Safe Tx (Public)
            </button>
            <button
              onClick={() => setActiveDiffTab("safety")}
              className={`flex-1 py-2.5 px-4 text-center transition-colors ${
                activeDiffTab === "safety"
                  ? "bg-accent-red text-cream font-bold"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Safety Module Tx (Encrypted)
            </button>
          </div>

          {/* Terminal / Explorer Card */}
          <div className="border-document bg-charcoal text-cream p-6 sm:p-8 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-document-b border-cream/15 pb-3 text-cream/50 text-[10px] uppercase tracking-widest">
              <span>EXPLORER CALLDATA INSPECTOR // {activeDiffTab === "standard" ? "STANDARD SAFE" : "SAFETY MODULE"}</span>
              <span>NETWORK: ARBITRUM SEPOLIA / ETH SEPOLIA</span>
            </div>

            {activeDiffTab === "standard" ? (
              <div className="space-y-3">
                <div className="text-red-400 font-bold">
                  ⚠️ PUBLIC EXPOSURE WARNING: All values visible on explorer
                </div>
                <div className="bg-cream/5 p-4 border border-cream/10 space-y-2">
                  <div><span className="text-cream/50">Tx Method:</span> execTransaction(to, value, data, operation...)</div>
                  <div><span className="text-cream/50">Target Token:</span> 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d (USDC)</div>
                  <div><span className="text-cream/50">Recipient:</span> 0x7a8121Ab000000000000000000000000004b21</div>
                  <div>
                    <span className="text-cream/50">Amount:</span>{" "}
                    <span className="text-red-400 font-bold bg-red-950/50 px-2 py-0.5 border border-red-500/30">
                      50,000.000000 USDC ($50,000 USD)
                    </span>
                  </div>
                </div>
                <p className="text-cream/60 text-[11px] leading-relaxed">
                  Anyone watching the network can record contractor payouts, executive compensation, or supplier costs instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <ShieldCheck size={16} />
                  CONFIDENTIAL EXECUTION: Payout amount sealed via iExec Nox TEE
                </div>
                <div className="bg-cream/5 p-4 border border-cream/10 space-y-2">
                  <div><span className="text-cream/50">Tx Method:</span> requestPayout(recipient, amountHandle, amountProof)</div>
                  <div><span className="text-cream/50">Module Contract:</span> 0xC3B7F5b12532AFA48d9B7fb695cb1B5234380EB4</div>
                  <div><span className="text-cream/50">Recipient:</span> 0x7a8121Ab000000000000000000000000004b21</div>
                  <div>
                    <span className="text-cream/50">Encrypted Amount Handle:</span>{" "}
                    <span className="text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/30">
                      0x0000aa36a72301e7fadb2c4a6342a15728ee7bc8fd8172279c8695ed1a7ca57c
                    </span>
                  </div>
                  <div>
                    <span className="text-cream/50">Nox TEE Proof:</span>{" "}
                    <span className="text-cream/70">137 bytes EIP-712 ECDSA signature</span>
                  </div>
                </div>
                <p className="text-cream/60 text-[11px] leading-relaxed">
                  Block explorers show only the encrypted handle ID. The actual numeric value is computed confidentially inside the Nox TEE enclave.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. DEEP DIVE TECHNICAL SPECS & FAQ ── */}
      <section id="deep-dive" className="w-full border-document-b bg-cream py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="space-y-2 border-document-b pb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-accent-red">
              EXHIBIT D // DEEP DIVE &amp; FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal">
              Technical Specifications &amp; Design Decisions
            </h2>
          </div>

          <div className="space-y-4 max-w-4xl font-mono text-xs">
            {[
              {
                q: "Does Safety require modifying or re-deploying our existing Safe multisig?",
                a: "No. Safety is built as a zero-fork Safe Module plugin. You enable the ConfidentialPayoutModule on your existing Safe 1.4.1 contract using standard Safe UI or Protocol Kit transactions. Your existing signers and threshold rules remain completely unchanged.",
              },
              {
                q: "How does Nox TEE ensure the encrypted amount is valid without revealing it?",
                a: "Client-side encryptions generate a 137-byte proof signed by the Nox oracle in a Trusted Execution Environment (TEE). On-chain, Nox.fromExternal() verifies the signature over the handle, owner address (Safe), application contract (Module), and expiry timestamp before deducting the balance securely via Nox.safeSub().",
              },
              {
                q: "What happens if a payout request exceeds the available module balance?",
                a: "Nox.safeSub() returns a boolean handle debitSuccess along with the new balance. Upon finalization, publicDecrypt() verifies debitSuccess inside the TEE. If debitSuccess is false, finalizePayout() reverts on-chain, ensuring no invalid transfers can occur.",
              },
              {
                q: "Which networks are currently supported?",
                a: "Safety natively supports both Arbitrum Sepolia (Chain ID 421614) and Ethereum Sepolia (Chain ID 11155111). You can toggle between networks using the Network Selector dropdown in the navigation header.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-document bg-paper">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-base text-charcoal hover:text-accent-red transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <CaretUp size={18} /> : <CaretDown size={18} />}
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 font-sans text-sm text-charcoal/80 leading-relaxed border-document-t border-charcoal/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="border-document bg-charcoal text-cream p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif text-2xl font-bold">Ready to test confidential payouts?</h3>
              <p className="font-mono text-xs text-cream/70">
                Launch the Treasury Console to link your Safe on Arbitrum Sepolia or Ethereum Sepolia.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 border-document bg-accent-red text-cream font-mono text-xs uppercase tracking-widest hover:bg-cream hover:text-charcoal transition-colors shrink-0"
            >
              Open Console →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
