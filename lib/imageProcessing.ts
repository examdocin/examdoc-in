export interface PhotoRenderConfig {
  widthPx: number;
  heightPx: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  brightness: number; // -50 to +50
  contrast: number; // -50 to +50
  whiteBgBoost: boolean;
  showNameDopPlaque: boolean;
  candidateName: string;
  dateOfPhoto: string; // e.g., "18-11-2026"
  dopPrefix: string; // e.g., "DOP:" or ""
  borderWidthPx: number;
}

export type InkColorMode = "natural" | "black" | "blue";

export interface SignatureThresholdConfig {
  widthPx: number;
  heightPx: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  adaptiveThreshold: number; // 0 to 100 (default 55)
  inkSharpness: number; // 0 to 100 (default 65)
  inkMode: InkColorMode;
  autoTrimPadding: boolean;
}

export interface StudioSheetConfig {
  layout: "8-landscape" | "8-portrait" | "12-landscape";
  showCutLines: boolean;
  showPhotoBorder: boolean;
  paperMarginPx: number;
}

/**
 * Loads any user File (WhatsApp WebP, PNG, JPG, etc.) into an HTMLImageElement.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Could not decode "${file.name}". Please select a standard image file (JPG, PNG, WebP).`
        )
      );
    };
    img.src = url;
  });
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image DataURL"));
    img.src = dataUrl;
  });
}

function clampByte(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
}

/**
 * Applies pixel-level brightness, contrast, and optional background whitening boost.
 */
function applyPhotoPixelAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number,
  whiteBgBoost: boolean
): void {
  if (brightness === 0 && contrast === 0 && !whiteBgBoost) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const brightnessOffset = (brightness / 100) * 140;
  const contrastFactor = (259 * (contrast * 1.8 + 255)) / (255 * (259 - contrast * 1.8));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Apply contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Plain wall background brightness boost (lifts near-white/light-gray wall pixels towards pure white)
    if (whiteBgBoost) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const saturation = maxCh - minCh;
      // Low-saturation bright background pixels get smoothly pushed to pure white
      if (lum > 185 && saturation < 38) {
        const boost = Math.min(1, (lum - 185) / 55);
        r = r + (255 - r) * boost * 0.85;
        g = g + (255 - g) * boost * 0.85;
        b = b + (255 - b) * boost * 0.85;
      }
    }

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders Tab 1 Photo onto an exact target canvas (without the green alignment guide).
 * Includes the Name & Date of Photo (DOP) bottom white plaque when enabled.
 */
