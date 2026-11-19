import { QuadCorners } from "./edgeDetector";

export type ScanAspectPreset =
  | "auto"
  | "a4-portrait"
  | "a4-landscape"
  | "id-card";

export interface WarpOutputDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Computes the output pixel width & height from the 4 normalized quad corners
 * in source pixel space using Euclidean opposite-edge averages, with optional
 * preset override (Auto, A4 Portrait, A4 Landscape, ID Card 85.6x54mm).
 */
export function computeNaturalWarpDimensions(
  quad: QuadCorners,
  srcWidth: number,
  srcHeight: number,
  aspectPreset: ScanAspectPreset = "auto",
  maxOutputEdgePx = 1800
): WarpOutputDimensions {
  const [tl, tr, br, bl] = quad.map((pt) => ({
    x: pt.x * srcWidth,
    y: pt.y * srcHeight
  }));

  const topWidth = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const bottomWidth = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftHeight = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightHeight = Math.hypot(br.x - tr.x, br.y - tr.y);

  let naturalW = Math.max(64, (topWidth + bottomWidth) * 0.5);
  let naturalH = Math.max(64, (leftHeight + rightHeight) * 0.5);

  if (aspectPreset === "a4-portrait") {
    // A4 Portrait: 1 : sqrt(2) (width : height = 1 : 1.4142)
    const baseW = Math.max(naturalW, naturalH / 1.4142);
    naturalW = baseW;
    naturalH = baseW * 1.4142;
  } else if (aspectPreset === "a4-landscape") {
    // A4 Landscape: sqrt(2) : 1
    const baseH = Math.max(naturalH, naturalW / 1.4142);
    naturalH = baseH;
    naturalW = baseH * 1.4142;
  } else if (aspectPreset === "id-card") {
    // ISO/IEC 7810 ID-1 (Aadhaar / PAN / Voter ID / Driving Licence): 85.60mm x 53.98mm = 1.5858 : 1
    const idRatio = 85.6 / 54.0;
    const baseW = Math.max(naturalW, naturalH * idRatio);
    naturalW = baseW;
    naturalH = baseW / idRatio;
  }

  const maxEdge = Math.max(naturalW, naturalH);
  const scale = maxEdge > maxOutputEdgePx ? maxOutputEdgePx / maxEdge : 1;

  const width = Math.max(64, Math.round(naturalW * scale));
  const height = Math.max(64, Math.round(naturalH * scale));

  return {
    width,
    height,
    aspectRatio: Number((width / height).toFixed(4))
  };
}

/**
 * Solves an 8x8 linear system A * h = b via Gaussian elimination with partial pivoting
 * to find the 3x3 inverse projective homography matrix H = [h0, h1, h2; h3, h4, h5; h6, h7, 1]
 * that maps destination pixel (u, v) in [0..dstW-1, 0..dstH-1] to source pixel (x, y).
 */
