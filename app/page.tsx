import React from "react";
import type { Metadata } from "next";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { EXAMS } from "@/data/exams";
import { Zap, ShieldCheck, CheckCircle2 } from "lucide-react";

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
      {/* Compact, Modern SaaS Hero Section */}
      <section className="bg-white py-5 sm:py-7 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-2.5">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            Your Documents. <span className="text-[#2864E8]">Exam Ready.</span>
          </h1>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Resize SSC, UPSC, IBPS, SBI, RRB, NEET &amp; PAN photos, signatures, declarations, and marksheet PDFs to exact official portal specs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-xs font-semibold text-[#0F172A]">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#2864E8]" />
              Fast
            </span>
            <span className="text-[#E2E8F0]" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              100% Private
            </span>
            <span className="text-[#E2E8F0]" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2864E8]" />
              Free Forever
            </span>
          </div>
        </div>
      </section>

      {/* Main 6-Tab All-in-One Workbench (includes the #all-exams directory with search & category filters) */}
      <ExamDocWorkbench />

      {/* Rich SEO Article & JSON-LD Schema for Homepage */}
      <ExamSeoArticle exam={EXAMS[0]} canonicalUrl="https://www.examdoc.in/" />
    </div>
  );
}
