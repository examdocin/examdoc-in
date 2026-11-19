"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileCheck2, ShieldCheck, Menu, X } from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
        {/* Left: Clean ExamDoc.in Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 shrink-0 min-h-[44px] group"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:bg-blue-700 transition">
            <FileCheck2 className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            ExamDoc<span className="text-blue-600">.in</span>
          </span>
        </Link>

        {/* Center (Desktop md+): 5 Clean Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1.5 lg:gap-2"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center px-3 min-h-[44px] rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 whitespace-nowrap transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Compact Privacy Pill + Mobile Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">100% Private</span>
            <span className="sm:hidden">Private</span>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-white border-b border-slate-200 px-3 py-3 space-y-1.5 shadow-lg"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3.5 min-h-[44px] rounded-xl text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
