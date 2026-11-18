import React from "react";
import Link from "next/link";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { EXAMS } from "@/data/exams";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Clean, Light, Engaging Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-slate-50 pt-6 pb-2 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-white border border-blue-200/80 shadow-2xs text-xs font-bold text-blue-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Free 2026 Government Exam Photo, Signature &amp; PDF Maker</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              200 &amp; 300 DPI Verified
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Resize Exam Photo, Signature, Declaration &amp; PDF in{" "}
            <span className="text-blue-600">1 Click</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl mx-auto leading-relaxed">
            Pre-configured for{" "}
            <strong className="text-slate-800">
              SSC, UPSC, IBPS, SBI, NEET, JEE, Railway RRB &amp; NSDL/UTI PAN Card
            </strong>
            . Add Name &amp; Date on photo, whiten gray signature paper, compress Marksheet/Aadhaar PDFs under 100KB, or create an 8-photo 4×6 print sheet.
          </p>
        </div>
      </section>

      {/* Main 5-Tab All-in-One Workbench */}
      <ExamDocWorkbench />

      {/* Master All-India Exam Specification Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                All-India Government Exam Photo, Signature &amp; PDF Size Chart (2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any exam row below to open its pre-configured resizer tool.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              15 Official Presets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3.5">Exam / Portal</th>
                  <th className="p-3.5">Dimensions (Pixels &amp; cm)</th>
                  <th className="p-3.5">Required File Size</th>
                  <th className="p-3.5">DPI &amp; Special Rule</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {EXAMS.map((exam) => (
                  <tr key={exam.slug} className="hover:bg-blue-50/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{exam.shortName}</div>
                      <div className="text-[11px] text-slate-500">{exam.conductingBody}</div>
                    </td>
                    <td className="p-3.5 text-xs">
                      <span className="font-bold text-blue-700">
                        {exam.widthPx}×{exam.heightPx} px
                      </span>{" "}
                      <span className="text-slate-500">
                        ({exam.widthCm} × {exam.heightCm})
                      </span>
                    </td>
                    <td className="p-3.5 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/70">
                        {exam.minKB} KB – {exam.maxKB} KB
                      </span>
                    </td>
                    <td className="p-3.5 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 mr-1.5">
                        {exam.dpi} DPI
                      </span>
                      {exam.requiresNameDop && (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          Name + Date
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/${exam.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                      >
                        <span>Open Tool</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
