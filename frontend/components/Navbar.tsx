"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { List, X, ArrowUpRight, Globe } from "@phosphor-icons/react";
import ConnectWalletButton from "./ConnectWalletButton";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { NETWORK_OPTIONS, type NetworkKey } from "@/lib/deployments";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { networkKey, setNetworkKey } = useDashboardStore();

  return (
    <header className="w-full bg-cream border-document-b sticky top-0 z-50">
      {/* Top Banner Document Stamp */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 border-document-b text-[11px] font-mono tracking-wider text-charcoal/70 bg-paper">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-accent-red animate-pulse" />
          <span>CLASSIFIED // SAFE NOX MODULE V1.0</span>
          <span>·</span>
          <span>FILE NO. SF-07984</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-accent-red" />
            <select
              value={networkKey}
              onChange={(e) => setNetworkKey(e.target.value as NetworkKey)}
              className="bg-transparent font-mono text-[11px] uppercase tracking-wider text-charcoal font-bold cursor-pointer focus:outline-none"
            >
              {NETWORK_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-paper text-charcoal">
                  NETWORK: {opt.label.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <span>·</span>
          <span>ENCLAVE: ACTIVE</span>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/safety.png"
            alt="Safety Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl leading-none tracking-tight">
              Safety<span className="text-accent-red font-mono text-xs ml-1">.module</span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 leading-tight">
              Safe Confidential Layer
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider">
          <Link
            href="/"
            className="hover:text-accent-red transition-colors py-1 border-b-2 border-transparent hover:border-accent-red"
          >
            Home
          </Link>
          <Link
            href="#architecture"
            className="hover:text-accent-red transition-colors py-1 border-b-2 border-transparent hover:border-accent-red"
          >
            Architecture
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-accent-red transition-colors py-1 border-b-2 border-transparent hover:border-accent-red"
          >
            Dashboard
          </Link>
          <a
            href="https://safetyy-doc.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-red transition-colors py-1 border-b-2 border-transparent hover:border-accent-red"
          >
            Documentation
          </a>
        </nav>

        {/* Action Button / Connect Wallet Placeholder */}
        <div className="hidden md:flex items-center gap-3">
          <ConnectWalletButton />
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-document text-charcoal hover:bg-paper"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-document-t bg-cream px-4 py-6 flex flex-col gap-4 font-mono text-sm uppercase tracking-wider">
          <div className="text-[10px] text-accent-red font-bold tracking-widest pb-2 border-document-b">
            CLASSIFIED // NAVIGATION
          </div>
          <div className="py-2 border-document-b flex items-center justify-between">
            <span>Network</span>
            <select
              value={networkKey}
              onChange={(e) => setNetworkKey(e.target.value as NetworkKey)}
              className="bg-paper border-document px-2 py-1 font-mono text-xs text-charcoal font-bold"
            >
              {NETWORK_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-document-b hover:text-accent-red flex items-center justify-between"
          >
            <span>Home</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-document-b hover:text-accent-red flex items-center justify-between"
          >
            <span>Architecture</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-document-b hover:text-accent-red flex items-center justify-between"
          >
            <span>Dashboard</span>
            <ArrowUpRight size={14} />
          </Link>
          <a
            href="https://safetyy-doc.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-document-b hover:text-accent-red flex items-center justify-between"
          >
            <span>Documentation</span>
            <ArrowUpRight size={14} />
          </a>
          <div className="mt-2 w-full [&>button]:justify-center">
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
