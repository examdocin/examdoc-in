import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["*", "Googlebot", "Googlebot-Image"],
        allow: ["/", "/icon.png", "/apple-icon.png", "/favicon.ico"]
      }
    ],
    sitemap: "https://www.examdoc.in/sitemap.xml",
    host: "https://www.examdoc.in"
  };
}
