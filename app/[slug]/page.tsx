import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EXAMS, getExamBySlug } from "@/data/exams";
import ExamDocWorkbench from "@/components/ExamDocWorkbench";
import ExamSeoArticle from "@/components/ExamSeoArticle";
import { ShieldCheck, ChevronRight } from "lucide-react";

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
      title: "Exam Tool Not Found"
    };
  }

  const canonicalUrl = `https://www.examdoc.in/${exam.slug}`;
  const cleanTitleBase = exam.metaTitle.split("|")[0].trim();
  const fullTitle = `${cleanTitleBase} | ExamDoc`;

  return {
    applicationName: "ExamDoc",
    title: cleanTitleBase,
    description: exam.metaDescription,
    keywords: exam.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonicalUrl,
      siteName: "ExamDoc",
      title: fullTitle,
      description: exam.metaDescription
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
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

  const canonicalUrl = `https://www.examdoc.in/${exam.slug}`;

  return (
    <div>
      {/* Clean Compact Dedicated Exam Hero Section */}
      <section className="bg-white py-4 sm:py-6 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1 text-xs text-[#64748B]"
            >
              <Link href="/" className="hover:text-[#2864E8] font-medium transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span className="text-[#2864E8] font-bold truncate">{exam.shortName}</span>
            </nav>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A] text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{exam.conductingBody} Verified</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            {exam.h1}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed line-clamp-2 sm:line-clamp-none">
            {exam.subtitle}
          </p>
        </div>
      </section>

      {/* Pre-Configured 6-Tab All-in-One Workbench */}
      <ExamDocWorkbench initialExamSlug={exam.slug} />

      {/* Authoritative Spec Table / Mobile Cards, HowTo, Rejection Guide, FAQs & JSON-LD */}
      <ExamSeoArticle exam={exam} canonicalUrl={canonicalUrl} />
    </div>
  );
}
