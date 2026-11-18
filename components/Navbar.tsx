import React from "react";
import Link from "next/link";
import { FileCheck2, ShieldCheck } from "lucide-react";

const NAV_SHORTCUTS = [
  { label: "SSC Photo & Sign", href: "/ssc-cgl-photo-resizer-20kb-to-50kb" },
  { label: "Railway RRB", href: "/rrb-ntpc-group-d-photo-resizer-30kb-to-70kb" },
  { label: "IBPS & SBI", href: "/ibps-sbi-photo-resizer-200x230-20kb-50kb" },
  { label: "IBPS Declaration", href: "/ibps-sbi-handwritten-declaration-resizer-800x400-50kb-100kb" },
  { label: "NEET & Postcard", href: "/neet-ug-photo-resizer-80-percent-face-name-date" },
  { label: "UPSC OTR", href: "/upsc-photo-resizer-350x350-to-1000x1000-name-date" },
  { label: "NSDL / UTI PAN", href: "/nsdl-uti-pan-card-photo-213x213-300-dpi-resizer" },
  { label: "PDF <100KB", href: "/marksheet-pdf-size-reducer-under-100kb-200kb" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/25 group-hover:scale-105 transition">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                ExamDoc<span className="text-blue-600">.in</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                2026 Official
              </span>
            </div>
            <span className="text-[11px] text-slate-500 leading-none hidden sm:inline">
              Govt Exam Photo, Signature &amp; PDF Maker
            </span>
          </div>
        </Link>

        {/* Clean Single-Line Navigation Pills */}
        <nav
          aria-label="Popular Exams"
          className="hidden xl:flex items-center gap-1 overflow-x-auto"
        >
          {NAV_SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 whitespace-nowrap transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Single Sleek Privacy Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Private • No Server Upload</span>
          </div>
        </div>
      </div>
    </header>
  );
}
