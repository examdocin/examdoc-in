export interface BinaryVerificationReport {
  byteLength: number;
  sizeKB: number;
  widthPx: number;
  heightPx: number;
  dpiX: number;
  dpiY: number;
  dpiUnits: number;
  magicHex: string;
  jfifBytes13To17Hex: string;
  eoiHex: string;
  qualityUsed: number;
  paddedBytes: number;
  withinRange: boolean;
  minKB: number;
  maxKB: number;
}

export interface PackedJpegResult {
  blob: Blob;
  uint8Array: Uint8Array;
  dataUrl: string;
  report: BinaryVerificationReport;
}

/**
 * Injects exact DPI (e.g., 200, 300, or 600) into the JPEG JFIF APP0 header (bytes 13-17).
 * Guarantees that the output starts with 0xFFD8FFE0 ("JFIF\0") and bytes 13..17 equal:
 * [0x01, dpiHigh, dpiLow, dpiHigh, dpiLow]
 */
export function injectJfifDpiHeader(rawJpeg: Uint8Array, dpi: number): Uint8Array {
  if (rawJpeg.length < 4 || rawJpeg[0] !== 0xff || rawJpeg[1] !== 0xd8) {
    throw new Error("Invalid JPEG stream: missing 0xFFD8 SOI marker.");
  }

  const dpiHigh = (dpi >> 8) & 0xff;
  const dpiLow = dpi & 0xff;

  const hasApp0Jfif =
    rawJpeg.length >= 20 &&
    rawJpeg[2] === 0xff &&
    rawJpeg[3] === 0xe0 &&
    rawJpeg[6] === 0x4a && // 'J'
    rawJpeg[7] === 0x46 && // 'F'
    rawJpeg[8] === 0x49 && // 'I'
    rawJpeg[9] === 0x46 && // 'F'
    rawJpeg[10] === 0x00;

  if (hasApp0Jfif) {
    const out = new Uint8Array(rawJpeg.length);
    out.set(rawJpeg);
    // Byte 13: Density units = 1 (pixels per inch)
    out[13] = 0x01;
    // Bytes 14-15: Xdensity (Big-Endian uint16)
    out[14] = dpiHigh;
    out[15] = dpiLow;
    // Bytes 16-17: Ydensity (Big-Endian uint16)
    out[16] = dpiHigh;
    out[17] = dpiLow;
    return out;
  }

  // Construct canonical 18-byte JFIF APP0 segment right after SOI (0xFFD8)
  const app0Segment = new Uint8Array([
    0xff,
    0xe0, // APP0 marker
    0x00,
    0x10, // Length = 16 bytes
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00, // "JFIF\0"
    0x01,
    0x01, // Version 1.1
    0x01, // Byte 13: Units = 1 (dots per inch)
    dpiHigh,
    dpiLow, // Bytes 14-15: Xdensity
    dpiHigh,
    dpiLow, // Bytes 16-17: Ydensity
    0x00,
    0x00 // Thumbnail 0x0
  ]);

  const out = new Uint8Array(rawJpeg.length + app0Segment.length);
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(app0Segment, 2);
  out.set(rawJpeg.subarray(2), 2 + app0Segment.length);
  return out;
}

/**
 * Pads a JPEG binary stream before the 0xFFD9 EOI marker using standard JPEG COM (0xFFFE) segments
 * so that all strict government portal validators (ImageIO, libjpeg, GD, Pillow) parse it cleanly
 * while bringing the exact byte count up to targetByteLength.
 */
