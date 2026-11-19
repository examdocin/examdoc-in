export interface LoadedScanSource {
  id: string;
  name: string;
  width: number;
  height: number;
  imageData: ImageData;
  dataUrl: string;
}

const MAX_WORKING_EDGE_PX = 2200;

/**
 * Safely revokes an object URL if valid.
 */
export function revokeObjectUrlSafely(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Ignore revoke errors
  }
}

/**
 * Loads an image File or Blob using createImageBitmap (automatically respecting EXIF orientation)
 * with a fallback to HTMLImageElement, and downscales buffers above 2200px max edge
 * so 48MP/50MP smartphone camera photos never crash mobile browser RAM.
 */
export async function loadScanSourceFromFile(
  file: File | Blob,
  customName?: string
): Promise<LoadedScanSource> {
  const name =
    customName || (file instanceof File ? file.name : `scan-${Date.now()}.jpg`);

  let srcWidth = 0;
  let srcHeight = 0;
  let bitmap: ImageBitmap | null = null;
  let fallbackImg: HTMLImageElement | null = null;
  let objectUrl: string | null = null;

  try {
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file, {
          imageOrientation: "from-image"
        });
      } catch {
        bitmap = await createImageBitmap(file);
      }
      srcWidth = bitmap.width;
      srcHeight = bitmap.height;
    } else {
      objectUrl = URL.createObjectURL(file);
      fallbackImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not decode image file"));
        img.src = objectUrl!;
      });
      srcWidth = fallbackImg.naturalWidth;
      srcHeight = fallbackImg.naturalHeight;
    }

    const maxEdge = Math.max(srcWidth, srcHeight);
    const scale =
      maxEdge > MAX_WORKING_EDGE_PX ? MAX_WORKING_EDGE_PX / maxEdge : 1;

    const targetW = Math.max(64, Math.round(srcWidth * scale));
    const targetH = Math.max(64, Math.round(srcHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2D Canvas context unavailable");
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetW, targetH);

    if (bitmap) {
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();
      bitmap = null;
    } else if (fallbackImg) {
      ctx.drawImage(fallbackImg, 0, 0, targetW, targetH);
    }

    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    return {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      width: targetW,
      height: targetH,
      imageData,
      dataUrl
    };
  } finally {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        // Ignore close errors
      }
    }
    revokeObjectUrlSafely(objectUrl);
  }
}

/**
 * Rotates a LoadedScanSource 90 degrees clockwise.
 */
export function rotateScanSource90(source: LoadedScanSource): LoadedScanSource {
  const srcCanvas = imageDataToCanvas(source.imageData);
  const outW = source.height;
  const outH = source.width;

  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = outW;
  dstCanvas.height = outH;
  const ctx = dstCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D Canvas context unavailable");
  }

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(srcCanvas, -source.width / 2, -source.height / 2);
  ctx.restore();

  const rotatedData = ctx.getImageData(0, 0, outW, outH);
  return {
    ...source,
    width: outW,
    height: outH,
    imageData: rotatedData,
    dataUrl: dstCanvas.toDataURL("image/jpeg", 0.92)
  };
}

/**
 * Converts an ImageData buffer into an HTMLCanvasElement.
 */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D Canvas context unavailable");
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Converts an ImageData buffer into an HTMLImageElement for seamless interop with
 * lib/pdfBinaryEngine.ts and ExamDocWorkbench tabs.
 */
export function imageDataToHtmlImage(
  imageData: ImageData,
  quality = 0.92
): Promise<{ image: HTMLImageElement; dataUrl: string; canvas: HTMLCanvasElement }> {
  const canvas = imageDataToCanvas(imageData);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ image: img, dataUrl, canvas });
    img.onerror = () => reject(new Error("Failed to decode scan canvas to Image"));
    img.src = dataUrl;
  });
}
