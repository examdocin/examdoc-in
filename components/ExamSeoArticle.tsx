import React from "react";
import { ExamPreset } from "@/data/exams";
import {
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Table,
  ListOrdered,
  ShieldCheck,
  FileCheck,
  ChevronDown
} from "lucide-react";

interface ExamSeoArticleProps {
  exam: ExamPreset;
  canonicalUrl: string;
}

export default function ExamSeoArticle({ exam, canonicalUrl }: ExamSeoArticleProps) {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication"],
    name: exam.title,
    url: canonicalUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (Web Browser - Android, iOS, Windows, macOS, Linux)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR"
    },
    description: exam.metaDescription,
    featureList: [
      "100% Client-Side Browser Execution (Zero Server Uploads)",
      "Portal-Verified 200 DPI, 300 DPI & 600 DPI Resolution Header",
      "Exact KB File Size Control for Official Exam Portals",
      "Name & Date of Photo (DOP) Plaque & 80% Face Coverage Oval Guide",
      "Paper Whitener for Gray Mobile Signatures & Declarations",
      "Multi-Page Marksheet & Aadhaar PDF Compressor (<100KB / <300KB)"
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: exam.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Resize ${exam.shortName} Photo, Signature & PDF Online`,
    description: exam.subtitle,
    totalTime: "PT1M",
    tool: [
      {
        "@type": "HowToTool",
        name: "ExamDoc"
      }
    ],
    step: exam.howToSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${canonicalUrl}#step-${index + 1}`
    }))
  };

  return (
    <article className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Dynamic JSON-LD Schemas (WebApplication + SoftwareApplication, FAQPage, HowTo) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Official Specifications: Stacked Spec Cards on Mobile (<md), Table on Desktop (md+) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
              {exam.shortName} Official Specifications ({exam.updatedYear})
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            {exam.conductingBody}
          </span>
        </div>

        {/* Mobile (<md): Stacked Spec Cards (Zero Horizontal Overflow) */}
        <div className="md:hidden divide-y divide-slate-200">
          {exam.presets.map((p) => (
            <div key={p.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900">{p.label}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
                  {p.minKB}–{p.maxKB} KB
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Pixels
                  </span>
                  <span className="font-bold text-blue-700">
                    {p.widthPx}×{p.heightPx}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Size (cm)
                  </span>
                  <span className="font-semibold text-slate-700">
                    {p.widthCm}×{p.heightCm}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Resolution
                  </span>
                  <span className="font-bold text-slate-800">
                    {p.dpi} DPI ({p.format})
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.notes}</p>
            </div>
          ))}
        </div>

        {/* Desktop (md+): Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3.5">Document Type</th>
                <th className="p-3.5">Exact Pixels (W×H)</th>
                <th className="p-3.5">Physical Size (cm)</th>
                <th className="p-3.5">Allowed File Size</th>
                <th className="p-3.5">Mandatory DPI</th>
                <th className="p-3.5">Official Portal Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exam.presets.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5 font-bold text-slate-900">{p.label}</td>
                  <td className="p-3.5 text-blue-700 font-bold">
                    {p.widthPx} × {p.heightPx} px
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {p.widthCm} × {p.heightCm}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-700">
                    {p.minKB} KB – {p.maxKB} KB
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {p.dpi} DPI ({p.format})
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-md">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Guidelines Checklist */}
        {exam.guidelines && exam.guidelines.length > 0 && (
          <div className="p-4 sm:p-6 bg-blue-50/40 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2.5">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Mandatory {exam.shortName} Notification Guidelines:</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
              {exam.guidelines.map((g) => (
                <li key={g} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Step-by-Step HowTo & Rejection Reasons Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step-by-Step HowTo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              How to Prepare {exam.shortName} Documents in 60 Seconds
            </h2>
          </div>
          <ol className="space-y-3">
            {exam.howToSteps.map((step, idx) => (
              <li
                key={step.name}
                id={`step-${idx + 1}`}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80"
              >
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{step.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Common Portal Rejection Reasons */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Top {exam.shortName} Rejection Reasons (And How We Fix Them)
            </h2>
          </div>
          <ul className="space-y-2.5">
            {exam.rejectionReasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/60 border border-red-200/70 text-xs sm:text-sm text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Why Cyber Cafes &amp; Students Trust ExamDoc:</span>
            </div>
            <p className="text-emerald-900/90 leading-relaxed">
              Every downloaded photo and signature is automatically formatted as a Portal-Verified JPG with exact 200 or 300 DPI resolution and guaranteed to stay strictly inside the required KB limit.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (Clickable Accordions) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
            Frequently Asked Questions ({exam.shortName})
          </h2>
        </div>

        <div className="space-y-2.5">
          {exam.faqs.map((faq, idx) => (
            <details
              key={faq.question}
              open={idx === 0}
              className="group rounded-xl bg-slate-50 border border-slate-200 overflow-hidden"
            >
              <summary className="min-h-[48px] px-4 py-3 cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-bold text-slate-900 hover:bg-slate-100/80 transition">
                <span>{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </article>
  );
}