export function renderPassportPhotoCanvas(
  sourceImage: HTMLImageElement,
  config: PhotoRenderConfig
): HTMLCanvasElement {
  const {
    widthPx,
    heightPx,
    zoom,
    panX,
    panY,
    rotation,
    brightness,
    contrast,
    whiteBgBoost,
    showNameDopPlaque,
    candidateName,
    dateOfPhoto,
    dopPrefix,
    borderWidthPx
  } = config;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D Canvas context unavailable");
  }

  // Fill baseline pure white background (converts transparent PNG/WebP cleanly)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, widthPx, heightPx);

  const isRotated90 = Math.abs(rotation % 180) === 90;
  const srcW = isRotated90 ? sourceImage.naturalHeight : sourceImage.naturalWidth;
  const srcH = isRotated90 ? sourceImage.naturalWidth : sourceImage.naturalHeight;

  // Calculate cover scale so the photo fills the frame at zoom = 1
  const baseScale = Math.max(widthPx / Math.max(1, srcW), heightPx / Math.max(1, srcH));
  const finalScale = baseScale * zoom;

  ctx.save();
  ctx.translate(widthPx / 2 + panX * (widthPx / 250), heightPx / 2 + panY * (heightPx / 250));
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(finalScale, finalScale);
  ctx.drawImage(
    sourceImage,
    -sourceImage.naturalWidth / 2,
    -sourceImage.naturalHeight / 2,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight
  );
  ctx.restore();

  // Apply pixel-level brightness, contrast & plain-background whitening
  applyPhotoPixelAdjustments(ctx, widthPx, heightPx, brightness, contrast, whiteBgBoost);

  // Draw Name & Date of Photo (DOP) bottom white plaque if enabled
  if (showNameDopPlaque) {
    const cleanName = candidateName.trim().toUpperCase();
    const cleanDate = dateOfPhoto.trim();
    const hasBoth = cleanName.length > 0 && cleanDate.length > 0;
    const plaqueHeight = Math.round(heightPx * (hasBoth ? 0.19 : 0.12));
    const plaqueY = heightPx - plaqueHeight;

    // White plaque background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, plaqueY, widthPx, plaqueHeight);

    // Top divider line
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = Math.max(1, Math.round(heightPx / 220));
    ctx.beginPath();
    ctx.moveTo(0, plaqueY);
    ctx.lineTo(widthPx, plaqueY);
    ctx.stroke();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxTextWidth = widthPx * 0.92;

    const fitFontSize = (text: string, initialPx: number): number => {
      let size = initialPx;
      while (size > 8) {
        ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
        if (ctx.measureText(text).width <= maxTextWidth) {
          break;
        }
        size -= 1;
      }
      return size;
    };

    const dateLine = cleanDate
      ? `${dopPrefix ? dopPrefix.trim() + " " : ""}${cleanDate}`
      : "";

    if (hasBoth) {
      const baseFontPx = Math.max(10, Math.round(plaqueHeight * 0.36));
      const nameSize = fitFontSize(cleanName, baseFontPx);
      ctx.font = `700 ${nameSize}px Arial, Helvetica, sans-serif`;
      ctx.fillText(cleanName, widthPx / 2, plaqueY + plaqueHeight * 0.31);

      const dateSize = fitFontSize(dateLine, Math.max(9, Math.round(plaqueHeight * 0.33)));
      ctx.font = `700 ${dateSize}px Arial, Helvetica, sans-serif`;
      ctx.fillText(dateLine, widthPx / 2, plaqueY + plaqueHeight * 0.73);
    } else {
      const singleLine = cleanName || dateLine || "CANDIDATE NAME";
      const singleSize = fitFontSize(singleLine, Math.max(11, Math.round(plaqueHeight * 0.52)));
      ctx.font = `700 ${singleSize}px Arial, Helvetica, sans-serif`;
      ctx.fillText(singleLine, widthPx / 2, plaqueY + plaqueHeight * 0.52);
    }
  }

  // Optional outer studio border
  if (borderWidthPx > 0) {
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = borderWidthPx * 2;
    ctx.strokeRect(0, 0, widthPx, heightPx);
  }

  return canvas;
}

/**
 * Draws the 80% Face Coverage Oval Guide overlay on top of a preview canvas
 * (used strictly for visual alignment in Tab 1 & Tab 4; never burned into the exported JPG).
 */
export function draw80PercentFaceGuideOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasPlaque: boolean
): void {
  const usableHeight = hasPlaque ? height * 0.81 : height;
  const centerX = width / 2;
  const centerY = usableHeight * 0.48;
  const radiusX = width * 0.33;
  const radiusY = usableHeight * 0.37; // ~74-80% head height coverage

  ctx.save();

  // Outer dashed oval
  ctx.strokeStyle = "rgba(16, 185, 129, 0.92)";
  ctx.lineWidth = Math.max(2, Math.round(width / 140));
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Eye-level & ear-alignment horizontal guide line
  const eyeY = centerY - radiusY * 0.1;
  ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX * 1.15, eyeY);
  ctx.lineTo(centerX + radiusX * 1.15, eyeY);
  ctx.stroke();

  // Crown & Chin markers
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(6, 95, 70, 0.85)";
  const badgeFont = Math.max(9, Math.round(width / 26));
  ctx.font = `600 ${badgeFont}px Arial, sans-serif`;
  ctx.textAlign = "center";

  // Top label
  ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
  ctx.fillText("TOP OF HEAD (80% FACE GUIDE)", centerX, Math.max(14, centerY - radiusY - 6));
  ctx.fillText("CHIN LEVEL", centerX, Math.min(usableHeight - 6, centerY + radiusY + badgeFont + 4));

  // Shoulder curve
  ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
  ctx.lineWidth = Math.max(1.5, Math.round(width / 160));
  ctx.beginPath();
  ctx.moveTo(width * 0.08, usableHeight * 0.98);
  ctx.quadraticCurveTo(width * 0.22, centerY + radiusY * 0.92, centerX - radiusX * 0.45, centerY + radiusY * 0.9);
  ctx.moveTo(width * 0.92, usableHeight * 0.98);
  ctx.quadraticCurveTo(width * 0.78, centerY + radiusY * 0.92, centerX + radiusX * 0.45, centerY + radiusY * 0.9);
  ctx.stroke();

  ctx.restore();
}

