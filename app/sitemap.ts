import type { MetadataRoute } from "next";
import { EXAMS } from "@/data/exams";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://examdoc.in";
  const lastModified = new Date();

  const examEntries: MetadataRoute.Sitemap = EXAMS.map((exam) => ({
    url: `${baseUrl}/${exam.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9
  }));

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0
    },
    ...examEntries
  ];
}
