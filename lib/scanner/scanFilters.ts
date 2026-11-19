export type ScanFilterId =
  | "magic"
  | "bw"
  | "lighten"
  | "grayscale"
  | "original";

export interface ScanFilterOptions {
  filter: ScanFilterId;
  brightness: number; // -50 to +50 (default 0)
  contrast: number;   // -50 to +50 (default 0)
}

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : Math.round(n);
}

/**
 * Computes a fast low-resolution illumination background map (per RGB channel)
 * using block-percentile / morphological dilation + box-blur smoothing so dark ink text
 * does not darken the local paper illumination estimate.
 */
function estimateBackgroundSurface(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): { bgR: Float32Array; bgG: Float32Array; bgB: Float32Array; gridW: number; gridH: number } {
  const step = 16;
  const gridW = Math.max(4, Math.ceil(width / step));
  const gridH = Math.max(4, Math.ceil(height / step));
  const totalCells = gridW * gridH;

  const rawR = new Float32Array(totalCells);
  const rawG = new Float32Array(totalCells);
  const rawB = new Float32Array(totalCells);

  // For each 16x16 cell, take the upper-quartile / max bright paper pixel
  for (let gy = 0; gy < gridH; gy++) {
    const y0 = gy * step;
    const y1 = Math.min(height, y0 + step);
    for (let gx = 0; gx < gridW; gx++) {
      const x0 = gx * step;
      const x1 = Math.min(width, x0 + step);

      let maxLum = -1;
      let bestR = 225;
      let bestG = 225;
      let bestB = 225;

      // Sample every 2nd pixel inside the cell for speed
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const idx = (y * width + x) * 4;
          const r = rgba[idx];
          const g = rgba[idx + 1];
          const b = rgba[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > maxLum) {
            maxLum = lum;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }
      }

      // Clamp floor so large dark photo regions don't explode when divided
      const cellIdx = gy * gridW + gx;
      rawR[cellIdx] = Math.max(115, bestR);
      rawG[cellIdx] = Math.max(115, bestG);
      rawB[cellIdx] = Math.max(115, bestB);
    }
  }

  // 3x3 morphological dilation followed by 2 passes of 3x3 box blur on the low-res grid
  const dilateAndSmooth = (src: Float32Array): Float32Array => {
    const dilated = new Float32Array(totalCells);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let m = src[y * gridW + x];
        for (let dy = -1; dy <= 1; dy++) {
          const yy = Math.min(gridH - 1, Math.max(0, y + dy));
          for (let dx = -1; dx <= 1; dx++) {
            const xx = Math.min(gridW - 1, Math.max(0, x + dx));
            const v = src[yy * gridW + xx];
            if (v > m) m = v;
          }
        }
        dilated[y * gridW + x] = m;
      }
    }

    let curr = dilated;
    for (let pass = 0; pass < 2; pass++) {
      const next = new Float32Array(totalCells);
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const yy = Math.min(gridH - 1, Math.max(0, y + dy));
            for (let dx = -1; dx <= 1; dx++) {
              const xx = Math.min(gridW - 1, Math.max(0, x + dx));
              sum += curr[yy * gridW + xx];
              count++;
            }
          }
          next[y * gridW + x] = sum / count;
        }
      }
      curr = next;
    }
    return curr;
  };

  return {
    bgR: dilateAndSmooth(rawR),
    bgG: dilateAndSmooth(rawG),
    bgB: dilateAndSmooth(rawB),
    gridW,
    gridH
  };
}

/**
 * Bilinearly samples the low-res illumination grid at full-res pixel (x, y).
 */
function sampleBackgroundGrid(
  grid: Float32Array,
  gridW: number,
  gridH: number,
  gxFloat: number,
  gyFloat: number
): number {
  const x0 = Math.max(0, Math.min(gridW - 1, Math.floor(gxFloat)));
  const y0 = Math.max(0, Math.min(gridH - 1, Math.floor(gyFloat)));
  const x1 = Math.min(gridW - 1, x0 + 1);
  const y1 = Math.min(gridH - 1, y0 + 1);

  const fx = gxFloat - x0;
  const fy = gyFloat - y0;
  const ifx = 1 - fx;
  const ify = 1 - fy;

  return (
    grid[y0 * gridW + x0] * ifx * ify +
    grid[y0 * gridW + x1] * fx * ify +
    grid[y1 * gridW + x0] * ifx * fy +
    grid[y1 * gridW + x1] * fx * fy
  );
}

/**
 * Applies one of the 5 studio-grade scan filters + user brightness/contrast adjustments
 * onto a perspective-warped RGBA buffer.
 */
