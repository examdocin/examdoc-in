import React from "react";
import Link from "next/link";
import { ShieldCheck, FileCheck2, Lock } from "lucide-react";
import { EXAMS } from "@/data/exams";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/30">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                ExamDoc<span className="text-blue-600">.in</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                200/300 DPI Binary
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
              India&apos;s #1 Client-Side Govt Exam Photo, Sign &amp; PDF Utility
            </p>
          </div>
        </Link>

        <nav
          aria-label="Top Exam Quick Links"
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-700"
        >
          {EXAMS.slice(0, 6).map((exam) => (
            <Link
              key={exam.slug}
              href={`/${exam.slug}`}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition"
            >
              {exam.shortName}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">100% Browser Private</span>
            <span className="sm:hidden">No Upload</span>
          </div>
          <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Server Cost
          </div>
        </div>
      </div>
    </header>
  );
}
