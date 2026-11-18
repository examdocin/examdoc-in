import { loadImageFromDataUrl } from "./imageProcessing";

/**
 * Generates a realistic passport photo silhouette on an off-white wall background
 * so users can test Tab 1 (Photo Maker), Tab 4, and Tab 5 immediately with zero file upload.
 */
export async function createDemoPassportPhoto(): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Slightly warm wall background (so users can see White Background Boost work)
  const bgGrad = ctx.createLinearGradient(0, 0, 600, 760);
  bgGrad.addColorStop(0, "#F3F4F6");
  bgGrad.addColorStop(1, "#E5E7EB");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 760);

  // Formal navy blazer / shoulders
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.moveTo(65, 760);
  ctx.quadraticCurveTo(110, 535, 300, 535);
  ctx.quadraticCurveTo(490, 535, 535, 760);
  ctx.closePath();
  ctx.fill();

  // White formal shirt collar
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(230, 535);
  ctx.lineTo(300, 665);
  ctx.lineTo(370, 535);
  ctx.closePath();
  ctx.fill();

  // Tie
  ctx.fillStyle = "#991B1B";
  ctx.beginPath();
  ctx.moveTo(286, 565);
  ctx.lineTo(314, 565);
  ctx.lineTo(320, 670);
  ctx.lineTo(300, 695);
  ctx.lineTo(280, 670);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = "#D99B72";
  ctx.fillRect(252, 445, 96, 115);

  // Ears (important for NEET/SSC 80% face + visible ears check)
  ctx.fillStyle = "#D99B72";
  ctx.beginPath();
  ctx.ellipse(162, 315, 22, 44, -0.08, 0, Math.PI * 2);
  ctx.ellipse(438, 315, 22, 44, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Head / Face oval
  ctx.fillStyle = "#E5A982";
  ctx.beginPath();
  ctx.ellipse(300, 310, 136, 172, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(300, 178, 138, 72, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(178, 225, 25, 0, Math.PI * 2);
  ctx.arc(422, 225, 25, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(222, 268);
  ctx.quadraticCurveTo(250, 258, 275, 268);
  ctx.moveTo(325, 268);
  ctx.quadraticCurveTo(350, 258, 378, 268);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(250, 294, 22, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(350, 294, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1F2937";
  ctx.beginPath();
  ctx.arc(250, 294, 9, 0, Math.PI * 2);
  ctx.arc(350, 294, 9, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = "#B87A56";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(300, 295);
  ctx.lineTo(293, 355);
  ctx.lineTo(312, 360);
  ctx.stroke();

  // Neutral mouth
  ctx.strokeStyle = "#883932";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(262, 405);
  ctx.quadraticCurveTo(300, 416, 338, 405);
  ctx.stroke();

  return loadImageFromDataUrl(canvas.toDataURL("image/png"));
}

/**
 * Generates a realistic gray shadowed mobile-camera photo of a running-hand signature
 * on notebook paper so the user can see Tab 2's Adaptive Luminance Thresholding bleach it to #FFFFFF.
 */
export async function createDemoGrayPaperSignature(): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Simulate uneven gray mobile camera shadow across paper
  const grad = ctx.createLinearGradient(0, 0, 700, 320);
  grad.addColorStop(0, "#D1D5DB");
  grad.addColorStop(0.5, "#C4C9D4");
  grad.addColorStop(1, "#9CA3AF");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 700, 320);

  // Faint notebook horizontal lines
  ctx.strokeStyle = "rgba(156, 163, 175, 0.55)";
  ctx.lineWidth = 2;
  for (let y = 60; y < 300; y += 55) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(700, y);
    ctx.stroke();
  }

  // Cursive signature strokes in dark blue/black ballpoint ink
  ctx.strokeStyle = "#162A66";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(95, 205);
  ctx.bezierCurveTo(120, 95, 195, 85, 170, 200);
  ctx.bezierCurveTo(160, 235, 220, 145, 255, 185);
  ctx.bezierCurveTo(280, 210, 310, 130, 345, 188);
  ctx.bezierCurveTo(375, 215, 420, 110, 465, 178);
  ctx.bezierCurveTo(500, 215, 550, 140, 595, 172);
  ctx.stroke();

  // Signature underline flourish
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(115, 238);
  ctx.quadraticCurveTo(345, 215, 610, 222);
  ctx.stroke();

  return loadImageFromDataUrl(canvas.toDataURL("image/png"));
}

/**
 * Generates 2 demo pages (e.g. Aadhaar Front + Back or 10th Marksheet) for Tab 3 PDF testing.
 */
export async function createDemoDocumentPages(): Promise<
  { name: string; image: HTMLImageElement }[]
> {
  const buildCard = async (title: string, subtitle: string, accent: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, 1000, 640);

    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 960, 600);

    ctx.fillStyle = accent;
    ctx.fillRect(24, 24, 952, 95);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillText(title, 55, 82);

    ctx.fillStyle = "#0F172A";
    ctx.font = "700 28px Arial, sans-serif";
    ctx.fillText(subtitle, 55, 185);

    ctx.fillStyle = "#334155";
    ctx.font = "500 22px Arial, sans-serif";
    ctx.fillText("Candidate Name: AARAV SHARMA", 55, 245);
    ctx.fillText("Date of Birth / Roll No: 15-08-2003 / 24109832", 55, 295);
    ctx.fillText("Verification Status: ORIGINAL VERIFIED DOCUMENT", 55, 345);
    ctx.fillText("Issued By: Government Examination & Identity Authority", 55, 395);

    // Simulated QR verification matrix
    ctx.fillStyle = "#0F172A";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 0 || r === 0 || c === 0 || r === 7 || c === 7) {
          ctx.fillRect(760 + c * 20, 220 + r * 20, 16, 16);
        }
      }
    }

    const img = await loadImageFromDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    return { name: `${title.toLowerCase().replace(/\s+/g, "-")}.jpg`, image: img };
  };

  const front = await buildCard(
    "IDENTITY CARD - FRONT SIDE",
    "UID / Roll Verification Block (Page 1)",
    "#1E40AF"
  );
  const back = await buildCard(
    "IDENTITY CARD - BACK SIDE & ADDRESS",
    "Permanent Address & QR Block (Page 2)",
    "#065F46"
  );

  return [front, back];
}