export function padJpegBeforeEoi(jpegBytes: Uint8Array, targetByteLength: number): {
  bytes: Uint8Array;
  paddedBytes: number;
} {
  if (jpegBytes.length >= targetByteLength) {
    return { bytes: jpegBytes, paddedBytes: 0 };
  }

  // Locate the final EOI marker (0xFFD9)
  let eoiIndex = jpegBytes.length - 2;
  for (let i = jpegBytes.length - 2; i >= 2; i--) {
    if (jpegBytes[i] === 0xff && jpegBytes[i + 1] === 0xd9) {
      eoiIndex = i;
      break;
    }
  }

  let needed = targetByteLength - jpegBytes.length;
  // Minimum COM segment overhead is 4 bytes: 0xFF 0xFE + 2-byte length (which includes the 2 length bytes)
  if (needed < 4) {
    needed = 4;
  }

  const paddingChunks: Uint8Array[] = [];
  let remaining = needed;

  while (remaining > 0) {
    if (remaining < 4) {
      // Expand previous chunk if possible, or add minimal 4-byte COM segment
      const minCom = new Uint8Array([0xff, 0xfe, 0x00, 0x02]);
      paddingChunks.push(minCom);
      remaining = 0;
      break;
    }
    // Max payload per COM segment is 65533 bytes (+2 length bytes +2 marker bytes = 65537)
    // Reserve at least 4 bytes if a tail chunk will be required
    let chunkTotal = Math.min(remaining, 60000);
    if (remaining - chunkTotal > 0 && remaining - chunkTotal < 4) {
      chunkTotal -= 4;
    }
    const payloadLen = chunkTotal - 4;
    const segLen = payloadLen + 2; // JPEG segment length includes the 2 length bytes
    const chunk = new Uint8Array(chunkTotal);
    chunk[0] = 0xff;
    chunk[1] = 0xfe; // COM marker
    chunk[2] = (segLen >> 8) & 0xff;
    chunk[3] = segLen & 0xff;
    // Fill payload with deterministic ASCII metadata safe bytes ('E', 'X', 'A', 'M', 'D', 'O', 'C', ' ')
    const pattern = [0x45, 0x58, 0x41, 0x4d, 0x44, 0x4f, 0x43, 0x20];
    for (let i = 0; i < payloadLen; i++) {
      chunk[4 + i] = pattern[i % pattern.length];
    }
    paddingChunks.push(chunk);
    remaining -= chunkTotal;
  }

  const totalPadLen = paddingChunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(eoiIndex + totalPadLen + 2);
  out.set(jpegBytes.subarray(0, eoiIndex), 0);

  let offset = eoiIndex;
  for (const chunk of paddingChunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  // Final EOI marker (0xFFD9)
  out[offset] = 0xff;
  out[offset + 1] = 0xd9;

  return { bytes: out, paddedBytes: totalPadLen };
}

function toHexByte(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, "0");
}

export function inspectJpegBinary(
  bytes: Uint8Array,
  widthPx: number,
  heightPx: number,
  minKB: number,
  maxKB: number,
  qualityUsed: number,
  paddedBytes: number
): BinaryVerificationReport {
  const magicHex =
    bytes.length >= 4
      ? `${toHexByte(bytes[0])}${toHexByte(bytes[1])} ${toHexByte(bytes[2])}${toHexByte(bytes[3])}`
      : "INVALID";

  const jfifBytes13To17Hex =
    bytes.length >= 18
      ? `${toHexByte(bytes[13])} ${toHexByte(bytes[14])}${toHexByte(bytes[15])} ${toHexByte(bytes[16])}${toHexByte(bytes[17])}`
      : "N/A";

  const dpiUnits = bytes.length >= 14 ? bytes[13] : 0;
  const dpiX = bytes.length >= 16 ? (bytes[14] << 8) | bytes[15] : 0;
  const dpiY = bytes.length >= 18 ? (bytes[16] << 8) | bytes[17] : 0;

  const eoiHex =
    bytes.length >= 2
      ? `${toHexByte(bytes[bytes.length - 2])}${toHexByte(bytes[bytes.length - 1])}`
      : "N/A";

  const sizeKB = Number((bytes.length / 1024).toFixed(2));
  const withinRange = bytes.length >= minKB * 1024 && bytes.length <= maxKB * 1024;

  return {
    byteLength: bytes.length,
    sizeKB,
    widthPx,
    heightPx,
    dpiX,
    dpiY,
    dpiUnits,
    magicHex,
    jfifBytes13To17Hex,
    eoiHex,
    qualityUsed: Number(qualityUsed.toFixed(3)),
    paddedBytes,
    withinRange,
    minKB,
    maxKB
  };
}

async function canvasToRawJpegBytes(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      },
      "image/jpeg",
      quality
    );
  });
}

