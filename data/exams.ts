export type ToolTabId =
  | "photo"
  | "signature"
  | "pdf"
  | "scanner"
  | "webcam"
  | "printsheet";

export interface DocumentPreset {
  id: string;
  label: string;
  tab: ToolTabId;
  widthPx: number;
  heightPx: number;
  widthCm: string;
  heightCm: string;
  minKB: number;
  maxKB: number;
  dpi: 200 | 300 | 600;
  requiresNameDop: boolean;
  requiresFaceOval: boolean;
  format: "JPG" | "PDF";
  notes: string;
}

export interface ExamFAQ {
  question: string;
  answer: string;
}

export interface ExamHowToStep {
  name: string;
  text: string;
}

export interface ExamPreset {
  slug: string;
  shortName: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  conductingBody: string;
  officialPortal: string;
  category:
    | "Central Govt"
    | "Banking & Insurance"
    | "Medical & Engineering"
    | "Identity & PAN"
    | "Railways & Post"
    | "State PSC & Police"
    | "PDF & Marksheet";
  defaultTab: ToolTabId;
  widthPx: number;
  heightPx: number;
  widthCm: string;
  heightCm: string;
  minKB: number;
  maxKB: number;
  dpi: 200 | 300 | 600;
  requiresNameDop: boolean;
  requiresFaceOval: boolean;
  format: "JPG" | "PDF";
  guidelines: string[];
  keywords: string[];
  presets: DocumentPreset[];
  declarationText?: string;
  rejectionReasons: string[];
  howToSteps: ExamHowToStep[];
  faqs: ExamFAQ[];
  updatedYear: string;
}

export type ExamSpec = ExamPreset;

export const OFFICIAL_DECLARATIONS: Record<
  string,
  { title: string; authority: string; text: string }
> = {
  IBPS: {
    title: "IBPS PO / Clerk / SO / RRB Official Hand-Written Declaration",
    authority: "Institute of Banking Personnel Selection (ibps.in)",
    text: `I, _______ (Name of the candidate), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.`
  },
  SBI: {
    title: "SBI PO / SBI Clerk (Junior Associates) Official Declaration",
    authority: "State Bank of India (sbi.co.in)",
    text: `I, _______ (Name of the candidate), Date of Birth ______ hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required. The signature, photograph and left-hand thumb impression is of mine.`
  },
  RBI: {
    title: "RBI Grade B / RBI Assistant Hand-Written Declaration",
    authority: "Reserve Bank of India (rbi.org.in)",
    text: `I, _______ (Name of the candidate), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.`
  },
  NABARD: {
    title: "NABARD Grade A / B & LIC AAO Hand-Written Declaration",
    authority: "NABARD / LIC India",
    text: `I, _______ (Name of the candidate), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.`
  }
};

