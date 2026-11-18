import React from "react";
import Link from "next/link";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { EXAMS } from "@/data/exams";
import { ShieldCheck, Zap, Binary, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-6 pb-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-300 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
              <Binary className="w-3.5 h-3.5" />
              JFIF APP0 200/300 DPI Header Injection
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Exact KB Binary Search + 0xFFD9 Safe Padding
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <Zap className="w-3.5 h-3.5" />
              WhatsApp WebP / PNG / HEIC → Baseline JPG &amp; PDF-1.4
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            India&apos;s #1 Govt Exam Photo, Signature, Declaration &amp; PDF (&lt;100KB) Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-4xl">
            100% browser-executed utility for{" "}
            <strong className="text-white">
              SSC, UPSC, IBPS, SBI, NEET, JEE, NSDL/UTI PAN, Railway RRB &amp; State PSC
            </strong>
            . Add Name &amp; Date of Photo (DOP), align with the 80% Face Oval, bleach gray signature paper to pure{" "}
            <code className="text-emerald-300">#FFFFFF</code>, merge Aadhaar/Marksheet PDFs under 100KB, or print 8 photos on a 4×6 sheet for ₹10.
          </p>
        </div>
      </section>

      {/* Main 5-Tab All-in-One Workbench */}
      <ExamDocWorkbench />

      {/* Master All-India Exam Specification Matrix */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold">
                All-India Government Exam Photo, Signature &amp; PDF Cheat Sheet (2026)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Click any exam row below to open its pre-configured 200/300 DPI resizer tool.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Verified Official Portal Rules
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3.5">Exam / Portal</th>
                  <th className="p-3.5">Primary Photo Spec</th>
                  <th className="p-3.5">Signature / PDF Spec</th>
                  <th className="p-3.5">DPI &amp; DOP Rule</th>
                  <th className="p-3.5 text-right">Open Dedicated Tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {EXAMS.map((exam) => {
                  const p0 = exam.presets[0];
                  const p1 = exam.presets[1];
                  return (
                    <tr key={exam.slug} className="hover:bg-blue-50/40 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{exam.shortName}</div>
                        <div className="text-[11px] text-slate-500">{exam.conductingBody}</div>
                      </td>
                      <td className="p-3.5 font-mono text-xs">
                        {p0 ? (
                          <>
                            <span className="font-bold text-blue-700">
                              {p0.widthPx}×{p0.heightPx} px
                            </span>{" "}
                            ({p0.minKB}–{p0.maxKB} KB)
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs">
                        {p1 ? (
                          <>
                            <span className="font-semibold text-slate-800">
                              {p1.widthPx}×{p1.heightPx} px
                            </span>{" "}
                            ({p1.minKB}–{p1.maxKB} KB)
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3.5 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-mono font-semibold text-slate-800 mr-1.5">
                          {p0?.dpi || 200} DPI
                        </span>
                        {p0?.requiresNameDop && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            Name + DOP
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/${exam.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                        >
                          <span>Launch</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rich SEO Article & JSON-LD Schema for Homepage */}
      <ExamSeoArticle exam={EXAMS[0]} canonicalUrl="https://examdoc.in" />
    </div>
  );
}
