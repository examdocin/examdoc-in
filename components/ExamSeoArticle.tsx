import React from "react";
import { ExamPreset } from "@/data/exams";
import {
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Table,
  ListOrdered,
  Cpu,
  FileCheck
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
      "True 200 DPI, 300 DPI & 600 DPI JFIF APP0 Header Byte Injection (Bytes 13-17)",
      "Binary-Search JPEG Quality & Safe EOI Padding Before 0xFFD9",
      "Name & Date of Photo (DOP) Plaque & 80% Face Coverage Oval Guide",
      "Adaptive Luminance Thresholding for Gray Paper Signatures & Declarations",
      "Pure Client-Side DCTDecode Multi-Page PDF Compressor (<100KB / <300KB)"
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
        name: "ExamDoc.in Client-Side Binary Compliance Engine"
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
    <article className="max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-10">
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

      {/* Official Specification Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {exam.shortName} Official Photo, Signature &amp; PDF Size Specifications ({exam.updatedYear})
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            Authority: {exam.conductingBody}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3.5">Document Type</th>
                <th className="p-3.5">Exact Pixels (W×H)</th>
                <th className="p-3.5">Physical Size (cm)</th>
                <th className="p-3.5">Strict File Size (KB)</th>
                <th className="p-3.5">Mandatory DPI</th>
                <th className="p-3.5">Official Portal Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exam.presets.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="p-3.5 font-bold text-slate-900">{p.label}</td>
                  <td className="p-3.5 font-mono text-blue-700 font-semibold">
                    {p.widthPx} × {p.heightPx} px
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {p.widthCm} × {p.heightCm}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-700">
                    {p.minKB} KB – {p.maxKB} KB
                  </td>
                  <td className="p-3.5 font-mono text-slate-800">
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
              <FileCheck className="w-4 h-4 text-blue-600" />
              Mandatory {exam.shortName} Notification Guidelines:
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              How to Prepare {exam.shortName} Documents in 60 Seconds
            </h2>
          </div>
          <ol className="space-y-3.5">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Top {exam.shortName} Form Rejection Reasons (And How We Fix Them)
            </h2>
          </div>
          <ul className="space-y-3">
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

          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              Why Cyber Cafes Trust ExamDoc&apos;s Binary Engine:
            </div>
            <p className="text-slate-300 leading-relaxed">
              Ordinary online resizers output 96-DPI browser blobs and fail when a small 140×60 signature drops below 10KB. ExamDoc writes exact big-endian 200/300/600 DPI integers into bytes 13–17 of the JFIF APP0 header and pads small files safely before the <code>0xFFD9</code> EOI marker.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQPage Schema Backed) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Frequently Asked Questions ({exam.shortName})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exam.faqs.map((faq) => (
            <div
              key={faq.question}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
            >
              <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* High-Intent Search Query Tags */}
        <div className="pt-4 border-t border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Verified Search Queries Covered:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {exam.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
