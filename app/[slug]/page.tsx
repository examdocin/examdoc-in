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
      {/* Dedicated Exam Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-5 pb-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-400 mb-2.5"
          >
            <Link href="/" className="hover:text-white transition">
              ExamDoc.in Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300">{exam.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-400 font-semibold">{exam.shortName}</span>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified for {exam.conductingBody} ({exam.updatedYear} Rules)
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {exam.h1}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                {exam.subtitle}
              </p>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs space-y-1 shrink-0">
              <div className="text-slate-400 font-semibold">Official Portal Target:</div>
              <a
                href={exam.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline font-mono font-bold inline-flex items-center gap-1"
              >
                <span>{exam.officialPortal.replace("https://", "")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="text-[11px] text-emerald-300 font-mono">
                JFIF 200/300 DPI + Exact KB Lock
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
