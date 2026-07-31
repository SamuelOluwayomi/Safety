"use client";

import React, { useState } from "react";

interface InfoTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export default function InfoTooltip({ content, side = "top" }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Information tooltip"
        className="w-4 h-4 rounded-full bg-cream border border-charcoal/30 text-charcoal/70 flex items-center justify-center text-[10px] font-mono font-bold hover:border-accent-red hover:bg-accent-red hover:text-white transition-colors cursor-help shrink-0 ml-1.5"
      >
        ?
      </button>

      {isOpen && (
        <span
          className={`absolute z-50 w-64 p-3 bg-charcoal text-cream font-sans text-xs leading-normal rounded-none border border-cream/20 shadow-xl pointer-events-none transition-all duration-150 text-left normal-case whitespace-normal font-normal ${positionClasses[side]}`}
        >
          <span className="font-mono text-[10px] uppercase text-accent-red tracking-wider font-bold block mb-1">
            Information
          </span>
          <span className="text-cream/90 block font-sans text-xs">{content}</span>
        </span>
      )}
    </span>
  );
}