/**
 * Tab 2: Adaptive Luminance Thresholding Engine for Signatures, Left-Thumb Impressions & Hand-Written Declarations.
 * Uses a fast integral-image (Summed-Area Table) local neighborhood luminance threshold so that uneven
 * mobile camera lighting and gray notebook paper become 100% pure #FFFFFF white while ink strokes are sharpened.
 */
export function renderSignatureThresholdCanvas(
  sourceImage: HTMLImageElement,
  config: SignatureThresholdConfig
): HTMLCanvasElement {
  const {
    widthPx,
    heightPx,
    zoom,
    panX,
    panY,
    rotation,
    adaptiveThreshold,
    inkSharpness,
    inkMode
  } = config;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D Canvas context unavailable");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, widthPx, heightPx);

  const isRotated90 = Math.abs(rotation % 180) === 90;
  const srcW = isRotated90 ? sourceImage.naturalHeight : sourceImage.naturalWidth;
  const srcH = isRotated90 ? sourceImage.naturalWidth : sourceImage.naturalHeight;

  // Fit signature cleanly inside canvas at zoom = 1
  const baseScale = Math.min(widthPx / Math.max(1, srcW), heightPx / Math.max(1, srcH)) * 0.94;
  const finalScale = baseScale * zoom;

  ctx.save();
  ctx.translate(widthPx / 2 + panX * (widthPx / 250), heightPx / 2 + panY * (heightPx / 250));
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(finalScale, finalScale);
  ctx.drawImage(
    sourceImage,
    -sourceImage.naturalWidth / 2,
    -sourceImage.naturalHeight / 2,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight
  );
  ctx.restore();

  if (adaptiveThreshold <= 0) {
    return canvas;
  }

  const imgData = ctx.getImageData(0, 0, widthPx, heightPx);
  const data = imgData.data;
  const totalPixels = widthPx * heightPx;

  // Step 1: Compute per-pixel luminance and build a 2D integral image
  const lum = new Float32Array(totalPixels);
  const integral = new Float64Array((widthPx + 1) * (heightPx + 1));

  for (let y = 0; y < heightPx; y++) {
    let rowSum = 0;
    for (let x = 0; x < widthPx; x++) {
      const idx = (y * widthPx + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Perceptual luminance
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      lum[y * widthPx + x] = l;
      rowSum += l;
      integral[(y + 1) * (widthPx + 1) + (x + 1)] =
        integral[y * (widthPx + 1) + (x + 1)] + rowSum;
    }
  }

  // Window radius adapts to canvas resolution
  const radius = Math.max(8, Math.round(Math.min(widthPx, heightPx) / 14));
  // Sensitivity offset C: lower C captures lighter ink strokes, higher C suppresses paper grain
  const cOffset = 28 - (adaptiveThreshold / 100) * 23;
  // Global bright-paper cutoff so pure white regions stay white
  const globalPaperCutoff = 242 - (100 - adaptiveThreshold) * 0.45;
  const sharpnessGamma = 1 + (inkSharpness / 100) * 2.2;

  for (let y = 0; y < heightPx; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(heightPx - 1, y + radius);
    for (let x = 0; x < widthPx; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(widthPx - 1, x + radius);

      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (widthPx + 1) + (x1 + 1)] -
        integral[y0 * (widthPx + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (widthPx + 1) + x0] +
        integral[y0 * (widthPx + 1) + x0];

      const localMean = sum / count;
      const pixelLum = lum[y * widthPx + x];
      const idx = (y * widthPx + x) * 4;

      const localCutoff = localMean - cOffset;

      if (pixelLum >= localCutoff || pixelLum >= globalPaperCutoff) {
        // Bleach background paper to pure #FFFFFF
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      } else {
        // Ink pixel: compute normalized ink darkness [0..1]
        const rawDarkness = Math.min(1, Math.max(0.05, (localCutoff - pixelLum) / Math.max(12, localCutoff * 0.55)));
        const boostedDarkness = Math.min(1, Math.pow(rawDarkness, 1 / sharpnessGamma) * 1.18);

        if (inkMode === "black") {
          // Crisp jet-black ink blended smoothly on anti-aliased edges
          const v = clampByte(255 * (1 - boostedDarkness * 0.96));
          data[idx] = v;
          data[idx + 1] = v;
          data[idx + 2] = v;
        } else if (inkMode === "blue") {
          // Royal blue ballpoint / stamp pad ink (#0B2E8A)
          data[idx] = clampByte(255 - boostedDarkness * 244);
          data[idx + 1] = clampByte(255 - boostedDarkness * 209);
          data[idx + 2] = clampByte(255 - boostedDarkness * 117);
        } else {
          // Natural ink mode: preserve blue vs black pen hue while deepening ink contrast
          const origR = data[idx];
          const origG = data[idx + 1];
          const origB = data[idx + 2];
          const isBluePen = origB - origR > 14 && origB > origG;
          if (isBluePen) {
            data[idx] = clampByte(255 - boostedDarkness * 240);
            data[idx + 1] = clampByte(255 - boostedDarkness * 205);
            data[idx + 2] = clampByte(255 - boostedDarkness * 110);
          } else {
            const v = clampByte(255 * (1 - boostedDarkness * 0.95));
            data[idx] = v;
            data[idx + 1] = v;
            data[idx + 2] = v;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Tab 5: Generates a 300-DPI 4x6 Inch Studio Print Sheet (1800x1200 px or 1200x1800 px)
 * with 8 or 12 copies of the candidate's passport photo and scissor cut marks for ₹10 local lab printing.
 */
export function render4x6StudioPrintSheet(
  singlePhotoCanvas: HTMLCanvasElement,
  config: StudioSheetConfig
): HTMLCanvasElement {
  const isPortrait = config.layout === "8-portrait";
  const sheetW = isPortrait ? 1200 : 1800; // 4x6 inch at 300 DPI
  const sheetH = isPortrait ? 1800 : 1200;

  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D Canvas context unavailable");
  }

  // Pure white photographic paper background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, sheetW, sheetH);

  const cols = config.layout === "12-landscape" ? 4 : isPortrait ? 2 : 4;
  const rows = config.layout === "12-landscape" ? 3 : isPortrait ? 4 : 2;

  const outerPadX = config.paperMarginPx;
  const outerPadY = config.paperMarginPx + 24;
  const availW = sheetW - outerPadX * 2;
  const availH = sheetH - outerPadY * 2;

  const gap = 28;
  const maxCellW = (availW - gap * (cols - 1)) / cols;
  const maxCellH = (availH - gap * (rows - 1)) / rows;

  // Maintain the passport photo's exact aspect ratio inside each cell
  const photoAspect = singlePhotoCanvas.width / singlePhotoCanvas.height;
  let drawW = maxCellW;
  let drawH = drawW / photoAspect;
  if (drawH > maxCellH) {
    drawH = maxCellH;
    drawW = drawH * photoAspect;
  }

  drawW = Math.round(drawW);
  drawH = Math.round(drawH);

  const totalGridW = cols * drawW + (cols - 1) * gap;
  const totalGridH = rows * drawH + (rows - 1) * gap;
  const startX = Math.round((sheetW - totalGridW) / 2);
  const startY = Math.round((sheetH - totalGridH) / 2) + 10;

  // Top studio calibration header (outside cut area)
  ctx.fillStyle = "#6B7280";
  ctx.font = "600 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `4×6 INCH (10×15 CM) @ 300 DPI STUDIO SHEET • ${cols * rows} PHOTOS • EXAMDOC.IN`,
    startX,
    Math.max(26, startY - 18)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (drawW + gap);
      const y = startY + r * (drawH + gap);

      ctx.drawImage(singlePhotoCanvas, x, y, drawW, drawH);

      if (config.showPhotoBorder) {
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, drawW, drawH);
      }

      if (config.showCutLines) {
        ctx.save();
        ctx.strokeStyle = "#9CA3AF";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 5]);
        ctx.strokeRect(x - 6, y - 6, drawW + 12, drawH + 12);

        // Corner crop ticks
        ctx.setLineDash([]);
        ctx.strokeStyle = "#4B5563";
        const tick = 10;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 10 + tick, y);
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y - 10 + tick);
        // Top-right
        ctx.moveTo(x + drawW + 10, y);
        ctx.lineTo(x + drawW + 10 - tick, y);
        ctx.moveTo(x + drawW, y - 10);
        ctx.lineTo(x + drawW, y - 10 + tick);
        // Bottom-left
        ctx.moveTo(x - 10, y + drawH);
        ctx.lineTo(x - 10 + tick, y + drawH);
        ctx.moveTo(x, y + drawH + 10);
        ctx.lineTo(x, y + drawH + 10 - tick);
        // Bottom-right
        ctx.moveTo(x + drawW + 10, y + drawH);
        ctx.lineTo(x + drawW + 10 - tick, y + drawH);
        ctx.moveTo(x + drawW, y + drawH + 10);
        ctx.lineTo(x + drawW, y + drawH + 10 - tick);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  return canvas;
}
