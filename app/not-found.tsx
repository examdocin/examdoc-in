import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
        Exam Tool Not Found
      </h1>
      <p className="text-sm text-slate-600">
        The requested exam specification page could not be found. Return to the ExamDoc homepage to select your exam preset.
      </p>
      <div>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition"
        >
          Open ExamDoc Studio
        </Link>
      </div>
    </div>
  );
}
