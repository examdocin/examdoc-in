import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EXAMS, getExamBySlug } from "@/data/exams";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";

interface ExamSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return EXAMS.map((exam) => ({
    slug: exam.slug
  }));
}

export async function generateMetadata({ params }: ExamSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const exam = getExamBySlug(slug);
  if (!exam) {
    return {
      title: "Exam Tool Not Found | ExamDoc.in"
    };
  }

  const canonicalUrl = `https://examdoc.in/${exam.slug}`;

  return {
    title: exam.metaTitle,
    description: exam.metaDescription,
    keywords: exam.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonicalUrl,
      siteName: "ExamDoc.in",
      title: exam.metaTitle,
      description: exam.metaDescription
    },
    twitter: {
      card: "summary_large_image",
      title: exam.metaTitle,
      description: exam.metaDescription
    }
  };
}

export default async function ExamSlugPage({ params }: ExamSlugPageProps) {
  const { slug } = await params;
  const exam = getExamBySlug(slug);

  if (!exam) {
    notFound();
  }

  const canonicalUrl = `https://examdoc.in/${exam.slug}`;

  return (
    <div>
      {/* Clean, Light Dedicated Exam Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/80 via-indigo-50/30 to-slate-50 pt-5 pb-3 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5"
          >
            <Link href="/" className="hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>{exam.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 font-bold">{exam.shortName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified for {exam.conductingBody} ({exam.updatedYear})
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {exam.h1}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {exam.subtitle}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-xs space-y-1 shrink-0 shadow-2xs">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                Official Portal
              </div>
              <a
                href={exam.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1 text-sm"
              >
                <span>{exam.officialPortal.replace("https://", "")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="text-[11px] text-emerald-700 font-semibold">
                {exam.widthPx}×{exam.heightPx} px • {exam.minKB}–{exam.maxKB} KB • {exam.dpi} DPI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Configured 5-Tab All-in-One Workbench */}
      <ExamDocWorkbench initialExamSlug={exam.slug} />

      {/* Authoritative Spec Table, HowTo, Rejection Guide, FAQs & JSON-LD */}
      <ExamSeoArticle exam={exam} canonicalUrl={canonicalUrl} />
    </div>
  );
}
