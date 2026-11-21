import React from "react";
import type { Metadata } from "next";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { EXAMS } from "@/data/exams";

export const metadata: Metadata = {
  applicationName: "ExamDoc",
  title: {
    absolute: "Free Govt Exam Photo, Signature & PDF Resizer | ExamDoc"
  },
  description:
    "Resize SSC, UPSC, IBPS, RRB, NEET & PAN photos (20KB–50KB), signatures (10KB–20KB), and marksheet PDFs (<100KB) 100% privately in your browser.",
  alternates: {
    canonical: "https://www.examdoc.in/"
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.examdoc.in/",
    siteName: "ExamDoc",
    title: "Free Govt Exam Photo, Signature & PDF Resizer | ExamDoc",
    description:
      "Resize SSC, UPSC, IBPS, RRB, NEET & PAN photos (20KB–50KB), signatures (10KB–20KB), and marksheet PDFs (<100KB) 100% privately in your browser."
  }
};

export default function HomePage() {
  return (
    <div>
      {/* Compact Above-the-Fold Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-slate-50 py-4 md:py-6 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 text-center">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Resize Govt Exam Photo, Signature &amp; PDF{" "}
            <span className="text-blue-600 whitespace-nowrap">in 1 Click</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl mx-auto leading-snug">
            Official 200/300 DPI presets for{" "}
            <strong className="text-slate-800">
              SSC, UPSC, IBPS, SBI, NEET, RRB &amp; PAN
            </strong>{" "}
            — 100% private in your browser.
          </p>
        </div>
      </section>

      {/* Main 5-Tab All-in-One Workbench (includes the #all-exams directory with category filters) */}
      <ExamDocWorkbench />

      {/* Rich SEO Article & JSON-LD Schema for Homepage */}
      <ExamSeoArticle exam={EXAMS[0]} canonicalUrl="https://www.examdoc.in/" />
    </div>
  );
}
