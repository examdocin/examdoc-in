import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8"
};

export const metadata: Metadata = {
  metadataBase: new URL("https://examdoc.in"),
  title: {
    default:
      "ExamDoc.in — SSC, UPSC, IBPS, NEET, PAN Photo & Signature Resizer (20KB-50KB, 200/300 DPI) + PDF <100KB",
    template: "%s | ExamDoc.in"
  },
  description:
    "India's #1 100% client-side government exam photo, signature, thumb, handwritten declaration & marksheet/Aadhaar PDF (<100KB / <300KB) utility. True 200/300 DPI JFIF binary header, Name & Date (DOP) plaque, and SSC Live Webcam.",
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
    canonical: "https://examdoc.in"
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://examdoc.in",
    siteName: "ExamDoc.in",
    title:
      "ExamDoc.in — India's #1 Govt Exam Photo, Signature, Declaration & PDF (<100KB) Utility",
    description:
      "100% browser-based 200/300 DPI Photo Resizer (with Name & DOP), Gray-Paper Signature Whitener, Aadhaar/Marksheet PDF Packer (<100KB), SSC Live Webcam & 4x6 Print Sheet."
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
  return (
    <html lang="en-IN">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
