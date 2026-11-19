import React from "react";
import Link from "next/link";
import { EXAMS } from "@/data/exams";
import { FileCheck2, ShieldCheck } from "lucide-react";

export default function Footer() {
  const col1 = EXAMS.slice(0, 5);
  const col2 = EXAMS.slice(5, 10);
  const col3 = EXAMS.slice(10, 15);

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Top Brand Summary Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-white">
                ExamDoc<span className="text-blue-500">.in</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s 100% browser-private government exam photo, signature, thumb impression, declaration, and marksheet/Aadhaar PDF resizer.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Portal-Verified JPG • 200 &amp; 300 DPI • PDF Under 100KB</span>
          </div>
        </div>

        {/* 3 Balanced Columns of 5 Exam Links Each (15 Total) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-slate-800">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              SSC, Railway &amp; Banking Tools
            </h3>
            <ul className="space-y-1">
              {col1.map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="inline-flex items-center min-h-[36px] text-xs text-slate-400 hover:text-white transition"
                  >
                    {exam.shortName} — {exam.minKB}–{exam.maxKB} KB
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              IBPS, NEET &amp; UPSC Tools
            </h3>
            <ul className="space-y-1">
              {col2.map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="inline-flex items-center min-h-[36px] text-xs text-slate-400 hover:text-white transition"
                  >
                    {exam.shortName} — {exam.minKB}–{exam.maxKB} KB
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              State PSC, PAN &amp; PDF Tools
            </h3>
            <ul className="space-y-1">
              {col3.map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="inline-flex items-center min-h-[36px] text-xs text-slate-400 hover:text-white transition"
                  >
                    {exam.shortName} — {exam.minKB}–{exam.maxKB} KB
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} ExamDoc.in — Built for Indian Aspirants, CSC VLEs &amp; Cyber Cafes.
          </p>
          <p>
            100% Privacy Guarantee: Your Aadhaar, PAN, Photos &amp; Marksheets never leave your device.
          </p>
        </div>
      </div>
    </footer>
  );
}