export const EXAMS: ExamPreset[] = [
  // 1. SSC CGL / CHSL / GD / MTS Photo 20-50KB
  {
    slug: "ssc-cgl-photo-resizer-20kb-to-50kb",
    shortName: "SSC CGL / GD Photo (20-50KB)",
    title: "SSC CGL, CHSL, GD & MTS Photo Maker (20KB-50KB, 3.5x4.5cm, Name & Date)",
    metaTitle: "SSC Photo Maker 20KB to 50KB with Name & Date (3.5x4.5 cm, 200 DPI) | ssc.gov.in",
    metaDescription:
      "Resize SSC CGL, CHSL, GD, MTS passport photo to exact 20KB-50KB (275x354 px / 3.5x4.5 cm, 200 DPI) with optional Name & Date of Photo (DOP) plaque and SSC Live Webcam.",
    h1: "SSC CGL, CHSL, GD & MTS Photo Maker (20KB to 50KB) with Name & Date",
    subtitle:
      "100% Compliant with ssc.gov.in OTR & Application Portal. Converts WhatsApp WebP/PNG/JPG to baseline 0xFFD8FFE0 JPG with 200 DPI JFIF header, 80% face oval, and Name/DOP plaque.",
    conductingBody: "Staff Selection Commission (SSC)",
    officialPortal: "https://ssc.gov.in",
    category: "Central Govt",
    defaultTab: "photo",
    widthPx: 275,
    heightPx: 354,
    widthCm: "3.5 cm",
    heightCm: "4.5 cm",
    minKB: 20,
    maxKB: 50,
    dpi: 200,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Dimensions must be 3.5 cm (width) × 4.5 cm (height), which equals 275 × 354 pixels at 200 DPI.",
      "File size must be strictly between 20 KB and 50 KB in baseline JPEG (.jpg) format.",
      "Both ears must be clearly visible with 80% face coverage against a plain white/light background.",
      "No cap, no dark glasses, and zero lens glare/reflection on spectacles."
    ],
    keywords: [
      "ssc photo maker 20kb to 50kb with name and date",
      "ssc cgl photo size 3.5x4.5 cm in pixels",
      "ssc gd photo resizer 20kb to 50kb online",
      "ssc.gov.in live photo capture tool"
    ],
    presets: [
      {
        id: "ssc-cgl-photo",
        label: "SSC Passport Photo (275×354 px, 20-50KB)",
        tab: "photo",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "3.5x4.5 cm at 200 DPI, 20KB-50KB, plain light background, optional Name & DOP plaque."
      },
      {
        id: "ssc-cgl-sign",
        label: "SSC Signature (315×157 px, 10-20KB)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "4.0 cm",
        heightCm: "2.0 cm",
        minKB: 10,
        maxKB: 20,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Running handwriting on pure white background, 10KB to 20KB."
      },
      {
        id: "ssc-cgl-webcam",
        label: "SSC Live Webcam Capture (20-50KB)",
        tab: "webcam",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: true,
        format: "JPG",
        notes: "Eye-level camera capture with plain wall brightness booster."
      }
    ],
    rejectionReasons: [
      "Wearing spectacles with flash glare or tinted lenses (#1 cause of SSC form rejection).",
      "Side pose, selfie angle, or face covering less than 75% of the frame.",
      "File saved as WhatsApp WebP renamed to .jpg without true 0xFFD8FFE0 JFIF binary header."
    ],
    howToSteps: [
      {
        name: "Upload Photo or Open SSC Live Webcam",
        text: "Select your photo from mobile/PC (WhatsApp WebP, PNG, HEIC, or JPG) or switch to Tab 4 for SSC Live Webcam capture."
      },
      {
        name: "Align Face inside 80% Oval & Toggle Name/DOP",
        text: "Use the zoom slider so your head and shoulders fit the green 80% oval guide. Toggle Name & Date of Photo (DOP) if needed."
      },
      {
        name: "Download Verified 20KB-50KB 200 DPI JPG",
        text: "Click Download to get a binary-verified baseline JPEG (0xFFD8FFE0) guaranteed between 20KB and 50KB with exact 200 DPI JFIF header."
      }
    ],
    faqs: [
      {
        question: "Is Name and Date of Photo (DOP) compulsory in SSC CGL / GD / CHSL 2026?",
        answer:
          "On the new ssc.gov.in portal, live webcam capture is primary, while uploaded photos in certain regional or special forms still benefit from a clean DOP plaque. Our tool lets you toggle the Name & Date white plaque ON or OFF in one click."
      },
      {
        question: "Why does ssc.gov.in reject my 35KB photo saying 'Invalid File Format'?",
        answer:
          "Images sent via WhatsApp are encoded as Google WebP even if the filename ends in .jpg. ExamDoc converts raw pixels into a true baseline JPEG (0xFFD8FFE0) with an injected 200 DPI JFIF APP0 header."
      }
    ],
    updatedYear: "2026"
  },

  // 2. SSC Signature 10-20KB
  {
    slug: "ssc-signature-resizer-10kb-to-20kb",
    shortName: "SSC Signature (10-20KB)",
    title: "SSC Signature Resizer 10KB to 20KB (4.0x2.0 cm / 315x157 px, Pure White Paper)",
    metaTitle: "SSC Signature Resizer 10KB to 20KB (4cm x 2cm, 200 DPI) & Gray Paper Whitener",
    metaDescription:
      "Resize SSC CGL, CHSL, GD, MTS signature to exact 10KB-20KB (4.0 x 2.0 cm / 315x157 px, 200 DPI). Adaptive luminance thresholding bleaches gray mobile paper to pure white.",
    h1: "SSC Signature Resizer (10KB to 20KB, 4.0×2.0 cm) + Gray Paper Whitener",
    subtitle:
      "Turns dark or shadowed smartphone photos of notebook signatures into crisp pure-white (#FFFFFF) 315×157 px JPEGs strictly locked between 10KB and 20KB.",
    conductingBody: "Staff Selection Commission (SSC)",
    officialPortal: "https://ssc.gov.in",
    category: "Central Govt",
    defaultTab: "signature",
    widthPx: 315,
    heightPx: 157,
    widthCm: "4.0 cm",
    heightCm: "2.0 cm",
    minKB: 10,
    maxKB: 20,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "JPG",
    guidelines: [
      "Dimensions must be 4.0 cm (width) × 2.0 cm (height) = 315 × 157 pixels at 200 DPI.",
      "File size must be strictly between 10 KB and 20 KB in JPG/JPEG format.",
      "Sign in running hand with black or dark blue ink on pure white unruled paper.",
      "Never sign in ALL BLOCK CAPITAL letters."
    ],
    keywords: [
      "ssc signature resizer 10kb to 20kb",
      "ssc signature size 4cm x 2cm in pixels",
      "remove gray background from signature for ssc",
      "increase signature size from 5kb to 15kb for ssc"
    ],
    presets: [
      {
        id: "ssc-sign-10-20",
        label: "SSC Signature (315×157 px, 10-20KB)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "4.0 cm",
        heightCm: "2.0 cm",
        minKB: 10,
        maxKB: 20,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Running handwriting on pure white background, 10KB to 20KB."
      },
      {
        id: "ssc-photo-20-50",
        label: "SSC Passport Photo (275×354 px, 20-50KB)",
        tab: "photo",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "3.5x4.5 cm at 200 DPI, 20KB-50KB."
      }
    ],
    rejectionReasons: [
      "Signature uploaded in ALL CAPITAL LETTERS.",
      "Dark gray mobile camera shadow on paper making the signature blurry.",
      "Cropped signature dropping to 5KB-7KB and failing SSC's 10KB minimum size check."
    ],
    howToSteps: [
      {
        name: "Upload Smartphone Photo of Your Signature",
        text: "Sign on white paper and select the photo in Tab 2."
      },
      {
        name: "Bleach Gray Paper to Pure #FFFFFF White",
        text: "Adjust the Gray Paper Bleaching slider so camera shadows vanish and ink strokes become sharp."
      },
      {
        name: "Download Guaranteed 10KB-20KB JPG",
        text: "Even if the clean image compresses to 6KB, our safe JPEG COM byte padder brings it cleanly to ~15KB."
      }
    ],
    faqs: [
      {
        question: "Why does my SSC signature become only 6KB after cropping to 4cm x 2cm?",
        answer:
          "Because a pure white 315x157 image has very little entropy, standard JPEG encoders compress it to 5KB-7KB, which SSC rejects ('File size must be at least 10KB'). ExamDoc pads the JPEG container safely before 0xFFD9 so it always lands at 14KB-17KB."
      }
    ],
    updatedYear: "2026"
  },

  // 3. RRB NTPC / Group D / ALP Photo 30-70KB
  {
    slug: "rrb-ntpc-group-d-photo-resizer-30kb-to-70kb",
    shortName: "RRB NTPC Photo (30-70KB)",
    title: "Railway RRB NTPC, Group D, ALP & JE Photo Resizer (30KB-70KB, 200 DPI)",
    metaTitle: "Railway RRB Photo Resizer 30KB to 70KB (3.5x4.5 cm, 200 DPI) | rrbapply.gov.in",
    metaDescription:
      "Resize Railway Recruitment Board (RRB NTPC, Group D, ALP, Technician, JE) passport photo to exact 30KB-70KB (3.5x4.5 cm / 275x354 px, 200 DPI) with white background boost.",
    h1: "Railway RRB (NTPC, Group D, ALP, JE) Photo Maker (30KB to 70KB)",
    subtitle:
      "Configured for rrbapply.gov.in. Locks passport photo strictly between 30KB and 70KB with true 200 DPI JFIF header and generates an 8-photo 4×6 print sheet for CBT & DV.",
    conductingBody: "Railway Recruitment Boards (RRB)",
    officialPortal: "https://www.rrbapply.gov.in",
    category: "Railways & Post",
    defaultTab: "photo",
    widthPx: 275,
    heightPx: 354,
    widthCm: "3.5 cm",
    heightCm: "4.5 cm",
    minKB: 30,
    maxKB: 70,
    dpi: 200,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Dimensions: 3.5 cm × 4.5 cm (275 × 354 pixels at 200 DPI / 320 × 240 minimum).",
      "File size must be strictly between 30 KB and 70 KB in JPG/JPEG format.",
      "Clear white or light-colored plain background with at least 80% face visibility.",
      "Candidates must keep at least 12 physical copies of the exact same photograph for CBT-1, CBT-2 & DV."
    ],
    keywords: [
      "rrb ntpc photo size 30kb to 70kb",
      "railway group d photo resizer 30kb to 70kb",
      "rrb alp photo maker online 200 dpi",
      "rrbapply.gov.in photo upload error solution"
    ],
    presets: [
      {
        id: "rrb-ntpc-photo",
        label: "RRB Passport Photo (275×354 px, 30-70KB)",
        tab: "photo",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 32,
        maxKB: 68,
        dpi: 200,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "30KB to 70KB at 200 DPI on plain white background."
      },
      {
        id: "rrb-ntpc-sign",
        label: "RRB Signature (315×157 px, 30-70KB)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "4.0 cm",
        heightCm: "2.0 cm",
        minKB: 32,
        maxKB: 68,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "30KB to 70KB at 200 DPI on pure white background."
      }
    ],
    rejectionReasons: [
      "Photo size below 30KB (many standard 275x354 photos are only 22KB and get rejected by rrbapply.gov.in).",
      "Tinted glasses or cap obscuring forehead.",
      "Mismatch between online application photo and physical photo brought to CBT center."
    ],
    howToSteps: [
      {
        name: "Upload Passport Photo in Tab 1",
        text: "Select your photo and align your face inside the 80% oval guide."
      },
      {
        name: "Download Verified 30KB-70KB JPG",
        text: "Our binary engine ensures the file never drops below 30KB (targets ~48KB)."
      },
      {
        name: "Download 4×6 Print Sheet in Tab 5",
        text: "Switch to Tab 5 to save an 8-photo or 12-photo 4×6 inch sheet so you have identical physical copies for exam day."
      }
    ],
    faqs: [
      {
        question: "Why does rrbapply.gov.in reject my 25KB SSC photo?",
        answer:
          "SSC allows 20KB-50KB, whereas Railway RRB mandates a minimum of 30KB (30KB to 70KB). ExamDoc automatically boosts your 275x354 photo into the 42KB-55KB sweet spot."
      }
    ],
    updatedYear: "2026"
  },

  // 4. RRB Signature 30-70KB
  {
    slug: "rrb-railway-signature-resizer-30kb-to-70kb",
    shortName: "RRB Signature (30-70KB)",
    title: "Railway RRB Signature Resizer 30KB to 70KB (315x157 px, Safe Byte Booster)",
    metaTitle: "RRB Signature Resizer 30KB to 70KB (4cm x 2cm, 200 DPI) | Increase Signature KB",
    metaDescription:
      "Resize and boost Railway RRB NTPC, Group D, ALP, JE signature to exact 30KB-70KB (315x157 px, 200 DPI) with pure white background bleaching and safe EOI byte padding.",
    h1: "Railway RRB Signature Resizer & KB Booster (30KB to 70KB)",
    subtitle:
      "Solves RRB's toughest upload problem: boosts tiny 8KB cropped signatures up to a 100% valid 45KB (30KB–70KB) 200 DPI JPEG while keeping 315×157 px dimensions.",
    conductingBody: "Railway Recruitment Boards (RRB)",
    officialPortal: "https://www.rrbapply.gov.in",
    category: "Railways & Post",
    defaultTab: "signature",
    widthPx: 315,
    heightPx: 157,
    widthCm: "4.0 cm",
    heightCm: "2.0 cm",
    minKB: 30,
    maxKB: 70,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "JPG",
    guidelines: [
      "Dimensions: 4.0 cm × 2.0 cm (315 × 157 pixels at 200 DPI).",
      "File size must be strictly between 30 KB and 70 KB in JPG format.",
      "Must be signed in running hand (never in block capital letters) on white paper."
    ],
    keywords: [
      "rrb signature size 30kb to 70kb",
      "how to increase signature size to 30kb for railway exam",
      "rrbapply signature 30kb to 70kb converter",
      "railway group d signature resizer"
    ],
    presets: [
      {
        id: "rrb-sign-30-70",
        label: "RRB Signature (315×157 px, 30-70KB)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "4.0 cm",
        heightCm: "2.0 cm",
        minKB: 32,
        maxKB: 68,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Automatically pads small 315x157 signatures into the 32KB-68KB band before 0xFFD9."
      },
      {
        id: "rrb-photo-30-70",
        label: "RRB Passport Photo (275×354 px, 30-70KB)",
        tab: "photo",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 32,
        maxKB: 68,
        dpi: 200,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "30KB to 70KB at 200 DPI."
      }
    ],
    rejectionReasons: [
      "Cropped signature weighing only 7KB-12KB and getting blocked by RRB's 30KB minimum requirement.",
      "Gray notebook lines visible behind signature."
    ],
    howToSteps: [
      {
        name: "Upload Signature in Tab 2",
        text: "Select your signature photo. The preset locks dimensions to 315×157 px and target range to 32KB–68KB."
      },
      {
        name: "Whiten Paper & Download 45KB Verified JPG",
        text: "Click Download to save your 200 DPI signature binary-padded safely into the 30KB–70KB window."
      }
    ],
    faqs: [
      {
        question: "How do I increase my RRB signature size from 8KB to 30KB-70KB without stretching pixels?",
        answer:
          "ExamDoc keeps your exact 315x157 pixel dimensions and injects a standards-compliant JPEG COM metadata block right before the 0xFFD9 EOI marker so the file weighs ~48KB and passes rrbapply.gov.in validation."
      }
    ],
    updatedYear: "2026"
  },

  // 5. IBPS / SBI Photo 20-50KB (200x230 px)
  {
    slug: "ibps-sbi-photo-resizer-200x230-20kb-50kb",
    shortName: "IBPS / SBI Photo (20-50KB)",
    title: "IBPS & SBI PO / Clerk Photo Resizer (200x230 Pixels, 20KB-50KB, 200 DPI)",
    metaTitle: "IBPS & SBI Photo Resizer 200x230 Pixels (20KB to 50KB, 200 DPI) + 140x60 Signature",
    metaDescription:
      "Resize IBPS PO, Clerk, SO, RRB & SBI passport photo to exact 200x230 pixels (4.5x3.5 cm, 20KB-50KB, 200 DPI) and signature to 140x60 pixels (10KB-20KB).",
    h1: "IBPS & SBI PO / Clerk Photo Resizer (200×230 px, 20KB–50KB) & Signature (140×60 px)",
    subtitle:
      "Official banking portal specifications for ibps.in and sbi.co.in: 200×230 px Photo (20–50KB) and 140×60 px Signature (10–20KB) with true 200 DPI JFIF header.",
    conductingBody: "IBPS & State Bank of India",
    officialPortal: "https://www.ibps.in",
    category: "Banking & Insurance",
    defaultTab: "photo",
    widthPx: 200,
    heightPx: 230,
    widthCm: "3.5 cm",
    heightCm: "4.5 cm",
    minKB: 20,
    maxKB: 50,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Preferred Photo Dimensions: 200 × 230 pixels (4.5 cm × 3.5 cm) at 200 DPI.",
      "Photo File Size: Strictly between 20 KB and 50 KB.",
      "Signature Dimensions: 140 × 60 pixels, 10 KB to 20 KB in black ink on white paper."
    ],
    keywords: [
      "ibps photo size 200x230 pixels 20kb to 50kb",
      "sbi clerk photo and signature resizer",
      "ibps signature 140x60 pixels 10kb to 20kb",
      "ibps rrb photo maker online"
    ],
    presets: [
      {
        id: "ibps-photo-200x230",
        label: "IBPS / SBI Photo (200×230 px, 20-50KB)",
        tab: "photo",
        widthPx: 200,
        heightPx: 230,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: true,
        format: "JPG",
        notes: "Exact 200x230 pixels, 20KB to 50KB, 200 DPI."
      },
      {
        id: "ibps-sign-140x60",
        label: "IBPS / SBI Signature (140×60 px, 10-20KB)",
        tab: "signature",
        widthPx: 140,
        heightPx: 60,
        widthCm: "4.0 cm",
        heightCm: "1.5 cm",
        minKB: 10,
        maxKB: 20,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Exact 140x60 pixels, 10KB to 20KB, black ink on pure white paper."
      }
    ],
    rejectionReasons: [
      "140x60 pixel signature compressing to 3KB-4KB and failing IBPS's 10KB minimum check.",
      "Flash reflection on glasses or dark background."
    ],
    howToSteps: [
      {
        name: "Resize Photo to 200×230 px (20-50KB)",
        text: "Upload your photo in Tab 1 and click Download."
      },
      {
        name: "Resize Signature to 140×60 px (10-20KB)",
        text: "Switch to Tab 2 to bleach gray paper and export a guaranteed 14KB-18KB 140×60 signature."
      }
    ],
    faqs: [
      {
        question: "Why does my 140x60 IBPS signature become only 3KB?",
        answer:
          "140x60 pixels is a very small canvas (8,400 pixels). ExamDoc uses safe JPEG COM byte padding before 0xFFD9 so your 140x60 signature lands cleanly at ~15KB (inside 10KB-20KB)."
      }
    ],
    updatedYear: "2026"
  },

  // 6. IBPS Left Thumb Impression 20-50KB
  {
    slug: "ibps-sbi-left-thumb-impression-resizer-20kb-50kb",
    shortName: "IBPS Left Thumb (20-50KB)",
    title: "IBPS & SBI Left Thumb Impression Resizer (240x240 px, 20KB-50KB, 200 DPI)",
    metaTitle: "IBPS Left Thumb Impression Size Resizer 20KB to 50KB (240x240 px / 3x3 cm)",
    metaDescription:
      "Resize and enhance IBPS PO, Clerk, RRB & SBI Left Thumb Impression to exact 240x240 pixels (3cm x 3cm, 20KB-50KB, 200 DPI). Enhances blue or black stamp pad ink ridges on pure white paper.",
    h1: "IBPS & SBI Left Thumb Impression Resizer & Ridge Enhancer (20KB–50KB)",
    subtitle:
      "Bleaches gray paper around your thumbprint to pure #FFFFFF white while sharpening blue or black stamp-pad friction ridges at 240×240 px (20KB–50KB, 200 DPI).",
    conductingBody: "IBPS / SBI / RBI / NABARD",
    officialPortal: "https://www.ibps.in",
    category: "Banking & Insurance",
    defaultTab: "signature",
    widthPx: 240,
    heightPx: 240,
    widthCm: "3.0 cm",
    heightCm: "3.0 cm",
    minKB: 20,
    maxKB: 50,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "JPG",
    guidelines: [
      "Dimensions: 240 × 240 pixels (3.0 cm × 3.0 cm) at 200 DPI.",
      "File Size: 20 KB to 50 KB in JPG/JPEG format.",
      "Use blue or black stamp pad ink on white paper; do not press too hard so ridge lines stay distinct."
    ],
    keywords: [
      "ibps left thumb impression size 20kb to 50kb",
      "sbi clerk left thumb impression 240x240 pixels",
      "thumb impression background whitener online",
      "ibps thumb impression size in cm and pixels"
    ],
    presets: [
      {
        id: "ibps-thumb-240x240",
        label: "Left Thumb Impression (240×240 px, 20-50KB)",
        tab: "signature",
        widthPx: 240,
        heightPx: 240,
        widthCm: "3.0 cm",
        heightCm: "3.0 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "240x240 pixels (3x3 cm) at 200 DPI, 20KB to 50KB."
      }
    ],
    rejectionReasons: [
      "Smudged ink blob where thumb ridge lines are completely filled in.",
      "Dark gray paper background from indoor smartphone photography.",
      "File size below 20KB."
    ],
    howToSteps: [
      {
        name: "Upload Mobile Photo of Thumb Impression",
        text: "Press your left thumb gently on a blue/black stamp pad and then onto white paper. Upload the photo in Tab 2."
      },
      {
        name: "Select Royal Blue or Jet Black Ink Mode",
        text: "Use the Adaptive Bleaching slider to make the paper pure white while keeping thumb ridges sharp."
      },
      {
        name: "Download 240×240 px (20KB-50KB) JPG",
        text: "Click Download to save your binary-verified 200 DPI thumb impression."
      }
    ],
    faqs: [
      {
        question: "Can I use blue stamp pad ink for IBPS and SBI left thumb impression?",
        answer:
          "Yes, both black and blue stamp pad ink on white paper are officially accepted by IBPS and SBI. You can even toggle between Natural, Jet Black, and Royal Blue ink modes in Tab 2."
      }
    ],
    updatedYear: "2026"
  },

  // 7. IBPS Handwritten Declaration 50-100KB
  {
    slug: "ibps-sbi-handwritten-declaration-resizer-800x400-50kb-100kb",
    shortName: "IBPS Declaration (50-100KB)",
    title: "IBPS & SBI Hand-Written Declaration Resizer (800x400 px, 50KB-100KB) + Official Text",
    metaTitle: "IBPS Hand Written Declaration Size 50KB to 100KB (800x400 px, 10x5 cm) + Text Format",
    metaDescription:
      "Resize IBPS PO, Clerk, SO, RRB & SBI Hand-Written Declaration to exact 800x400 pixels (10cm x 5cm, 50KB-100KB, 200 DPI). Bleach gray mobile paper to pure white and copy official declaration text.",
    h1: "IBPS & SBI Hand-Written Declaration Maker (800×400 px, 50KB–100KB) + Official Text",
    subtitle:
      "Copy the official IBPS/SBI/RBI declaration text, snap a photo of your handwritten sheet, bleach gray phone shadows to pure #FFFFFF white, and export at exact 800×400 px (50KB–100KB).",
    conductingBody: "IBPS / State Bank of India / RBI",
    officialPortal: "https://www.ibps.in",
    category: "Banking & Insurance",
    defaultTab: "signature",
    widthPx: 800,
    heightPx: 400,
    widthCm: "10.0 cm",
    heightCm: "5.0 cm",
    minKB: 50,
    maxKB: 100,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "JPG",
    declarationText: OFFICIAL_DECLARATIONS.IBPS.text,
    guidelines: [
      "Dimensions: 800 × 400 pixels (10.0 cm × 5.0 cm) at 200 DPI.",
      "File Size: Strictly between 50 KB and 100 KB in JPG/JPEG format.",
      "Must be written in candidate's own running handwriting in English with black ink on pure white paper.",
      "Declarations written in ALL CAPITAL LETTERS are summarily rejected."
    ],
    keywords: [
      "ibps hand written declaration size 50kb to 100kb",
      "ibps declaration 800x400 pixels converter",
      "sbi po clerk hand written declaration text format",
      "remove shadow from handwritten declaration online"
    ],
    presets: [
      {
        id: "ibps-decl-800x400",
        label: "Hand-Written Declaration (800×400 px, 50-100KB)",
        tab: "signature",
        widthPx: 800,
        heightPx: 400,
        widthCm: "10.0 cm",
        heightCm: "5.0 cm",
        minKB: 50,
        maxKB: 100,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "10cm x 5cm (800x400 px at 200 DPI), strictly 50KB to 100KB."
      }
    ],
    rejectionReasons: [
      "Declaration written in CAPITAL LETTERS or blue ink instead of black ink.",
      "Uneven gray camera shadow across the 10x5cm paper.",
      "File size below 50KB after whitening the background."
    ],
    howToSteps: [
      {
        name: "Copy Official IBPS or SBI Text in Tab 2",
        text: "Type your name in the Declaration Generator box to copy the exact official wording."
      },
      {
        name: "Write on White Paper & Upload Photo",
        text: "Write neatly with a black pen on unruled white paper and upload the photo to Tab 2."
      },
      {
        name: "Whiten Paper & Export 50KB-100KB JPG",
        text: "Our Adaptive Luminance Thresholding bleaches the paper to pure white and locks the file size between 55KB and 92KB."
      }
    ],
    faqs: [
      {
        question: "Why does my whitened 800x400 declaration drop to 32KB and get rejected by IBPS?",
        answer:
          "When gray background noise is cleaned to pure #FFFFFF white, JPEG compression often drops an 800x400 image to ~30KB, which fails IBPS's 50KB minimum rule. ExamDoc automatically pads the JPEG before 0xFFD9 so it always lands at ~72KB (strictly within 50KB-100KB)."
      }
    ],
    updatedYear: "2026"
  },

  // 8. NEET UG Passport Photo (10-200KB, 80% Face, Name & Date)
  {
    slug: "neet-ug-photo-resizer-80-percent-face-name-date",
    shortName: "NEET UG Photo (80% Face)",
    title: "NEET UG Passport Photo Maker (10KB-200KB, 80% Face Guide, Name & Date)",
    metaTitle: "NEET Photo Maker with Name & Date (80% Face Coverage, 10KB-200KB) | NTA NEET UG",
    metaDescription:
      "Create NTA NEET UG Passport Photo (10KB-200KB, 3.5x4.5cm, 300 DPI) with live 80% Face Coverage Oval Guide (ears visible), mandatory Candidate Name & Date of Photo plaque, and Signature (4-30KB).",
    h1: "NEET UG Passport Photo Maker (80% Face Oval + Name & Date Plaque)",
    subtitle:
      "Engineered for neet.nta.nic.in. Aligns your head & ears to NTA's 80% face coverage rule, prints your Name & Date of Photograph at the bottom, and exports at 300 DPI.",
    conductingBody: "National Testing Agency (NTA)",
    officialPortal: "https://neet.nta.nic.in",
    category: "Medical & Engineering",
    defaultTab: "photo",
    widthPx: 413,
    heightPx: 531,
    widthCm: "3.5 cm",
    heightCm: "4.5 cm",
    minKB: 15,
    maxKB: 180,
    dpi: 300,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Passport Photo Size: 10 KB to 200 KB (3.5 cm × 4.5 cm = 413 × 531 pixels at 300 DPI).",
      "80% Face Coverage: Face must occupy 80% of the frame with both ears clearly visible on a pure white background.",
      "Candidate Name and Date of Taking Photograph (DOP) must be clearly printed at the bottom.",
      "Left and Right hand fingers and thumb impressions (all 10 fingers) required between 10 KB and 200 KB."
    ],
    keywords: [
      "neet photo maker with name and date 80% face",
      "nta neet passport size photo 10kb to 200kb",
      "neet signature resizer 4kb to 30kb",
      "neet 10 fingers and thumb impression resizer"
    ],
    presets: [
      {
        id: "neet-ug-passport",
        label: "NEET Passport Photo (413×531 px, 80% Face + DOP)",
        tab: "photo",
        widthPx: 413,
        heightPx: 531,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 15,
        maxKB: 180,
        dpi: 300,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "80% face coverage, white background, Candidate Name & Date of Photo at bottom (10KB-200KB)."
      },
      {
        id: "neet-ug-sign",
        label: "NEET Signature (315×157 px, 4-30KB)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "3.5 cm",
        heightCm: "1.5 cm",
        minKB: 6,
        maxKB: 28,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Running hand signature in black ink on white paper, 4KB to 30KB."
      }
    ],
    rejectionReasons: [
      "Face occupying less than 80% of the frame or ears covered by hair/scarf.",
      "Colored or outdoor background instead of pure white background.",
      "Missing Name and Date of Taking Photograph plaque."
    ],
    howToSteps: [
      {
        name: "Upload Photo & Zoom into 80% Face Oval",
        text: "Use the Face Zoom slider until your head fills the green 80% oval guide with both ears visible."
      },
      {
        name: "Enter Candidate Name & Date of Photo",
        text: "Type your full name and date of photo to render the high-contrast bottom white plaque."
      },
      {
        name: "Download 300 DPI Passport Photo & 4×6 Postcard",
        text: "Download your passport photo, then switch to the NEET 4×6 Postcard preset to export the matching postcard photo."
      }
    ],
    faqs: [
      {
        question: "What does 80% face coverage mean in NEET UG?",
        answer:
          "Your head (from crown to chin) must occupy roughly 80% of the usable vertical photo area above the Name/Date plaque, with both ears clearly visible against a white background."
      }
    ],
    updatedYear: "2026"
  },

  // 9. NEET UG 4x6 Postcard Photo (50-300KB, 1200x1800 px)
  {
    slug: "neet-postcard-size-photo-4x6-inch-resizer",
    shortName: "NEET 4×6 Postcard Photo",
    title: "NEET Postcard Size Photo Maker (4x6 Inch / 1200x1800 px, 50KB-300KB, 300 DPI)",
    metaTitle: "NEET Postcard Size Photo Converter 4x6 Inch (1200x1800 px, 50KB-300KB) Online",
    metaDescription:
      "Convert your regular passport photo into an NTA NEET 4x6 inch Postcard Size Photo (1200x1800 pixels at 300 DPI, 50KB-300KB) with Name & Date plaque and 80% face coverage.",
    h1: "NEET 4×6 Inch Postcard Size Photo Converter (1200×1800 px, 50KB–300KB)",
    subtitle:
      "Instantly convert your regular mobile or passport photo into NTA's mandatory 4×6 inch (1200×1800 px at 300 DPI) Postcard photograph locked between 50KB and 300KB.",
    conductingBody: "National Testing Agency (NTA)",
    officialPortal: "https://neet.nta.nic.in",
    category: "Medical & Engineering",
    defaultTab: "photo",
    widthPx: 1200,
    heightPx: 1800,
    widthCm: "10.16 cm (4 in)",
    heightCm: "15.24 cm (6 in)",
    minKB: 55,
    maxKB: 280,
    dpi: 300,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Dimensions: 4 inch × 6 inch (10.16 cm × 15.24 cm), which equals 1200 × 1800 pixels at 300 DPI.",
      "File Size: 50 KB to 300 KB (or 10 KB to 200 KB depending on portal slot) in JPG format.",
      "Must be the exact same photograph as the NEET Passport size photo, complete with Name & Date plaque."
    ],
    keywords: [
      "neet postcard size photo 4x6 inch converter",
      "4x6 postcard size photo in pixels for neet",
      "convert passport photo to postcard size for neet online",
      "neet postcard photo 50kb to 300kb"
    ],
    presets: [
      {
        id: "neet-postcard-1200x1800",
        label: "NEET 4×6 Postcard Photo (1200×1800 px, 55-280KB)",
        tab: "photo",
        widthPx: 1200,
        heightPx: 1800,
        widthCm: "10.16 cm",
        heightCm: "15.24 cm",
        minKB: 55,
        maxKB: 280,
        dpi: 300,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "True 4x6 inch at 300 DPI (1200x1800 px) with Name & Date plaque."
      }
    ],
    rejectionReasons: [
      "Uploading two different photos for Passport and Postcard slots (NTA requires the exact same pose/photo).",
      "High-resolution 1200x1800 image exceeding the 200KB/300KB file size cap."
    ],
    howToSteps: [
      {
        name: "Upload the Same Photo Used for NEET Passport Slot",
        text: "Select your white-background photo in Tab 1."
      },
      {
        name: "Enter Exact Same Name & Date of Photo",
        text: "Ensure the Name and Date plaque matches your passport size upload."
      },
      {
        name: "Download 1200×1800 px (300 DPI) JPG",
        text: "Click Download to get a 4×6 inch postcard photo compressed cleanly under 280KB."
      }
    ],
    faqs: [
      {
        question: "What is 4x6 inch postcard size in pixels?",
        answer:
          "At 300 DPI studio print resolution, a 4x6 inch postcard photo is exactly 1200 pixels wide by 1800 pixels high."
      }
    ],
    updatedYear: "2026"
  },

  // 10. UPSC Photo 350x350 to 1000x1000 (20-300KB)
  {
    slug: "upsc-photo-resizer-350x350-to-1000x1000-name-date",
    shortName: "UPSC Photo (350×350+)",
    title: "UPSC Photo & Signature Resizer (350x350 to 1000x1000 px, 20KB-300KB, Name & Date)",
    metaTitle: "UPSC Photo Resizer 350x350 to 1000x1000 Pixels (20KB-300KB) with Name & Date | OTR",
    metaDescription:
      "Resize UPSC IAS, CSE, NDA, CDS, CAPF photo & signature strictly between 350x350 and 1000x1000 pixels (550x550px optimal, 20KB-300KB) with mandatory Candidate Name & Date of Photo plaque.",
    h1: "UPSC Photo (350×350 to 1000×1000 px) & Signature Resizer with Name & Date",
    subtitle:
      "Built for upsconline.nic.in OTR. Guarantees both width and height sit safely inside UPSC's strict 350px–1000px square boundary (550×550 px optimal, 20KB–300KB) with Name & Date.",
    conductingBody: "Union Public Service Commission (UPSC)",
    officialPortal: "https://upsconline.nic.in",
    category: "Central Govt",
    defaultTab: "photo",
    widthPx: 550,
    heightPx: 550,
    widthCm: "4.6 cm",
    heightCm: "4.6 cm",
    minKB: 25,
    maxKB: 250,
    dpi: 300,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Pixel Dimensions: Both Width and Height MUST be between 350 pixels and 1000 pixels (550 × 550 px optimal).",
      "File Size: Strictly between 20 KB and 300 KB in JPG format.",
      "Mandatory Name & DOP: Candidate's Name and Date on which photograph was taken must be clearly printed at the bottom.",
      "Photo must not be more than 10 days old from the start of the online application."
    ],
    keywords: [
      "upsc photo size 350x350 to 1000x1000 pixels",
      "upsc photo maker with name and date online",
      "upsc signature resizer 350x350 pixels",
      "nda cds photo size with name and date"
    ],
    presets: [
      {
        id: "upsc-photo-550",
        label: "UPSC Photo with Name & Date (550×550 px, 25-250KB)",
        tab: "photo",
        widthPx: 550,
        heightPx: 550,
        widthCm: "4.6 cm",
        heightCm: "4.6 cm",
        minKB: 25,
        maxKB: 250,
        dpi: 300,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "Optimal 550x550 px square inside UPSC's 350x350 to 1000x1000 rule."
      },
      {
        id: "upsc-sign-500",
        label: "UPSC Square Signature (500×500 px, 25-250KB)",
        tab: "signature",
        widthPx: 500,
        heightPx: 500,
        widthCm: "4.2 cm",
        heightCm: "4.2 cm",
        minKB: 25,
        maxKB: 250,
        dpi: 300,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "500x500 px ensures both axes satisfy UPSC's >=350px and <=1000px validator."
      }
    ],
    rejectionReasons: [
      "Uploading a standard 275x354 photo (rejected immediately because width 275px is less than 350px).",
      "Uploading a 350x150 signature (rejected because height 150px is less than 350px).",
      "Missing Candidate Name and Date of Photo plaque."
    ],
    howToSteps: [
      {
        name: "Upload Photo to 550×550 px UPSC Canvas",
        text: "Upload your photo in Tab 1. The canvas automatically uses 550×550 pixels so it passes UPSC's 350–1000px check."
      },
      {
        name: "Add Name & Recent Date of Photo",
        text: "Enter your full name and a date within the last 10 days."
      },
      {
        name: "Export 500×500 px Signature in Tab 2",
        text: "Switch to Tab 2 and choose the UPSC 500×500 px preset so your signature passes the 350–1000px height rule."
      }
    ],
    faqs: [
      {
        question: "Why does upsconline.nic.in reject my signature with 'Height must be between 350 and 1000 pixels'?",
        answer:
          "UPSC checks that BOTH width and height are at least 350 pixels. Our 'UPSC Square Signature (500x500 px)' preset centers your running-hand signature on a pure white 500x500 canvas so it passes validation every single time."
      }
    ],
    updatedYear: "2026"
  },

  // 11. WBPSC / WBCS / WB Police Photo & Signature
  {
    slug: "wbpsc-wbcs-wb-police-photo-signature-resizer",
    shortName: "WBPSC / WBCS Photo",
    title: "WBPSC (WBCS, Food SI, Clerkship) & WB Police Photo (20-50KB) & Signature Resizer",
    metaTitle: "WBPSC WBCS Photo Resizer (3.5x4.5 cm, 20KB-50KB, 200 DPI) & Signature (10KB-20KB)",
    metaDescription:
      "Resize West Bengal PSC (WBCS, Clerkship, Miscellaneous, Food SI) and WBPRB Police Constable/SI Photo (3.5x4.5cm, 20-50KB / 20-100KB, 200 DPI) and Signature (10-20KB / 10-50KB).",
    h1: "WBPSC (WBCS / Clerkship) & WB Police Photo & Signature Resizer (200 DPI)",
    subtitle:
      "Configured for psc.wb.gov.in and prb.wb.gov.in. True 200 DPI JFIF header injection for 3.5×4.5 cm Passport Photo (20KB–50KB) and Running-Hand Signature (10KB–20KB).",
    conductingBody: "West Bengal Public Service Commission (WBPSC) & WBPRB",
    officialPortal: "https://psc.wb.gov.in",
    category: "State PSC & Police",
    defaultTab: "photo",
    widthPx: 275,
    heightPx: 354,
    widthCm: "3.5 cm",
    heightCm: "4.5 cm",
    minKB: 20,
    maxKB: 50,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "Photograph Size: 3.5 cm × 4.5 cm (275 × 354 pixels at 200 DPI), 20 KB to 50 KB (up to 100 KB on new portal).",
      "Signature Size: 4.0 cm × 2.0 cm (or 6.0 cm × 3.0 cm), 10 KB to 20 KB (up to 50 KB) on pure white background.",
      "Must be scanned at 200 DPI in true baseline JPG format."
    ],
    keywords: [
      "wbpsc photo and signature resizer 200 dpi",
      "wbcs photo size 3.5 x 4.5 cm 20kb to 50kb",
      "wb police constable photo and signature size",
      "psc.wb.gov.in 200 dpi photo converter"
    ],
    presets: [
      {
        id: "wbpsc-photo",
        label: "WBPSC / WBCS Photo (275×354 px, 20-50KB, 200 DPI)",
        tab: "photo",
        widthPx: 275,
        heightPx: 354,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 20,
        maxKB: 50,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: true,
        format: "JPG",
        notes: "3.5x4.5 cm at exact 200 DPI JFIF header, 20KB to 50KB."
      },
      {
        id: "wbpsc-sign",
        label: "WBPSC / WB Police Signature (315×157 px, 10-20KB, 200 DPI)",
        tab: "signature",
        widthPx: 315,
        heightPx: 157,
        widthCm: "4.0 cm",
        heightCm: "2.0 cm",
        minKB: 10,
        maxKB: 20,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "Pure white background signature at 200 DPI, 10KB to 20KB."
      }
    ],
    rejectionReasons: [
      "Portal rejecting photo because internal JFIF DPI is 72/96 instead of 200 DPI.",
      "Gray mobile paper background on signature."
    ],
    howToSteps: [
      {
        name: "Upload Photo in Tab 1",
        text: "Select your passport photo. ExamDoc writes 200 DPI (0x00C8) directly into bytes 13–17 of the JPEG header."
      },
      {
        name: "Clean Signature in Tab 2",
        text: "Bleach gray paper to pure white and download your 10KB–20KB 200 DPI signature."
      }
    ],
    faqs: [
      {
        question: "Why does WBPSC portal reject my photo even when the size is 35KB?",
        answer:
          "WBPSC checks the internal JFIF APP0 header for 200 DPI scan metadata. ExamDoc injects 200 DPI directly into the binary header so psc.wb.gov.in accepts it immediately."
      }
    ],
    updatedYear: "2026"
  },

  // 12. NSDL / UTI PAN Card Photo 213x213 300 DPI
  {
    slug: "nsdl-uti-pan-card-photo-213x213-300-dpi-resizer",
    shortName: "NSDL / UTI PAN (213×213)",
    title: "NSDL & UTIITSL PAN Card Photo (213x213, 300 DPI) & Signature (600 DPI) Resizer",
    metaTitle: "NSDL & UTI PAN Photo 213x213 300 DPI (<30KB/<50KB) & Signature 400x200 600 DPI",
    metaDescription:
      "Instant NSDL (Protean) & UTIITSL PSA PAN Card Photo (213x213 px, 300 DPI, <30KB), Signature (400x200 px, 600 DPI, <50KB), and Supporting Aadhaar PDF (<300KB).",
    h1: "NSDL & UTIITSL PAN Card Photo (213×213 px, 300 DPI) & Signature (600 DPI) Tool",
    subtitle:
      "Built for CSC VLEs, Cyber Cafes & Direct PAN Applicants. Injects true 300 DPI / 600 DPI into JFIF bytes 13–17 for 213×213 px Photo (<30KB) and 400×200 px Signature (<50KB).",
    conductingBody: "Protean (NSDL) & UTIITSL PAN Services",
    officialPortal: "https://www.onlineservices.nsdl.com",
    category: "Identity & PAN",
    defaultTab: "photo",
    widthPx: 213,
    heightPx: 213,
    widthCm: "2.5 cm",
    heightCm: "2.5 cm",
    minKB: 10,
    maxKB: 28,
    dpi: 300,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "JPG",
    guidelines: [
      "UTI PSA PAN Photo: 213 × 213 pixels at exact 300 DPI, file size strictly under 30 KB.",
      "UTI PSA PAN Signature: 400 × 200 pixels at 600 DPI (black ink on white background), strictly under 60 KB.",
      "NSDL PAN Photo: 3.5 cm × 2.5 cm (197 × 276 px at 200 DPI or 213 × 213 px at 300 DPI), under 50 KB.",
      "Supporting Document PDF (Aadhaar/POI/POA/DOB): Single PDF strictly under 300 KB."
    ],
    keywords: [
      "nsdl pan photo 213x213 300 dpi",
      "uti pan card photo and signature resize 213x213 600 dpi",
      "csc pan card photo signature cropping tool",
      "pan card document pdf under 300kb"
    ],
    presets: [
      {
        id: "uti-pan-213",
        label: "UTI / NSDL PAN Photo (213×213 px, 300 DPI, <30KB)",
        tab: "photo",
        widthPx: 213,
        heightPx: 213,
        widthCm: "2.5 cm",
        heightCm: "2.5 cm",
        minKB: 10,
        maxKB: 28,
        dpi: 300,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "213x213 pixels with true 300 DPI JFIF header, strictly under 30KB."
      },
      {
        id: "uti-pan-sign-600",
        label: "UTI / NSDL PAN Signature (400×200 px, 600 DPI, <50KB)",
        tab: "signature",
        widthPx: 400,
        heightPx: 200,
        widthCm: "4.5 cm",
        heightCm: "2.0 cm",
        minKB: 12,
        maxKB: 45,
        dpi: 600,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "400x200 pixels with true 600 DPI JFIF header (0x0258), pure white background, under 50KB."
      },
      {
        id: "nsdl-pan-197x276",
        label: "NSDL Direct PAN Photo (197×276 px / 2.5×3.5 cm, 200 DPI)",
        tab: "photo",
        widthPx: 197,
        heightPx: 276,
        widthCm: "2.5 cm",
        heightCm: "3.5 cm",
        minKB: 12,
        maxKB: 45,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "3.5cm x 2.5cm at 200 DPI, under 50KB."
      }
    ],
    rejectionReasons: [
      "UTI PSA rejecting 213x213 photo because internal JFIF header says 96 DPI instead of 300 DPI.",
      "Signature rejected for not having 600 DPI header or exceeding 50KB/60KB.",
      "Aadhaar PDF exceeding 300KB."
    ],
    howToSteps: [
      {
        name: "Export 213×213 px (300 DPI) PAN Photo",
        text: "Upload photo in Tab 1. ExamDoc injects 0x012C (300 DPI) into bytes 13–17 and keeps size under 28KB."
      },
      {
        name: "Export 400×200 px (600 DPI) PAN Signature",
        text: "Switch to Tab 2 and choose the 600 DPI PAN Signature preset to bleach gray paper and inject 0x0258 (600 DPI)."
      },
      {
        name: "Pack Aadhaar PDF Under 300KB",
        text: "Use Tab 3 to combine Aadhaar Front + Back into a single PDF under 300KB."
      }
    ],
    faqs: [
      {
        question: "Why does UTI PSA reject my 213x213 photo saying 'DPI must be 300'?",
        answer:
          "Browser canvases normally export at 96 DPI. ExamDoc overwrites bytes 13 to 17 of the JPEG JFIF header with `01 01 2C 01 2C` (300x300 DPI) for photos and `01 02 58 02 58` (600x600 DPI) for signatures."
      }
    ],
    updatedYear: "2026"
  },

  // 13. 10th / 12th Marksheet PDF Compressor <100KB / <200KB
  {
    slug: "marksheet-pdf-size-reducer-under-100kb-200kb",
    shortName: "Marksheet PDF (<100KB)",
    title: "10th & 12th Marksheet PDF Size Reducer Under 100KB / 200KB / 300KB",
    metaTitle: "Marksheet PDF Size Reducer Under 100KB & 200KB (JPG to PDF Converter for Govt Exams)",
    metaDescription:
      "Convert and compress 10th, 12th, Graduation Marksheet, Caste, EWS & Domicile Certificate photos into a crystal-clear PDF strictly under 100KB, 200KB, or 300KB in your browser.",
    h1: "10th / 12th Marksheet & Certificate PDF Size Reducer (<100KB / <200KB)",
    subtitle:
      "Turn mobile photos of your 10th/12th Marksheet, Caste, EWS, or Domicile Certificate into a sharp, legible PDF-1.4 guaranteed under 100KB, 200KB, or 300KB.",
    conductingBody: "All Central & State Recruitment, Counselling & Scholarship Portals",
    officialPortal: "https://examdoc.in",
    category: "PDF & Marksheet",
    defaultTab: "pdf",
    widthPx: 1000,
    heightPx: 1414,
    widthCm: "21.0 cm",
    heightCm: "29.7 cm",
    minKB: 50,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "PDF",
    guidelines: [
      "Strict <100 KB Mode: Locks output PDF between 50 KB and 95 KB (ideal for portals capping certificates at 100 KB).",
      "Strict <200 KB Mode: Locks output PDF between 100 KB and 190 KB for high-density 10th/12th marksheets.",
      "Document Text Contrast Boost keeps roll numbers, marks, and QR codes readable."
    ],
    keywords: [
      "marksheet pdf size reducer under 100kb",
      "10th marksheet jpg to pdf under 100kb",
      "caste certificate pdf compressor under 100kb",
      "convert photo to pdf under 100kb for govt exam"
    ],
    presets: [
      {
        id: "marksheet-pdf-100kb",
        label: "Marksheet / Certificate PDF Strict <100KB (50-95KB)",
        tab: "pdf",
        widthPx: 1000,
        heightPx: 1414,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 50,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Guaranteed 50KB to 95KB A4 PDF with text contrast enhancement."
      },
      {
        id: "marksheet-pdf-200kb",
        label: "Marksheet PDF Strict <200KB (100-190KB)",
        tab: "pdf",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 100,
        maxKB: 190,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Guaranteed 100KB to 190KB A4 PDF for detailed tabular marksheets."
      }
    ],
    rejectionReasons: [
      "Blurry over-compressed marksheet where Roll Number or Marks cannot be read during Document Verification.",
      "PDF file size 103KB rejected by a strict 100KB (102,400-byte) server validator."
    ],
    howToSteps: [
      {
        name: "Upload Marksheet or Certificate Photo(s) in Tab 3",
        text: "Select 1 to 5 photos of your marksheet or certificate from your phone or PC."
      },
      {
        name: "Select Strict <100KB or <200KB Target",
        text: "Enable 'Marksheet Text Contrast Boost' so small fonts stay sharp."
      },
      {
        name: "Download Instant PDF-1.4",
        text: "Click Download to save your verified PDF strictly below your chosen KB limit."
      }
    ],
    faqs: [
      {
        question: "How do I convert a 4MB mobile photo of my 10th marksheet into a PDF under 100KB without blurring text?",
        answer:
          "Upload the photo in Tab 3 and keep 'Marksheet Text Contrast Boost' checked. ExamDoc lifts gray paper pixels to white (which reduces JPEG entropy) while darkening printed text, then packs the stream via /DCTDecode into an 80KB-94KB PDF."
      }
    ],
    updatedYear: "2026"
  },

  // 14. Aadhaar Card Front & Back Merger & PDF Compressor <100KB / <300KB
  {
    slug: "aadhaar-card-front-back-merge-pdf-under-100kb-300kb",
    shortName: "Aadhaar Front+Back PDF (<100KB)",
    title: "Aadhaar Card Front & Back Merge into Single PDF Under 100KB / 300KB",
    metaTitle: "Aadhaar Card Front and Back Merge PDF Under 100KB & 300KB (100% Private Browser Tool)",
    metaDescription:
      "Combine Aadhaar Card Front and Back photos onto a single A4 page PDF strictly under 100KB or 300KB for UPSC, PAN Card, SSC, and Scholarship portals. 100% private client-side execution.",
    h1: "Aadhaar Card Front & Back Merger into Single PDF (<100KB / <300KB)",
    subtitle:
      "Stacks Aadhaar Front and Back neatly on a single A4 page (or 2 pages) and packs them into a pure client-side PDF-1.4 guaranteed under 100KB or 300KB. Zero server upload.",
    conductingBody: "UPSC, NSDL/UTI PAN, DigiLocker & Govt Exam Portals",
    officialPortal: "https://examdoc.in",
    category: "Identity & PAN",
    defaultTab: "pdf",
    widthPx: 1000,
    heightPx: 1414,
    widthCm: "21.0 cm",
    heightCm: "29.7 cm",
    minKB: 50,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "PDF",
    guidelines: [
      "Single Upload Slot Rule: Most government portals only provide 1 file upload slot for Photo ID proof, requiring both Front and Back of Aadhaar in one PDF.",
      "File Size: Under 100 KB (State portals) or 20 KB to 300 KB (UPSC & NSDL/UTI PAN).",
      "100% Local Privacy: Never upload your Aadhaar card to unknown cloud servers."
    ],
    keywords: [
      "aadhaar card front and back merge pdf under 100kb",
      "combine aadhaar front and back in one page pdf",
      "upsc photo id card pdf under 300kb",
      "pan card aadhaar pdf under 300kb"
    ],
    presets: [
      {
        id: "aadhaar-pdf-100kb",
        label: "Aadhaar Front+Back Single-Page PDF (<100KB)",
        tab: "pdf",
        widthPx: 1000,
        heightPx: 1414,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 50,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Merges Front & Back onto 1 A4 page strictly between 50KB and 95KB."
      },
      {
        id: "aadhaar-pdf-300kb",
        label: "UPSC / PAN Aadhaar ID PDF (<300KB)",
        tab: "pdf",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 120,
        maxKB: 285,
        dpi: 300,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "High-clarity single-page or 2-page Aadhaar PDF under 300KB for UPSC & PAN."
      }
    ],
    rejectionReasons: [
      "Uploading only the Front side of Aadhaar without the Back address side.",
      "PDF size exceeding 100KB or 300KB limit."
    ],
    howToSteps: [
      {
        name: "Select Aadhaar Front & Back Photos in Tab 3",
        text: "Add both the front and back images of your Aadhaar card."
      },
      {
        name: "Keep 'Aadhaar Front+Back on 1 Page' Checked",
        text: "This stacks both sides Top & Bottom on a single A4 page."
      },
      {
        name: "Download Verified <100KB or <300KB PDF",
        text: "Click Download to get your single-file PDF immediately."
      }
    ],
    faqs: [
      {
        question: "Is it safe to merge my Aadhaar card on ExamDoc.in?",
        answer:
          "Yes, 100% safe. ExamDoc has zero backend servers or cloud storage. The entire PDF binary is assembled inside your own device's RAM using JavaScript ArrayBuffers."
      }
    ],
    updatedYear: "2026"
  },

  // 15. JEE Main / CUET / India Post GDS Photo & Signature
  {
    slug: "jee-main-cuet-india-post-gds-photo-signature-resizer",
    shortName: "JEE Main / India Post GDS",
    title: "JEE Main, CUET & India Post GDS Photo (320x400 / 3.5x4.5cm) & Signature Resizer",
    metaTitle: "JEE Main & India Post GDS Photo Resizer (10-200KB / 30-100KB, 200 DPI) & Signature",
    metaDescription:
      "Resize NTA JEE Main & CUET Photo (10KB-200KB, 80% face) & Signature (4KB-30KB), plus new India Post GDS Photo (320x400 px, 30KB-100KB, 200 DPI) & Signature (300x120 px, 20KB-100KB).",
    h1: "JEE Main, CUET & India Post GDS Photo, Signature & Certificate PDF Resizer",
    subtitle:
      "Includes official presets for jeemain.nta.nic.in (80% face oval, 10–200KB) and indiapostgdsonline.gov.in (320×400 px, 30–100KB, 200 DPI).",
    conductingBody: "National Testing Agency (NTA) & Department of Posts",
    officialPortal: "https://jeemain.nta.nic.in",
    category: "Medical & Engineering",
    defaultTab: "photo",
    widthPx: 320,
    heightPx: 400,
    widthCm: "4.0 cm",
    heightCm: "5.0 cm",
    minKB: 35,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: true,
    requiresFaceOval: true,
    format: "JPG",
    guidelines: [
      "India Post GDS Photo: 320 × 400 pixels, 200 DPI, 30 KB to 100 KB.",
      "India Post GDS Signature: 300 × 120 pixels, 200 DPI, 20 KB to 100 KB.",
      "JEE Main / CUET Photo: 3.5 cm × 4.5 cm, 80% face coverage without mask, 10 KB to 200 KB.",
      "JEE Main / CUET Signature: 4 KB to 30 KB on pure white paper."
    ],
    keywords: [
      "india post gds photo size 30kb to 100kb 320x400",
      "jee main photo size 10kb to 200kb",
      "cuet photo and signature resizer",
      "india post gds signature 300x120 20kb to 100kb"
    ],
    presets: [
      {
        id: "gds-photo-320x400",
        label: "India Post GDS Photo (320×400 px, 30-100KB, 200 DPI)",
        tab: "photo",
        widthPx: 320,
        heightPx: 400,
        widthCm: "4.0 cm",
        heightCm: "5.0 cm",
        minKB: 35,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: true,
        format: "JPG",
        notes: "New India Post GDS 320x400 px specification at 200 DPI (30KB-100KB)."
      },
      {
        id: "gds-sign-300x120",
        label: "India Post GDS Signature (300×120 px, 20-100KB, 200 DPI)",
        tab: "signature",
        widthPx: 300,
        heightPx: 120,
        widthCm: "3.8 cm",
        heightCm: "1.5 cm",
        minKB: 25,
        maxKB: 90,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "JPG",
        notes: "New India Post GDS 300x120 px signature at 200 DPI (20KB-100KB)."
      },
      {
        id: "jee-main-photo",
        label: "JEE Main / CUET Photo (413×531 px, 15-180KB)",
        tab: "photo",
        widthPx: 413,
        heightPx: 531,
        widthCm: "3.5 cm",
        heightCm: "4.5 cm",
        minKB: 15,
        maxKB: 180,
        dpi: 300,
        requiresNameDop: true,
        requiresFaceOval: true,
        format: "JPG",
        notes: "80% face coverage, white background, 10KB-200KB."
      }
    ],
    rejectionReasons: [
      "Uploading old 200x230px photos to India Post GDS instead of the new 320x400px (30-100KB) specification.",
      "GDS signature falling below 20KB."
    ],
    howToSteps: [
      {
        name: "Select JEE Main or India Post GDS Preset",
        text: "Click the preset pill matching your portal."
      },
      {
        name: "Align Face & Download Verified JPG",
        text: "Download your binary-verified 200/300 DPI JPG."
      }
    ],
    faqs: [
      {
        question: "What is the new India Post GDS photo and signature size?",
        answer:
          "India Post GDS requires 320x400 pixels (30KB to 100KB, 200 DPI) for the photograph and 300x120 pixels (20KB to 100KB, 200 DPI) for the signature."
      }
    ],
    updatedYear: "2026"
  },

  // 16. Online Document Scanner Auto-Crop & Magic Color PDF
  {
    slug: "online-document-scanner-auto-crop-pdf",
    shortName: "AI Doc Scanner (Auto-Crop)",
    title: "Online Document Scanner — Auto Edge Crop, Magic Color & PDF Under 100KB",
    metaTitle: "Online Document Scanner Auto Crop & Shadow Remover to PDF (<100KB) | ExamDoc",
    metaDescription:
      "Free CamScanner-grade online document scanner in your browser. Auto-detect 4 corners, flatten perspective, remove mobile shadows with Magic Color, and export PDF under 100KB/300KB.",
    h1: "Online Document Scanner — Auto Edge Crop, Magic Color & Exact-KB PDF",
    subtitle:
      "Turn tilted, shadowed phone camera photos of certificates and forms into flat, studio-white scans using 4-point perspective homography and Magic Color illumination leveling.",
    conductingBody: "All Central & State Recruitment, Counselling & DigiLocker Uploads",
    officialPortal: "https://www.examdoc.in",
    category: "PDF & Marksheet",
    defaultTab: "scanner",
    widthPx: 1240,
    heightPx: 1754,
    widthCm: "21.0 cm",
    heightCm: "29.7 cm",
    minKB: 50,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "PDF",
    guidelines: [
      "Place your document on a darker table or contrasting surface so the 4 edges are clearly visible.",
      "Use 'Magic Color' to remove yellow room-bulb tints and phone camera shadows while keeping stamps and blue signatures vivid.",
      "Use 'B&W Scan' for pure #FFFFFF paper and razor-sharp black text on handwritten declarations or certificates.",
      "Scan up to 10 pages and export directly to a single PDF under 100 KB, 200 KB, or 300 KB."
    ],
    keywords: [
      "online document scanner auto crop pdf",
      "camscanner online free no watermark",
      "remove shadow from document photo online",
      "perspective crop document to pdf under 100kb"
    ],
    presets: [
      {
        id: "scanner-auto-100kb",
        label: "Auto-Crop Document Scan (<100 KB PDF)",
        tab: "scanner",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 50,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "4-point perspective flattening + Magic Color shadow removal packed under 100KB."
      },
      {
        id: "scanner-auto-300kb",
        label: "Multi-Page Document Scan (<300 KB PDF)",
        tab: "scanner",
        widthPx: 1400,
        heightPx: 1980,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 150,
        maxKB: 285,
        dpi: 300,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Scan 1 to 10 pages into a single crisp PDF under 300KB."
      }
    ],
    rejectionReasons: [
      "Tilted smartphone photo showing wooden desk, bedsheet, or fingers around the certificate.",
      "Dark phone shadow across the bottom half of the document making text illegible.",
      "Third-party mobile scanner app watermarks printed across the bottom corner of official documents."
    ],
    howToSteps: [
      {
        name: "Take Photo or Upload Document",
        text: "Tap 'Take Photo (Camera)' on your phone or select an image from your gallery."
      },
      {
        name: "Fine-Tune 4 Corners with 2.5× Loupe",
        text: "Our Sobel edge detector finds the 4 document corners automatically. Drag any corner with the floating 2.5× magnifier loupe if needed, then tap 'Crop & Enhance'."
      },
      {
        name: "Apply Magic Color & Download Exact-KB PDF",
        text: "Choose Magic Color or B&W Scan, pick your <100KB or <300KB ceiling, and download with zero watermarks."
      }
    ],
    faqs: [
      {
        question: "Does this online document scanner add any watermark like mobile scanner apps?",
        answer:
          "No. ExamDoc produces 100% clean, watermark-free PDFs and 200-DPI JPEGs required for official government exam and scholarship portals."
      },
      {
        question: "How does Magic Color remove phone shadows without blurring university stamps?",
        answer:
          "Our engine models the local background lighting across a smooth illumination surface and divides each pixel channel by the local background light, eliminating shadows while boosting the chroma of blue/purple stamps and signatures."
      }
    ],
    updatedYear: "2026"
  },

  // 17. Scan Marksheet to PDF Under 100KB
  {
    slug: "scan-marksheet-to-pdf-under-100kb",
    shortName: "Scan Marksheet (<100KB)",
    title: "Scan 10th & 12th Marksheet to PDF Under 100KB (Auto-Crop & Shadow Remover)",
    metaTitle: "Scan 10th 12th Marksheet to PDF Under 100KB Online (Auto Crop & Clear Text) | ExamDoc",
    metaDescription:
      "Scan 10th, 12th & Graduation Marksheets, Caste, EWS & Domicile Certificates with your phone camera, flatten perspective, remove shadows, and save as PDF strictly under 100KB.",
    h1: "Scan 10th / 12th Marksheet & Certificates to PDF Under 100KB",
    subtitle:
      "Auto-crops desk backgrounds, straightens angled camera shots, removes shadows with Magic Color, and packs your marksheet into a crystal-clear PDF strictly under 100KB.",
    conductingBody: "SSC, UPSC, State PSC, Scholarship & University Admission Portals",
    officialPortal: "https://www.examdoc.in",
    category: "PDF & Marksheet",
    defaultTab: "scanner",
    widthPx: 1240,
    heightPx: 1754,
    widthCm: "21.0 cm",
    heightCm: "29.7 cm",
    minKB: 50,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "PDF",
    guidelines: [
      "Snap your marksheet in good daylight; our 4-point homography straightens angled shots automatically.",
      "Magic Color whitens the background paper, which reduces JPEG compression noise and keeps subject marks razor-sharp even under 95 KB.",
      "Combine multiple semester marksheets (1 to 10 pages) into a single PDF under 100 KB, 200 KB, or 300 KB."
    ],
    keywords: [
      "scan marksheet to pdf under 100kb",
      "10th marksheet scanner online under 100kb",
      "caste certificate scanner pdf under 100kb",
      "clean mobile photo of marksheet to pdf"
    ],
    presets: [
      {
        id: "scan-marksheet-100kb",
        label: "Scanned Marksheet PDF (<100 KB Strict)",
        tab: "scanner",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 50,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Perspective-flattened marksheet scan locked between 50KB and 95KB."
      },
      {
        id: "scan-marksheet-200kb",
        label: "Scanned Marksheet PDF (<200 KB High Clarity)",
        tab: "scanner",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 100,
        maxKB: 190,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Ideal for portals allowing up to 200KB per marksheet."
      }
    ],
    rejectionReasons: [
      "Un-cropped background table or fingers visible around the marksheet border.",
      "Roll number or QR code unreadable due to low-contrast gray camera lighting.",
      "File size exceeding 100 KB (102,400 bytes)."
    ],
    howToSteps: [
      {
        name: "Capture or Upload Marksheet Photo",
        text: "Take a photo of your 10th/12th marksheet or select it from your phone gallery."
      },
      {
        name: "Confirm 4 Corners & Straighten",
        text: "Verify the 4 blue corner handles align with the marksheet borders and tap 'Crop & Enhance'."
      },
      {
        name: "Download <100KB PDF",
        text: "Keep '<100KB' selected and tap 'Download Exact-KB PDF' to get a 65KB–94KB file."
      }
    ],
    faqs: [
      {
        question: "Why is a scanned marksheet clearer under 100KB than a raw camera photo converted to PDF?",
        answer:
          "A raw camera photo wastes 60% of its file size encoding wood-grain desk backgrounds and uneven gray shadows. By perspective-cropping to the exact paper edges and leveling the paper background to pure white, 100% of the 100KB byte budget goes toward sharp text and numbers."
      }
    ],
    updatedYear: "2026"
  },

  // 18. ID Card Front & Back 2-in-1 Scanner to Single A4 PDF
  {
    slug: "id-card-front-back-scanner-pdf",
    shortName: "ID Card 2-in-1 Scanner",
    title: "ID Card Front & Back Scanner — Aadhaar, PAN & Voter ID on 1 A4 Page PDF (<100KB)",
    metaTitle: "ID Card Front and Back Scanner on 1 Page PDF (<100KB / <300KB) | ExamDoc",
    metaDescription:
      "Scan Aadhaar Card, PAN Card, Voter ID, or Driving Licence Front and Back with auto perspective crop and stack both sides onto a single A4 page PDF under 100KB or 300KB.",
    h1: "ID Card 2-in-1 Scanner (Front & Back on Single A4 Page PDF <100KB)",
    subtitle:
      "Guided 2-step Aadhaar, PAN & Voter ID scanner: straightens both Front and Back sides to exact ISO ID-1 (85.6×54 mm) proportions and arranges them neatly on a single A4 PDF.",
    conductingBody: "UPSC OTR, NSDL/UTI PAN, SSC, Banking & Scholarship Portals",
    officialPortal: "https://www.examdoc.in",
    category: "Identity & PAN",
    defaultTab: "scanner",
    widthPx: 1240,
    heightPx: 1754,
    widthCm: "21.0 cm",
    heightCm: "29.7 cm",
    minKB: 50,
    maxKB: 95,
    dpi: 200,
    requiresNameDop: false,
    requiresFaceOval: false,
    format: "PDF",
    guidelines: [
      "Step 1: Scan the Front Side of your ID card and confirm the 4 corners.",
      "Step 2: Scan the Back Side of your ID card; both sides are automatically normalized to 85.6×54 mm proportions.",
      "Both sides are stacked cleanly with subtle borders on a single A4 page and compressed under 100 KB or 300 KB."
    ],
    keywords: [
      "id card front and back scanner on one page pdf",
      "aadhaar card front back scanner online under 100kb",
      "voter id pan card two side scanner a4 pdf",
      "combine id card front and back on single page"
    ],
    presets: [
      {
        id: "id-card-scan-100kb",
        label: "ID Card Front+Back A4 PDF (<100 KB)",
        tab: "scanner",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 50,
        maxKB: 95,
        dpi: 200,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "Stacks straightened Front & Back ID card scans onto 1 A4 page under 100KB."
      },
      {
        id: "id-card-scan-300kb",
        label: "UPSC / PAN Photo ID Proof PDF (<300 KB)",
        tab: "scanner",
        widthPx: 1240,
        heightPx: 1754,
        widthCm: "21.0 cm",
        heightCm: "29.7 cm",
        minKB: 120,
        maxKB: 285,
        dpi: 300,
        requiresNameDop: false,
        requiresFaceOval: false,
        format: "PDF",
        notes: "High-resolution 2-in-1 ID card A4 sheet under 300KB for UPSC and NSDL/UTI PAN."
      }
    ],
    rejectionReasons: [
      "Uploading only the front of the ID card when the address on the back is required for verification.",
      "Skewed or differently sized front and back card cutouts pasted sloppily.",
      "Uploading private Aadhaar/PAN cards to server-based third-party websites."
    ],
    howToSteps: [
      {
        name: "Select 'ID Card 2-in-1 (Front+Back)' Mode",
        text: "Scan or upload the Front side of your Aadhaar, PAN, or Voter ID card and adjust the 4 corners."
      },
      {
        name: "Add the Back Side in Step 2",
        text: "Tap 'Step 2: Back Side' to scan the reverse side. Both cards are automatically straightened to 85.6×54 mm ratio."
      },
      {
        name: "Download Single-Page A4 PDF (<100KB / <300KB)",
        text: "Download your combined A4 PDF or 200-DPI JPG 100% privately in your browser."
      }
    ],
    faqs: [
      {
        question: "Does the ID Card 2-in-1 Scanner keep my Aadhaar and PAN card private?",
        answer:
          "Yes, 100%. All edge detection, perspective flattening, and PDF packing run locally inside your browser using client-side Web Workers and ArrayBuffers. Zero bytes are ever uploaded to any server."
      }
    ],
    updatedYear: "2026"
  }
];

export const EXAM_PRESETS: ExamPreset[] = EXAMS;

export function getExamBySlug(slug: string): ExamPreset | undefined {
  return EXAMS.find((e) => e.slug === slug);
}
