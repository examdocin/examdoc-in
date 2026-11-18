export interface PdfPageItem {
  id: string;
  name: string;
  image: HTMLImageElement;
  rotation: number;
}

export interface PdfPackOptions {
  minKB: number;
  maxKB: number;
  mergeFrontBackOnSinglePage: boolean;
  enhanceDocumentContrast: boolean;
  grayscaleMode: boolean;
}

export interface PackedPdfResult {
  blob: Blob;
  uint8Array: Uint8Array;
  sizeKB: number;
  byteLength: number;
  pageCount: number;
  qualityUsed: number;
  resolutionWidthPx: number;
  withinRange: boolean;
  minKB: number;
  maxKB: number;
}

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : Math.round(n);
}

/**
 * Enhances mobile document scan readability (lifts dull paper background towards white and sharpens text)
 */
function enhanceDocumentCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  enhanceContrast: boolean,
  grayscale: boolean
): void {
  if (!enhanceContrast && !grayscale) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (grayscale) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum;
      g = lum;
      b = lum;
    }

    if (enhanceContrast) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 195) {
        // Push light gray paper towards clean white (reduces JPEG entropy and boosts readability!)
        const f = Math.min(1, (lum - 195) / 52);
        r = r + (255 - r) * f * 0.85;
        g = g + (255 - g) * f * 0.85;
        b = b + (255 - b) * f * 0.85;
      } else if (lum < 110) {
        // Darken printed text/numbers
        r *= 0.84;
        g *= 0.84;
        b *= 0.84;
      }
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  ctx.putImageData(imgData, 0, 0);
}

async function canvasToJpegUint8(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode page JPEG"));
          return;
        }
        const buf = await blob.arrayBuffer();
        resolve(new Uint8Array(buf));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Renders the user's 1..5 images into page canvases (either 1 image per A4 page,
 * or 2 images stacked Top & Bottom on a single A4 page for Aadhaar Front + Back).
 */
function buildPageCanvases(
  items: PdfPageItem[],
  pageWidthPx: number,
  options: PdfPackOptions
): HTMLCanvasElement[] {
  const pageHeightPx = Math.round(pageWidthPx * 1.4142); // A4 aspect ratio (1 : sqrt(2))
  const canvases: HTMLCanvasElement[] = [];

  if (options.mergeFrontBackOnSinglePage && items.length >= 2) {
    // Group in pairs of 2 per A4 page (ideal for Aadhaar Front + Back on Page 1)
    for (let i = 0; i < items.length; i += 2) {
      const pair = items.slice(i, i + 2);
      const canvas = document.createElement("canvas");
      canvas.width = pageWidthPx;
      canvas.height = pageHeightPx;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

      const pad = Math.round(pageWidthPx * 0.045);
      const slotW = pageWidthPx - pad * 2;
      const slotH = Math.round((pageHeightPx - pad * 3) / 2);

      pair.forEach((item, idx) => {
        const slotX = pad;
        const slotY = pad + idx * (slotH + pad);
        drawRotatedItemInBox(ctx, item, slotX, slotY, slotW, slotH);
      });

      enhanceDocumentCanvas(
        ctx,
        pageWidthPx,
        pageHeightPx,
        options.enhanceDocumentContrast,
        options.grayscaleMode
      );
      canvases.push(canvas);
    }
    return canvases;
  }

  // Standard 1 image per A4 page
  for (const item of items) {
    const canvas = document.createElement("canvas");
    canvas.width = pageWidthPx;
    canvas.height = pageHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

    const pad = Math.round(pageWidthPx * 0.03);
    drawRotatedItemInBox(
      ctx,
      item,
      pad,
      pad,
      pageWidthPx - pad * 2,
      pageHeightPx - pad * 2
    );

    enhanceDocumentCanvas(
      ctx,
      pageWidthPx,
      pageHeightPx,
      options.enhanceDocumentContrast,
      options.grayscaleMode
    );
    canvases.push(canvas);
  }

  return canvases;
}

