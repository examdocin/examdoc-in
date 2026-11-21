import React from "react";
import Link from "next/link";
import { EXAMS, ExamPreset } from "@/data/exams";
import { ShieldCheck, Lock, CheckCircle2, ChevronDown } from "lucide-react";

function formatFooterExamLabel(exam: ExamPreset): string {
  if (/kb/i.test(exam.shortName)) {
    return exam.shortName;
  }
  return `${exam.shortName} (${exam.minKB}–${exam.maxKB} KB)`;
}

export default function Footer() {
  const categories = [
    {
      title: "SSC, Railway & State PSC Tools",
      items: EXAMS.slice(0, 6)
    },
    {
      title: "IBPS, SBI, NEET & UPSC Tools",
      items: EXAMS.slice(6, 12)
    },
    {
      title: "PAN Card, AI Scanner & PDF Tools",
      items: EXAMS.slice(12, 18)
    }
  ];

  return (
    <footer className="bg-[#101828] text-slate-300 border-t border-slate-800/80 mt-10 pb-28 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* 1. ExamDoc Brand, Privacy & Security Indicators, Supported DPI Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 border-b border-slate-800">
          <div className="lg:col-span-6 space-y-2.5">
            <Link href="/" className="inline-block">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Exam<span className="text-[#2864E8]">Doc</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              India&apos;s clean, browser-private platform for government exam photos, signatures, thumb impressions, declarations, AI document scanning, and exact-KB PDF compression.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row lg:justify-end gap-2.5 items-start sm:items-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-900/90 border border-slate-800 text-xs font-semibold text-emerald-400">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>100% Browser Private • Zero Uploads</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2864E8] shrink-0" />
              <span>200 • 300 • 600 DPI &amp; PDF &lt;100KB</span>
            </div>
          </div>
        </div>

        {/* 2. Exam Tool Categories: Expandable Accordions on Mobile (<md), Clean 3 Columns on Desktop (md+) */}
        <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-3 md:gap-8 pb-8 border-b border-slate-800">
          {categories.map((cat) => (
            <div key={cat.title}>
              {/* Mobile Expandable Accordion */}
              <details className="md:hidden group rounded-[12px] bg-slate-900/70 border border-slate-800 overflow-hidden">
                <summary className="min-h-[48px] px-4 py-3 cursor-pointer list-none flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                  <span>{cat.title}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <ul className="px-4 pb-3 pt-1 space-y-1 border-t border-slate-800/80">
                  {cat.items.map((exam) => (
                    <li key={exam.slug}>
                      <Link
                        href={`/${exam.slug}`}
                        className="flex items-center min-h-[40px] text-xs text-slate-300 hover:text-white transition"
                      >
                        {formatFooterExamLabel(exam)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Desktop Static Column */}
              <div className="hidden md:block space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {cat.title}
                </h3>
                <ul className="space-y-1.5">
                  {cat.items.map((exam) => (
                    <li key={exam.slug}>
                      <Link
                        href={`/${exam.slug}`}
                        className="inline-flex items-center min-h-[32px] text-xs text-slate-400 hover:text-white transition"
                      >
                        {formatFooterExamLabel(exam)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Trust, Legal & Support Accordions (About, Contact, Privacy Policy, Terms of Use) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-6 border-b border-slate-800">
          <details className="group rounded-[12px] bg-slate-900/50 border border-slate-800/80 p-3.5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-white">
              <span>About ExamDoc</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              ExamDoc is a free, zero-server-upload document preparation suite built for Indian government exam aspirants, CSC VLEs, and cyber cafes.
            </p>
          </details>

          <details className="group rounded-[12px] bg-slate-900/50 border border-slate-800/80 p-3.5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-white">
              <span>Contact Us</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Need a new exam preset or portal fix? Email us at{" "}
              <a
                href="mailto:examdoc.in@gmail.com"
                className="text-blue-400 hover:underline font-medium"
              >
                examdoc.in@gmail.com
              </a>
              .
            </p>
          </details>

          <details className="group rounded-[12px] bg-slate-900/50 border border-slate-800/80 p-3.5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-white">
              <span>Privacy Policy</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Every photo, signature, Aadhaar card, PAN card, and marksheet is processed strictly inside your browser&apos;s local memory. We never upload, store, or view your files.
            </p>
          </details>

          <details className="group rounded-[12px] bg-slate-900/50 border border-slate-800/80 p-3.5">
            <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-white">
              <span>Terms of Use</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              ExamDoc is an independent utility not affiliated with SSC, UPSC, IBPS, NTA, or NSDL. Always verify your final upload against the latest official exam notification.
            </p>
          </details>
        </div>

        {/* 4. Copyright Information */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>© {new Date().getFullYear()} ExamDoc. All rights reserved.</span>
          </p>
          <p>Processed 100% locally in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
