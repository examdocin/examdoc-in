import React from "react";
import Link from "next/link";
import { EXAMS, ExamPreset } from "@/data/exams";
import { ShieldCheck } from "lucide-react";

function formatFooterExamLabel(exam: ExamPreset): string {
  if (/kb/i.test(exam.shortName)) {
    return exam.shortName;
  }
  return `${exam.shortName} (${exam.minKB}–${exam.maxKB} KB)`;
}

export default function Footer() {
  const col1 = EXAMS.slice(0, 6);
  const col2 = EXAMS.slice(6, 12);
  const col3 = EXAMS.slice(12, 18);

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-10 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Top Brand Summary Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center">
              <span className="text-lg font-extrabold text-white">
                Exam<span className="text-blue-500">Doc</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s 100% browser-private government exam photo, signature, thumb impression, declaration, AI document scanner, and marksheet/Aadhaar PDF resizer.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Portal-Verified JPG • 200 &amp; 300 DPI • PDF Under 100KB</span>
          </div>
        </div>

        {/* 3 Balanced Columns of 6 Exam Links Each (18 Total) */}
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
                    {formatFooterExamLabel(exam)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              IBPS, NEET, UPSC &amp; PAN Tools
            </h3>
            <ul className="space-y-1">
              {col2.map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="inline-flex items-center min-h-[36px] text-xs text-slate-400 hover:text-white transition"
                  >
                    {formatFooterExamLabel(exam)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              AI Doc Scanner &amp; PDF Reducers
            </h3>
            <ul className="space-y-1">
              {col3.map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="inline-flex items-center min-h-[36px] text-xs text-slate-400 hover:text-white transition"
                  >
                    {formatFooterExamLabel(exam)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} ExamDoc — Built for Indian Aspirants, CSC VLEs &amp; Cyber Cafes.
          </p>
          <p>
            100% Privacy Guarantee: Your Aadhaar, PAN, Photos &amp; Marksheets never leave your device.
          </p>
        </div>
      </div>
    </footer>
  );
}
