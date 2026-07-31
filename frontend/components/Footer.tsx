"use client";

import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { getDeployment } from "@/lib/deployments";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const { networkKey } = useDashboardStore();
  const deployment = getDeployment(networkKey);

  if (pathname === "/dashboard") return null;

  const externalLinks = [
    {
      label: "GitHub",
      href: "https://github.com/SamuelOluwayomi/Safety",
      detail: "Source & contracts",
    },
    {
      label: "Block Explorer",
      href: deployment.explorerUrl,
      detail: deployment.label,
    },
    {
      label: "Safe{Wallet}",
      href: `https://app.safe.global/home?safe=${deployment.safePrefix}:${deployment.addresses.safe}`,
      detail: "Multisig interface",
    },
    {
      label: "iExec Nox",
      href: "https://docs.noxprotocol.io/",
      detail: "Confidential compute",
    },
  ] as const;

  return (
    <footer className="w-full border-document-t bg-cream mt-auto">
      {/* Closure stamp */}
      <div className="border-document-b bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 border-document px-3 py-1 bg-cream font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/80">
            <span className="inline-block w-1.5 h-1.5 bg-accent-red" />
            Safety // File sealed
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-charcoal/55">
            Ref. SF-07984 · {deployment.label} ({deployment.chainId}) · iExec WTF Hackathon 2026
          </div>
        </div>
      </div>

      {/* Main dossier grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Protocol column */}
          <div className="lg:col-span-3 space-y-8">
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-red mb-4">
                Protocol
              </h3>
              <dl className="space-y-3 font-mono text-xs text-charcoal/80">
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Module
                  </dt>
                  <dd>Safety v1.0 — Confidential Payout</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Network
                  </dt>
                  <dd>{deployment.label} ({deployment.chainId})</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Confidential layer
                  </dt>
                  <dd>iExec Nox TEE enclaves</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Token standard
                  </dt>
                  <dd>ERC-7984 wrapper ({deployment.tokenSymbol})</dd>
                </div>
              </dl>
            </section>

            <section className="border-document-t pt-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-red mb-4">
                Safe integration
              </h3>
              <dl className="space-y-3 font-mono text-xs text-charcoal/80">
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Pattern
                  </dt>
                  <dd>Module plugin — no core fork</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    Approvals
                  </dt>
                  <dd>Native multisig threshold</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-charcoal/45 mb-0.5">
                    On-chain visibility
                  </dt>
                  <dd>Amounts encrypted · execution verifiable</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Resources column */}
          <div className="lg:col-span-4 lg:border-document-l lg:pl-8 space-y-8">
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-red mb-2">
                External
              </h3>
              <div className="border-document bg-paper px-4">
                {externalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 py-2.5 border-document-b last:border-b-0 hover:text-accent-red transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-xs uppercase tracking-wider">
                        {link.label}
                      </span>
                      <span className="block text-[10px] text-charcoal/55 normal-case tracking-normal mt-0.5">
                        {link.detail}
                      </span>
                    </span>
                    <ArrowSquareOut
                      size={14}
                      className="shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-accent-red transition-all"
                    />
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-red mb-4">
                Legal
              </h3>
              <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider">
                <Link
                  href="#"
                  className="text-charcoal/70 hover:text-accent-red border-b border-transparent hover:border-accent-red transition-colors pb-0.5"
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  className="text-charcoal/70 hover:text-accent-red border-b border-transparent hover:border-accent-red transition-colors pb-0.5"
                >
                  Terms
                </Link>
                <Link
                  href="#"
                  className="text-charcoal/70 hover:text-accent-red border-b border-transparent hover:border-accent-red transition-colors pb-0.5"
                >
                  Disclaimer
                </Link>
              </nav>
              <p className="mt-4 font-sans text-[11px] text-charcoal/55 leading-relaxed max-w-sm">
                Testnet software only. Not audited for production treasury use.
              </p>
            </section>
          </div>

          {/* Mission statement — full-width on mobile, right panel on desktop */}
          <div className="lg:col-span-5 lg:border-document-l lg:pl-8">
            <div className="border-document bg-charcoal text-cream p-6 sm:p-8 h-full flex flex-col justify-between gap-8">
              <blockquote className="font-serif text-xl sm:text-2xl leading-snug italic text-cream/95">
                &ldquo;Safety is a confidential treasury layer for Safe that uses
                iExec Nox to keep payment amounts private in multisig
                transactions, without modifying Safe&apos;s core protocol.&rdquo;
              </blockquote>

              <div className="space-y-4 border-document-t border-cream/15 pt-6">
                <div className="grid grid-cols-2 gap-4 font-mono text-[10px] uppercase tracking-wider text-cream/50">
                  <div>
                    <span className="block text-cream/35 mb-1">Built by</span>
                    <span className="text-cream/80">Samuel Oluwayomi</span>
                  </div>
                  <div>
                    <span className="block text-cream/35 mb-1">Submission</span>
                    <span className="text-cream/80">WTF Hackathon 2026</span>
                  </div>
                </div>

                <a
                  href="https://github.com/SamuelOluwayomi/Safety"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent-red hover:text-cream transition-colors"
                >
                  View repository
                  <ArrowSquareOut size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End of dossier */}
      <div className="border-document-t bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
          <span>End of dossier — 09 / 09</span>
          <span className="text-charcoal/40">
            MIT License · Powered by iExec Nox &amp; Safe Protocol
          </span>
        </div>
      </div>
    </footer>
  );
}
