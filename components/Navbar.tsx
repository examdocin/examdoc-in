"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Photo Maker", href: "/ssc-cgl-photo-resizer-20kb-to-50kb" },
  { label: "Sign & Thumb", href: "/ssc-signature-resizer-10kb-to-20kb" },
  { label: "Doc Scanner", href: "/online-document-scanner-auto-crop-pdf" },
  { label: "PDF <100KB", href: "/marksheet-pdf-size-reducer-under-100kb-200kb" },
  { label: "All Exams", href: "#all-exams" }
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: Clean ExamDoc Brand */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center shrink-0 min-h-[44px]"
        >
          <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
            Exam<span className="text-[#2864E8]">Doc</span>
          </span>
        </Link>

        {/* Center (Desktop md+): Clean Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center px-3 min-h-[40px] rounded-[12px] text-sm font-semibold text-[#64748B] hover:text-[#2864E8] hover:bg-[#F5F7FA] whitespace-nowrap transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Compact Private Indicator + Mobile Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">100% Private</span>
            <span className="sm:hidden">Private</span>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[12px] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F5F7FA] transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 space-y-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3.5 min-h-[44px] rounded-[12px] text-sm font-semibold text-[#0F172A] hover:bg-[#F5F7FA] hover:text-[#2864E8] transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
