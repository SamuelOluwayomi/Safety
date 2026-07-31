"use client";

import React, { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  iconSize?: number;
}

export default function CopyButton({
  text,
  label,
  className = "",
  iconSize = 13,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `Copied ${label}!` : "Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className={`inline-flex items-center gap-1 p-0.5 hover:text-accent-red transition-colors text-charcoal/50 hover:bg-charcoal/10 rounded cursor-pointer ${className}`}
    >
      {copied ? (
        <Check size={iconSize} className="text-emerald-700" weight="bold" />
      ) : (
        <Copy size={iconSize} />
      )}
    </button>
  );
}