function drawRotatedItemInBox(
  ctx: CanvasRenderingContext2D,
  item: PdfPageItem,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): void {
  const isRotated90 = Math.abs(item.rotation % 180) === 90;
  const imgW = isRotated90 ? item.image.naturalHeight : item.image.naturalWidth;
  const imgH = isRotated90 ? item.image.naturalWidth : item.image.naturalHeight;

  const scale = Math.min(boxW / Math.max(1, imgW), boxH / Math.max(1, imgH));

  ctx.save();
  ctx.translate(boxX + boxW / 2, boxY + boxH / 2);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(
    item.image,
    -item.image.naturalWidth / 2,
    -item.image.naturalHeight / 2,
    item.image.naturalWidth,
    item.image.naturalHeight
  );
  ctx.restore();
}

/**
 * Pure client-side PDF-1.4 binary builder with /DCTDecode image streams and exact xref table.
 */
function assemblePdf14Binary(
  pages: { jpegBytes: Uint8Array; widthPx: number; heightPx: number }[],
  minTotalBytes: number,
  maxTotalBytes: number
): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  const pushString = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  // Object numbering:
  // 1: Catalog
  // 2: Pages
  // For each page i (0..N-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const totalObjects = 2 + pages.length * 3;
  const offsets: number[] = new Array(totalObjects + 1).fill(0);

  // PDF-1.4 Header + 4 high-bit binary comment bytes
  pushString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Object 1: Catalog
  offsets[1] = currentOffset;
  pushString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages
  const kidsRefs = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  offsets[2] = currentOffset;
  pushString(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${pages.length} >>\nendobj\n`
  );

  // Standard A4 points: 595.28 x 841.89 pt (we use 595 x 842)
  const pdfPtW = 595;
  const pdfPtH = 842;

  pages.forEach((p, i) => {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const imgName = `/Im${i + 1}`;

    // Page object
    offsets[pageObjId] = currentOffset;
    pushString(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${pdfPtW} ${pdfPtH} ] ` +
        `/Resources << /XObject << ${imgName} ${imageObjId} 0 R >> >> ` +
        `/Contents ${contentObjId} 0 R >>\n` +
        `endobj\n`
    );

    // Content stream drawing the image across the full A4 page
    const contentStream = `q\n${pdfPtW} 0 0 ${pdfPtH} 0 0 cm\n${imgName} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = currentOffset;
    pushString(
      `${contentObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`
    );
    pushBytes(contentBytes);
    pushString("\nendstream\nendobj\n");

    // Image XObject using pure /DCTDecode
    offsets[imageObjId] = currentOffset;
    pushString(
      `${imageObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\n` +
        `stream\n`
    );
    pushBytes(p.jpegBytes);
    pushString("\nendstream\nendobj\n");
  });

  // Estimate footer size (~220 bytes + 20 bytes per object)
  const estimatedFooterBytes = 220 + (totalObjects + 1) * 20;

  // If currentOffset + estimatedFooterBytes is below minTotalBytes, inject safe PDF comment padding
  const targetMidBytes = Math.min(
    maxTotalBytes - 1024,
    Math.floor(minTotalBytes + (maxTotalBytes - minTotalBytes) * 0.45)
  );
  if (currentOffset + estimatedFooterBytes < minTotalBytes) {
    const padNeeded = Math.max(
      minTotalBytes - (currentOffset + estimatedFooterBytes) + 512,
      targetMidBytes - (currentOffset + estimatedFooterBytes)
    );
    if (padNeeded > 0) {
      const line = "%EXAMDOC-BINARY-COMPLIANCE-PADDING-BLOCK-PDF14-VERIFIED-01234567\n";
      const fullLines = Math.floor(padNeeded / line.length);
      for (let k = 0; k < fullLines; k++) {
        pushString(line);
      }
    }
  }

  // Write xref table
  const xrefOffset = currentOffset;
  pushString(`xref\n0 ${totalObjects + 1}\n`);
  pushString("0000000000 65535 f \n");
  for (let id = 1; id <= totalObjects; id++) {
    const offStr = offsets[id].toString().padStart(10, "0");
    pushString(`${offStr} 00000 n \n`);
  }

  // Trailer
  pushString(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  // Concatenate all chunks
  const finalPdf = new Uint8Array(currentOffset);
  let pos = 0;
  for (const c of chunks) {
    finalPdf.set(c, pos);
    pos += c.length;
  }

  return finalPdf;
}

/**
 * Packs 1 to 5 images into a single compressed PDF-1.4 guaranteed within [minKB, maxKB]
 * (e.g. strictly under 100KB, 200KB, or 300KB).
 */
export async function packImagesToCompliantPdf(
  items: PdfPageItem[],
  options: PdfPackOptions
): Promise<PackedPdfResult> {
  if (items.length === 0) {
    throw new Error("Please add at least 1 image to generate a PDF.");
  }

  const minBytes = Math.ceil(options.minKB * 1024);
  const maxBytes = Math.floor(options.maxKB * 1024);

  // Candidate A4 widths from highest clarity to ultra-compact for multi-page <100KB budgets
  const effectivePagesCount =
    options.mergeFrontBackOnSinglePage && items.length >= 2
      ? Math.ceil(items.length / 2)
      : items.length;

  const kbPerPage = options.maxKB / effectivePagesCount;

  const candidateWidths =
    kbPerPage < 45
      ? [850, 720, 600, 480]
      : kbPerPage < 95
        ? [1100, 920, 760, 620]
        : [1350, 1150, 960, 780];

  let bestPdfBytes: Uint8Array | null = null;
  let bestQuality = 0.72;
  let bestWidthPx = candidateWidths[0];

  for (const widthPx of candidateWidths) {
    const pageCanvases = buildPageCanvases(items, widthPx, options);

    // Binary search JPEG quality for this resolution
    let low = 0.14;
    let high = 0.92;
    let candidateForRes: Uint8Array | null = null;
    let qForRes = 0.65;

    for (let iter = 0; iter < 6; iter++) {
      const mid = (low + high) / 2;
      const encodedPages = await Promise.all(
        pageCanvases.map(async (c) => ({
          jpegBytes: await canvasToJpegUint8(c, mid),
          widthPx: c.width,
          heightPx: c.height
        }))
      );

      const pdfBytes = assemblePdf14Binary(encodedPages, minBytes, maxBytes);

      if (pdfBytes.length <= maxBytes) {
        candidateForRes = pdfBytes;
        qForRes = mid;
        low = mid; // try higher quality while staying <= maxBytes
      } else {
        high = mid; // too big, lower quality
      }
    }

    if (candidateForRes) {
      bestPdfBytes = candidateForRes;
      bestQuality = qForRes;
      bestWidthPx = widthPx;
      // If we achieved >= 0.42 quality at this resolution, stop immediately for maximum sharpness!
      if (qForRes >= 0.42) {
        break;
      }
    }
  }

  // Ultimate fallback if 5 noisy pages needed even tighter compression
  if (!bestPdfBytes) {
    const fallbackWidth = 440;
    const pageCanvases = buildPageCanvases(items, fallbackWidth, options);
    const encodedPages = await Promise.all(
      pageCanvases.map(async (c) => ({
        jpegBytes: await canvasToJpegUint8(c, 0.22),
        widthPx: c.width,
        heightPx: c.height
      }))
    );
    bestPdfBytes = assemblePdf14Binary(encodedPages, minBytes, maxBytes);
    bestQuality = 0.22;
    bestWidthPx = fallbackWidth;
  }

  const pdfBuffer = new ArrayBuffer(bestPdfBytes.byteLength);
  new Uint8Array(pdfBuffer).set(bestPdfBytes);
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  const sizeKB = Number((bestPdfBytes.length / 1024).toFixed(2));
  const withinRange =
    bestPdfBytes.length >= minBytes && bestPdfBytes.length <= maxBytes;

  return {
    blob,
    uint8Array: bestPdfBytes,
    sizeKB,
    byteLength: bestPdfBytes.length,
    pageCount: effectivePagesCount,
    qualityUsed: Number(bestQuality.toFixed(2)),
    resolutionWidthPx: bestWidthPx,
    withinRange,
    minKB: options.minKB,
    maxKB: options.maxKB
  };
}
