import React from "react";
import Link from "next/link";
import { EXAMS } from "@/data/exams";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          <div className="md:col-span-4 space-y-3">
            <div className="text-xl font-extrabold text-white">
              ExamDoc<span className="text-blue-500">.in</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s #1 100% client-side government exam document compliance engine.
              Every photo, signature, thumb impression, handwritten declaration, and Aadhaar/Marksheet PDF is processed locally in your browser using HTML5 Canvas, WebRTC, and ArrayBuffer JFIF binary header injection.
            </p>
            <div className="text-xs font-mono text-emerald-400">
              Verified Baseline JPEG (0xFFD8FFE0) • 200/300 DPI • PDF-1.4 /DCTDecode
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Central &amp; Banking Exam Tools
            </h3>
            <ul className="space-y-1.5 text-xs">
              {EXAMS.slice(0, 4).map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {exam.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              PAN, PDF &amp; State Exam Tools
            </h3>
            <ul className="space-y-1.5 text-xs">
              {EXAMS.slice(4).map((exam) => (
                <li key={exam.slug}>
                  <Link
                    href={`/${exam.slug}`}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {exam.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} ExamDoc.in — Built for Indian Aspirants, CSC VLEs &amp; Cyber Cafes.
          </p>
          <p>
            Privacy Guarantee: Your Aadhaar, PAN, Photos &amp; Marksheets never leave your device.
          </p>
        </div>
      </div>
    </footer>
  );
}
