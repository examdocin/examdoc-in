import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2864E8"
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.examdoc.in"),
  applicationName: "ExamDoc",
  title: {
    default: "Free Govt Exam Photo, Signature & PDF Resizer | ExamDoc",
    template: "%s | ExamDoc"
  },
  description:
    "Resize SSC, UPSC, IBPS, RRB, NEET & PAN photos (20KB–50KB), signatures (10KB–20KB), and marksheet PDFs (<100KB) 100% privately in your browser.",
  keywords: [
    "ssc photo maker 20kb to 50kb with name and date",
    "marksheet pdf size reducer under 100kb",
    "nsdl pan photo 213x213 300 dpi",
    "upsc photo size 350x350 to 1000x1000 pixels",
    "ibps signature 140x60 10kb to 20kb",
    "ibps hand written declaration 800x400 50kb to 100kb",
    "neet photo maker 80% face coverage with name and date",
    "aadhaar front back merge pdf under 100kb"
  ],
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Govt Exam Photo, Signature & PDF Resizer | ExamDoc",
    description:
      "Resize SSC, UPSC, IBPS, RRB, NEET & PAN photos (20KB–50KB), signatures (10KB–20KB), and marksheet PDFs (<100KB) 100% privately in your browser."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.examdoc.in/#website",
        name: "ExamDoc",
        alternateName: ["ExamDoc.in", "www.examdoc.in", "ExamDoc India"],
        url: "https://www.examdoc.in/",
        publisher: {
          "@id": "https://www.examdoc.in/#organization"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://www.examdoc.in/#organization",
        name: "ExamDoc",
        url: "https://www.examdoc.in/",
        logo: {
          "@type": "ImageObject",
          url: "https://www.examdoc.in/icon.png",
          width: 192,
          height: 192
        }
      }
    ]
  };

  return (
    <html lang="en-IN" className={`${inter.variable} overflow-x-hidden`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-[#F5F7FA] text-[#0F172A] overflow-x-hidden antialiased`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-RYET9N3JF1" />
    </html>
  );
}