export function applyScanFilterRaw(
  srcRgba: Uint8ClampedArray,
  width: number,
  height: number,
  options: ScanFilterOptions
): Uint8ClampedArray {
  const { filter, brightness, contrast } = options;
  const out = new Uint8ClampedArray(srcRgba.length);

  const brightnessOffset = (brightness / 100) * 130;
  const contrastFactor =
    (259 * (contrast * 1.8 + 255)) / (255 * (259 - contrast * 1.8));

  // 1. ORIGINAL FLAT FILTER
  if (filter === "original") {
    for (let i = 0; i < srcRgba.length; i += 4) {
      let r = srcRgba[i] + brightnessOffset;
      let g = srcRgba[i + 1] + brightnessOffset;
      let b = srcRgba[i + 2] + brightnessOffset;

      if (contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      out[i] = clampByte(r);
      out[i + 1] = clampByte(g);
      out[i + 2] = clampByte(b);
      out[i + 3] = 255;
    }
    return out;
  }

  // 2. CRISP B&W SCAN (Bradley / Sauvola O(1) Integral Image Adaptive Thresholding)
  if (filter === "bw") {
    const totalPixels = width * height;
    const lum = new Float32Array(totalPixels);
    const integral = new Float64Array((width + 1) * (height + 1));

    for (let y = 0; y < height; y++) {
      let rowSum = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const l =
          0.299 * srcRgba[idx] +
          0.587 * srcRgba[idx + 1] +
          0.114 * srcRgba[idx + 2];
        lum[y * width + x] = l;
        rowSum += l;
        integral[(y + 1) * (width + 1) + (x + 1)] =
          integral[y * (width + 1) + (x + 1)] + rowSum;
      }
    }

    const radius = Math.max(8, Math.round(Math.min(width, height) / 22));
    // Sensitivity tuned by brightness slider (-50..+50)
    const thresholdBias = 14 - (brightness / 50) * 8;
    const sharpness = 1.65 + (contrast / 50) * 0.65;

    for (let y = 0; y < height; y++) {
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(height - 1, y + radius);
      for (let x = 0; x < width; x++) {
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(width - 1, x + radius);

        const count = (x1 - x0 + 1) * (y1 - y0 + 1);
        const sum =
          integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
          integral[y0 * (width + 1) + (x1 + 1)] -
          integral[(y1 + 1) * (width + 1) + x0] +
          integral[y0 * (width + 1) + x0];

        const localMean = sum / count;
        const pixelLum = lum[y * width + x];
        const cutoff = localMean - thresholdBias;
        const idx = (y * width + x) * 4;

        if (pixelLum >= cutoff || pixelLum >= 238) {
          out[idx] = 255;
          out[idx + 1] = 255;
          out[idx + 2] = 255;
          out[idx + 3] = 255;
        } else {
          // Smooth anti-aliased dark ink edge
          const darkness = Math.min(
            1,
            Math.pow((cutoff - pixelLum) / Math.max(14, cutoff * 0.52), 1 / sharpness) * 1.15
          );
          const v = clampByte(255 * (1 - darkness * 0.96));
          out[idx] = v;
          out[idx + 1] = v;
          out[idx + 2] = v;
          out[idx + 3] = 255;
        }
      }
    }
    return out;
  }

  // For "magic", "lighten", and "grayscale", compute the uneven illumination background map
  const { bgR, bgG, bgB, gridW, gridH } = estimateBackgroundSurface(
    srcRgba,
    width,
    height
  );

  for (let y = 0; y < height; y++) {
    const gyFloat = (y / Math.max(1, height - 1)) * (gridH - 1);
    for (let x = 0; x < width; x++) {
      const gxFloat = (x / Math.max(1, width - 1)) * (gridW - 1);
      const idx = (y * width + x) * 4;

      const r0 = srcRgba[idx];
      const g0 = srcRgba[idx + 1];
      const b0 = srcRgba[idx + 2];

      const bgr = sampleBackgroundGrid(bgR, gridW, gridH, gxFloat, gyFloat);
      const bgg = sampleBackgroundGrid(bgG, gridW, gridH, gxFloat, gyFloat);
      const bgb = sampleBackgroundGrid(bgB, gridW, gridH, gxFloat, gyFloat);

      // Divide pixel by local illumination surface to remove shadows & yellow bulb cast
      let nr = Math.min(255, (r0 / Math.max(60, bgr)) * 255);
      let ng = Math.min(255, (g0 / Math.max(60, bgg)) * 255);
      let nb = Math.min(255, (b0 / Math.max(60, bgb)) * 255);

      if (filter === "magic") {
        // Magic Color: S-curve contrast + white-paper bleach + chroma preservation for stamps/signatures
        const lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;

        // S-curve: push bright paper (>212) to pure 255 white, deepen dark text (<145)
        let targetLum = lum;
        if (lum > 212) {
          targetLum = 212 + (lum - 212) * 1.35;
        } else if (lum < 155) {
          targetLum = lum * 0.78;
        } else {
          targetLum = 155 * 0.78 + ((lum - 155) / (212 - 155)) * (212 - 155 * 0.78);
        }

        // Preserve and boost color saturation on stamps, logos, and blue pen ink
        const satBoost = 1.24;
        nr = targetLum + (nr - lum) * satBoost;
        ng = targetLum + (ng - lum) * satBoost;
        nb = targetLum + (nb - lum) * satBoost;
      } else if (filter === "lighten") {
        // Shadow Remover: blend 70% illumination-normalized with 30% original + gentle gamma lift
        nr = nr * 0.72 + r0 * 0.28;
        ng = ng * 0.72 + g0 * 0.28;
        nb = nb * 0.72 + b0 * 0.28;
        nr = 255 * Math.pow(Math.max(0, nr) / 255, 0.86);
        ng = 255 * Math.pow(Math.max(0, ng) / 255, 0.86);
        nb = 255 * Math.pow(Math.max(0, nb) / 255, 0.86);
      } else if (filter === "grayscale") {
        // Clean Grayscale: high-contrast luminance with pure white paper lift
        let lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
        if (lum > 210) {
          lum = Math.min(255, 210 + (lum - 210) * 1.35);
        } else if (lum < 140) {
          lum *= 0.82;
        }
        nr = lum;
        ng = lum;
        nb = lum;
      }

      // Apply user brightness & contrast fine-tuning
      nr += brightnessOffset;
      ng += brightnessOffset;
      nb += brightnessOffset;

      if (contrast !== 0) {
        nr = contrastFactor * (nr - 128) + 128;
        ng = contrastFactor * (ng - 128) + 128;
        nb = contrastFactor * (nb - 128) + 128;
      }

      out[idx] = clampByte(nr);
      out[idx + 1] = clampByte(ng);
      out[idx + 2] = clampByte(nb);
      out[idx + 3] = 255;
    }
  }

  return out;
}