export function solveInverseHomographyMatrix(
  dstWidth: number,
  dstHeight: number,
  srcQuadPx: { x: number; y: number }[]
): Float64Array {
  const dstCorners = [
    { u: 0, v: 0 },
    { u: dstWidth - 1, v: 0 },
    { u: dstWidth - 1, v: dstHeight - 1 },
    { u: 0, v: dstHeight - 1 }
  ];

  // 8x9 augmented matrix [A | b]
  const M: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { u, v } = dstCorners[i];
    const { x, y } = srcQuadPx[i];

    // x = (h0*u + h1*v + h2) / (h6*u + h7*v + 1)
    // => h0*u + h1*v + h2 - h6*u*x - h7*v*x = x
    M.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);

    // y = (h3*u + h4*v + h5) / (h6*u + h7*v + 1)
    // => h3*u + h4*v + h5 - h6*u*y - h7*v*y = y
    M.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }

  const n = 8;
  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = row;
      }
    }

    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-11) {
      continue;
    }

    // Normalize pivot row
    for (let j = col; j <= n; j++) {
      M[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  const H = new Float64Array(9);
  for (let i = 0; i < 8; i++) {
    H[i] = M[i][8];
  }
  H[8] = 1.0;
  return H;
}

/**
 * Performs an exact 4-point projective perspective warp with bilinear pixel interpolation.
 * Pure TypeScript / Uint8ClampedArray implementation safe for both Web Worker and Main Thread.
 */
export function warpPerspectiveRaw(
  srcRgba: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  quad: QuadCorners,
  aspectPreset: ScanAspectPreset = "auto",
  maxOutputEdgePx = 1800
): { data: Uint8ClampedArray; width: number; height: number } {
  const { width: dstW, height: dstH } = computeNaturalWarpDimensions(
    quad,
    srcWidth,
    srcHeight,
    aspectPreset,
    maxOutputEdgePx
  );

  const srcQuadPx = quad.map((pt) => ({
    x: pt.x * (srcWidth - 1),
    y: pt.y * (srcHeight - 1)
  }));

  const H = solveInverseHomographyMatrix(dstW, dstH, srcQuadPx);
  const h0 = H[0],
    h1 = H[1],
    h2 = H[2],
    h3 = H[3],
    h4 = H[4],
    h5 = H[5],
    h6 = H[6],
    h7 = H[7];

  const dstRgba = new Uint8ClampedArray(dstW * dstH * 4);
  const maxSrcX = srcWidth - 1;
  const maxSrcY = srcHeight - 1;

  for (let v = 0; v < dstH; v++) {
    const h1v_h2 = h1 * v + h2;
    const h4v_h5 = h4 * v + h5;
    const h7v_1 = h7 * v + 1.0;
    const rowOffset = v * dstW;

    for (let u = 0; u < dstW; u++) {
      const wDenom = h6 * u + h7v_1;
      const invW = wDenom !== 0 ? 1.0 / wDenom : 1.0;
      const sx = (h0 * u + h1v_h2) * invW;
      const sy = (h3 * u + h4v_h5) * invW;

      const dstIdx = (rowOffset + u) * 4;

      // Clamp to source bounds
      const clampedX = sx < 0 ? 0 : sx > maxSrcX ? maxSrcX : sx;
      const clampedY = sy < 0 ? 0 : sy > maxSrcY ? maxSrcY : sy;

      const x0 = Math.floor(clampedX);
      const y0 = Math.floor(clampedY);
      const x1 = x0 < maxSrcX ? x0 + 1 : x0;
      const y1 = y0 < maxSrcY ? y0 + 1 : y0;

      const fx = clampedX - x0;
      const fy = clampedY - y0;
      const ifx = 1.0 - fx;
      const ify = 1.0 - fy;

      const w00 = ifx * ify;
      const w10 = fx * ify;
      const w01 = ifx * fy;
      const w11 = fx * fy;

      const idx00 = (y0 * srcWidth + x0) * 4;
      const idx10 = (y0 * srcWidth + x1) * 4;
      const idx01 = (y1 * srcWidth + x0) * 4;
      const idx11 = (y1 * srcWidth + x1) * 4;

      dstRgba[dstIdx] =
        srcRgba[idx00] * w00 +
        srcRgba[idx10] * w10 +
        srcRgba[idx01] * w01 +
        srcRgba[idx11] * w11;

      dstRgba[dstIdx + 1] =
        srcRgba[idx00 + 1] * w00 +
        srcRgba[idx10 + 1] * w10 +
        srcRgba[idx01 + 1] * w01 +
        srcRgba[idx11 + 1] * w11;

      dstRgba[dstIdx + 2] =
        srcRgba[idx00 + 2] * w00 +
        srcRgba[idx10 + 2] * w10 +
        srcRgba[idx01 + 2] * w01 +
        srcRgba[idx11 + 2] * w11;

      dstRgba[dstIdx + 3] = 255;
    }
  }

  return { data: dstRgba, width: dstW, height: dstH };
}