function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Encodes a Canvas into a baseline standard JPEG (0xFFD8FFE0) with:
 * 1. Exact 200/300/600 DPI injected in bytes 13-17 of the JFIF APP0 header.
 * 2. 10-step Binary Search on JPEG quality to land inside [minKB, maxKB].
 * 3. High-frequency detail softening fallback if even quality=0.05 exceeds maxKB.
 * 4. Safe JPEG COM segment padding before 0xFFD9 EOI if quality=0.98 is still below minKB.
 */
export async function encodeCompliantJpeg(
  sourceCanvas: HTMLCanvasElement,
  options: {
    minKB: number;
    maxKB: number;
    dpi: 200 | 300 | 600;
  }
): Promise<PackedJpegResult> {
  const { minKB, maxKB, dpi } = options;
  const minBytes = Math.ceil(minKB * 1024);
  const maxBytes = Math.floor(maxKB * 1024);
  // Target sweet spot: 55% of the [minBytes, maxBytes] range
  const targetBytes = Math.floor(minBytes + (maxBytes - minBytes) * 0.55);

  let low = 0.06;
  let high = 0.98;
  let bestBytes: Uint8Array | null = null;
  let bestQuality = 0.85;

  // Binary search across 9 iterations for JPEG quality
  for (let iter = 0; iter < 9; iter++) {
    const mid = (low + high) / 2;
    const raw = await canvasToRawJpegBytes(sourceCanvas, mid);
    const withDpi = injectJfifDpiHeader(raw, dpi);

    if (withDpi.length > maxBytes) {
      high = mid;
    } else if (withDpi.length < minBytes) {
      low = mid;
      bestBytes = withDpi;
      bestQuality = mid;
    } else {
      bestBytes = withDpi;
      bestQuality = mid;
      // Narrow closer to targetBytes
      if (withDpi.length > targetBytes) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  // If bestBytes is still null (meaning even quality = 0.06 was > maxBytes),
  // soften high-frequency DCT noise on an intermediate canvas while keeping exact output dimensions
  if (!bestBytes) {
    let scaleFactor = 0.82;
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    while (scaleFactor >= 0.25) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = Math.max(16, Math.round(w * scaleFactor));
      tempCanvas.height = Math.max(16, Math.round(h * scaleFactor));
      const tCtx = tempCanvas.getContext("2d");
      if (tCtx) {
        tCtx.fillStyle = "#FFFFFF";
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
      }

      const outCanvas = document.createElement("canvas");
      outCanvas.width = w;
      outCanvas.height = h;
      const oCtx = outCanvas.getContext("2d");
      if (oCtx) {
        oCtx.fillStyle = "#FFFFFF";
        oCtx.fillRect(0, 0, w, h);
        oCtx.drawImage(tempCanvas, 0, 0, w, h);
      }

      const raw = await canvasToRawJpegBytes(outCanvas, 0.35);
      const withDpi = injectJfifDpiHeader(raw, dpi);
      if (withDpi.length <= maxBytes) {
        bestBytes = withDpi;
        bestQuality = 0.35;
        break;
      }
      scaleFactor -= 0.12;
    }

    if (!bestBytes) {
      const raw = await canvasToRawJpegBytes(sourceCanvas, 0.04);
      bestBytes = injectJfifDpiHeader(raw, dpi);
      bestQuality = 0.04;
    }
  }

  let finalBytes = bestBytes;
  let paddedBytes = 0;

  // If the image at max quality is still below minBytes, pad safely before 0xFFD9
  if (finalBytes.length < minBytes) {
    const safeTarget = Math.min(maxBytes - 256, Math.max(minBytes + 512, targetBytes));
    const padded = padJpegBeforeEoi(finalBytes, safeTarget);
    finalBytes = padded.bytes;
    paddedBytes = padded.paddedBytes;
  }

  const blobBuffer = new ArrayBuffer(finalBytes.byteLength);
  new Uint8Array(blobBuffer).set(finalBytes);
  const blob = new Blob([blobBuffer], { type: "image/jpeg" });
  const dataUrl = uint8ArrayToDataUrl(finalBytes, "image/jpeg");
  const report = inspectJpegBinary(
    finalBytes,
    sourceCanvas.width,
    sourceCanvas.height,
    minKB,
    maxKB,
    bestQuality,
    paddedBytes
  );

  return {
    blob,
    uint8Array: finalBytes,
    dataUrl,
    report
  };
}
