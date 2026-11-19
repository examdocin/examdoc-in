export interface NormalizedPoint {
  x: number; // 0..1
  y: number; // 0..1
}

export type QuadCorners = [
  NormalizedPoint, // Top-Left (TL)
  NormalizedPoint, // Top-Right (TR)
  NormalizedPoint, // Bottom-Right (BR)
  NormalizedPoint  // Bottom-Left (BL)
];

export const DEFAULT_INSET_QUAD: QuadCorners = [
  { x: 0.07, y: 0.07 },
  { x: 0.93, y: 0.07 },
  { x: 0.93, y: 0.93 },
  { x: 0.07, y: 0.93 }
];

export const FULL_IMAGE_QUAD: QuadCorners = [
  { x: 0.01, y: 0.01 },
  { x: 0.99, y: 0.01 },
  { x: 0.99, y: 0.99 },
  { x: 0.01, y: 0.99 }
];

function clamp01(val: number): number {
  return val < 0.01 ? 0.01 : val > 0.99 ? 0.99 : Number(val.toFixed(4));
}

/**
 * Rotates normalized quad corners 90 degrees clockwise: (x, y) -> (1 - y, x)
 */
export function rotateQuadCorners90(quad: QuadCorners): QuadCorners {
  const rotated = quad.map((pt) => ({
    x: clamp01(1 - pt.y),
    y: clamp01(pt.x)
  }));
  return orderQuadClockwise(rotated);
}

/**
 * Orders 4 points strictly clockwise: Top-Left (TL), Top-Right (TR), Bottom-Right (BR), Bottom-Left (BL).
 */
export function orderQuadClockwise(points: NormalizedPoint[]): QuadCorners {
  if (points.length !== 4) {
    return [
      { ...DEFAULT_INSET_QUAD[0] },
      { ...DEFAULT_INSET_QUAD[1] },
      { ...DEFAULT_INSET_QUAD[2] },
      { ...DEFAULT_INSET_QUAD[3] }
    ];
  }

  // Sort by sum (x + y): smallest is TL, largest is BR
  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const tl = bySum[0];
  const br = bySum[3];

  // Remaining 2 points: sort by diff (y - x): smallest is TR, largest is BL
  const rem = [bySum[1], bySum[2]].sort((a, b) => a.y - a.x - (b.y - b.x));
  const tr = rem[0];
  const bl = rem[1];

  return [
    { x: clamp01(tl.x), y: clamp01(tl.y) },
    { x: clamp01(tr.x), y: clamp01(tr.y) },
    { x: clamp01(br.x), y: clamp01(br.y) },
    { x: clamp01(bl.x), y: clamp01(bl.y) }
  ];
}

/**
 * Verifies whether a clockwise-ordered quad is strictly convex and covers a reasonable area.
 */
export function isValidConvexQuad(quad: QuadCorners): boolean {
  const [tl, tr, br, bl] = quad;
  const pts = [tl, tr, br, bl];

  // Check cross products of consecutive edges (must all have positive z in screen coordinates)
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    const cross = abx * bcy - aby * bcx;
    if (cross <= 0.002) {
      return false;
    }
  }

  // Compute shoelace area in normalized space (0..1)
  const area =
    0.5 *
    Math.abs(
      tl.x * tr.y -
        tr.x * tl.y +
        (tr.x * br.y - br.x * tr.y) +
        (br.x * bl.y - bl.x * br.y) +
        (bl.x * tl.y - tl.x * bl.y)
    );

  // Reject quads smaller than 12% of the frame or larger than 98%
  if (area < 0.12 || area > 0.97) {
    return false;
  }

  // Ensure minimum edge length (18% of frame)
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist < 0.18) {
      return false;
    }
  }

  return true;
}

/**
 * Pure TypeScript Auto-Edge Document Detector:
 * 1. Downscales RGBA buffer to max 320px width.
 * 2. Computes perceptual Grayscale + 3x3 Gaussian Blur.
 * 3. Computes Sobel gradient magnitude (Gx, Gy) + Non-Maxima Suppression (NMS).
 * 4. Performs boundary ray-casting from all 4 sides + RANSAC line fitting & quad perimeter scoring.
 * 5. Returns clockwise [TL, TR, BR, BL] normalized coordinates, or DEFAULT_INSET_QUAD fallback.
 */
export function detectDocumentEdges(
  rgbaData: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number
): QuadCorners {
  if (srcWidth < 32 || srcHeight < 32) {
    return [
      { ...DEFAULT_INSET_QUAD[0] },
      { ...DEFAULT_INSET_QUAD[1] },
      { ...DEFAULT_INSET_QUAD[2] },
      { ...DEFAULT_INSET_QUAD[3] }
    ];
  }

  const maxDim = 320;
  const scale = Math.min(1, maxDim / Math.max(srcWidth, srcHeight));
  const w = Math.max(48, Math.round(srcWidth * scale));
  const h = Math.max(48, Math.round(srcHeight * scale));

  // Step 1: Downscale & convert to grayscale
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(srcHeight - 1, Math.floor(y / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(srcWidth - 1, Math.floor(x / scale));
      const idx = (sy * srcWidth + sx) * 4;
      gray[y * w + x] =
        0.299 * rgbaData[idx] +
        0.587 * rgbaData[idx + 1] +
        0.114 * rgbaData[idx + 2];
    }
  }

  // Step 2: 3x3 Gaussian Blur [1, 2, 1; 2, 4, 2; 1, 2, 1] / 16
  const blurred = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const sum =
        gray[(y - 1) * w + (x - 1)] +
        2 * gray[(y - 1) * w + x] +
        gray[(y - 1) * w + (x + 1)] +
        2 * gray[y * w + (x - 1)] +
        4 * gray[y * w + x] +
        2 * gray[y * w + (x + 1)] +
        gray[(y + 1) * w + (x - 1)] +
        2 * gray[(y + 1) * w + x] +
        gray[(y + 1) * w + (x + 1)];
      blurred[y * w + x] = sum * 0.0625;
    }
  }

  // Step 3: Sobel Gradient Magnitude + Direction + Non-Maxima Suppression
  const mag = new Float32Array(w * h);
  const gxArr = new Float32Array(w * h);
  const gyArr = new Float32Array(w * h);
  let maxMag = 1;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -blurred[(y - 1) * w + (x - 1)] +
        blurred[(y - 1) * w + (x + 1)] -
        2 * blurred[y * w + (x - 1)] +
        2 * blurred[y * w + (x + 1)] -
        blurred[(y + 1) * w + (x - 1)] +
        blurred[(y + 1) * w + (x + 1)];

      const gy =
        -blurred[(y - 1) * w + (x - 1)] -
        2 * blurred[(y - 1) * w + x] -
        blurred[(y - 1) * w + (x + 1)] +
        blurred[(y + 1) * w + (x - 1)] +
        2 * blurred[(y + 1) * w + x] +
        blurred[(y + 1) * w + (x + 1)];

      const m = Math.hypot(gx, gy);
      const pos = y * w + x;
      mag[pos] = m;
      gxArr[pos] = gx;
      gyArr[pos] = gy;
      if (m > maxMag) maxMag = m;
    }
  }

  // Non-maxima suppression
  const nms = new Float32Array(w * h);
  let meanNms = 0;
  let nmsCount = 0;

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const pos = y * w + x;
      const m = mag[pos];
      if (m < maxMag * 0.08) continue;

      const ax = Math.abs(gxArr[pos]);
      const ay = Math.abs(gyArr[pos]);

      let n1 = 0;
      let n2 = 0;
      if (ax > ay * 1.5) {
        // Horizontal gradient -> vertical edge
        n1 = mag[pos - 1];
        n2 = mag[pos + 1];
      } else if (ay > ax * 1.5) {
        // Vertical gradient -> horizontal edge
        n1 = mag[pos - w];
        n2 = mag[pos + w];
      } else if (gxArr[pos] * gyArr[pos] > 0) {
        n1 = mag[pos - w - 1];
        n2 = mag[pos + w + 1];
      } else {
        n1 = mag[pos - w + 1];
        n2 = mag[pos + w - 1];
      }

      if (m >= n1 && m >= n2) {
        nms[pos] = m;
        meanNms += m;
        nmsCount++;
      }
    }
  }

  const edgeThreshold =
    nmsCount > 0 ? Math.max(maxMag * 0.14, (meanNms / nmsCount) * 1.15) : maxMag * 0.25;

  // Step 4: Boundary Ray-Casting from 4 sides (Top, Bottom, Left, Right)
  const marginX = Math.max(2, Math.round(w * 0.025));
  const marginY = Math.max(2, Math.round(h * 0.025));
  const maxScanDepthY = Math.round(h * 0.44);
  const maxScanDepthX = Math.round(w * 0.44);

  const topPoints: { x: number; y: number }[] = [];
  const bottomPoints: { x: number; y: number }[] = [];
  const leftPoints: { x: number; y: number }[] = [];
  const rightPoints: { x: number; y: number }[] = [];

  const numRays = 24;

  // Cast rays from top and bottom across middle 76% of width
  for (let i = 0; i < numRays; i++) {
    const t = 0.12 + (0.76 * i) / (numRays - 1);
    const x = Math.round(t * (w - 1));

    // Top downward ray
    for (let y = marginY; y < maxScanDepthY; y++) {
      if (nms[y * w + x] >= edgeThreshold || mag[y * w + x] >= edgeThreshold * 1.15) {
        topPoints.push({ x, y });
        break;
      }
    }

    // Bottom upward ray
    for (let y = h - 1 - marginY; y > h - 1 - maxScanDepthY; y--) {
      if (nms[y * w + x] >= edgeThreshold || mag[y * w + x] >= edgeThreshold * 1.15) {
        bottomPoints.push({ x, y });
        break;
      }
    }
  }

  // Cast rays from left and right across middle 76% of height
  for (let i = 0; i < numRays; i++) {
    const t = 0.12 + (0.76 * i) / (numRays - 1);
    const y = Math.round(t * (h - 1));

    // Left rightward ray
    for (let x = marginX; x < maxScanDepthX; x++) {
      if (nms[y * w + x] >= edgeThreshold || mag[y * w + x] >= edgeThreshold * 1.15) {
        leftPoints.push({ x, y });
        break;
      }
    }

    // Right leftward ray
    for (let x = w - 1 - marginX; x > w - 1 - maxScanDepthX; x--) {
      if (nms[y * w + x] >= edgeThreshold || mag[y * w + x] >= edgeThreshold * 1.15) {
        rightPoints.push({ x, y });
        break;
      }
    }
  }

  // Fit robust 2D lines using RANSAC / median slope-intercept for each side
  if (
    topPoints.length >= 5 &&
    bottomPoints.length >= 5 &&
    leftPoints.length >= 5 &&
    rightPoints.length >= 5
  ) {
    const topLine = fitHorizontalLineRansac(topPoints, h * 0.025);
    const bottomLine = fitHorizontalLineRansac(bottomPoints, h * 0.025);
    const leftLine = fitVerticalLineRansac(leftPoints, w * 0.025);
    const rightLine = fitVerticalLineRansac(rightPoints, w * 0.025);

    const tl = intersectHV(topLine, leftLine, w, h);
    const tr = intersectHV(topLine, rightLine, w, h);
    const br = intersectHV(bottomLine, rightLine, w, h);
    const bl = intersectHV(bottomLine, leftLine, w, h);

    if (tl && tr && br && bl) {
      const candidateQuad = orderQuadClockwise([tl, tr, br, bl]);
      if (isValidConvexQuad(candidateQuad)) {
        const edgeScore = scoreQuadPerimeter(candidateQuad, mag, w, h, maxMag);
        if (edgeScore > 0.12) {
          return candidateQuad;
        }
      }
    }
  }

  // Fallback Step 5: Contrast bounding box around bright document interior vs background
  const luminanceBoxQuad = detectDocumentByLuminanceContrast(blurred, mag, w, h, maxMag);
  if (luminanceBoxQuad && isValidConvexQuad(luminanceBoxQuad)) {
    return luminanceBoxQuad;
  }

  return [
    { ...DEFAULT_INSET_QUAD[0] },
    { ...DEFAULT_INSET_QUAD[1] },
    { ...DEFAULT_INSET_QUAD[2] },
    { ...DEFAULT_INSET_QUAD[3] }
  ];
}

interface LineModel {
  // For horizontal: y = m * x + b
  // For vertical:   x = m * y + b
  m: number;
  b: number;
}

function fitHorizontalLineRansac(
  pts: { x: number; y: number }[],
  inlierTolerance: number
): LineModel {
  let bestInliers = -1;
  let bestM = 0;
  let bestB = pts[Math.floor(pts.length / 2)].y;

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      const p1 = pts[i];
      const p2 = pts[j];
      const dx = p2.x - p1.x;
      if (Math.abs(dx) < 4) continue;
      const m = (p2.y - p1.y) / dx;
      // Reject steep angles > 35 degrees for top/bottom edge
      if (Math.abs(m) > 0.7) continue;
      const b = p1.y - m * p1.x;

      let inliers = 0;
      for (let k = 0; k < n; k++) {
        const err = Math.abs(pts[k].y - (m * pts[k].x + b));
        if (err <= inlierTolerance) {
          inliers++;
        }
      }
      if (inliers > bestInliers) {
        bestInliers = inliers;
        bestM = m;
        bestB = b;
      }
    }
  }

  return { m: bestM, b: bestB };
}

function fitVerticalLineRansac(
  pts: { x: number; y: number }[],
  inlierTolerance: number
): LineModel {
  let bestInliers = -1;
  let bestM = 0;
  let bestB = pts[Math.floor(pts.length / 2)].x;

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      const p1 = pts[i];
      const p2 = pts[j];
      const dy = p2.y - p1.y;
      if (Math.abs(dy) < 4) continue;
      const m = (p2.x - p1.x) / dy;
      if (Math.abs(m) > 0.7) continue;
      const b = p1.x - m * p1.y;

      let inliers = 0;
      for (let k = 0; k < n; k++) {
        const err = Math.abs(pts[k].x - (m * pts[k].y + b));
        if (err <= inlierTolerance) {
          inliers++;
        }
      }
      if (inliers > bestInliers) {
        bestInliers = inliers;
        bestM = m;
        bestB = b;
      }
    }
  }

  return { m: bestM, b: bestB };
}

function intersectHV(
  hLine: LineModel,
  vLine: LineModel,
  w: number,
  h: number
): NormalizedPoint | null {
  // y = mh * x + bh
  // x = mv * y + bv  =>  x = mv * (mh * x + bh) + bv  =>  x * (1 - mv * mh) = mv * bh + bv
  const denom = 1 - vLine.m * hLine.m;
  if (Math.abs(denom) < 1e-5) return null;

  const x = (vLine.m * hLine.b + vLine.b) / denom;
  const y = hLine.m * x + hLine.b;

  const nx = x / (w - 1);
  const ny = y / (h - 1);
  if (nx < -0.05 || nx > 1.05 || ny < -0.05 || ny > 1.05) {
    return null;
  }

  return { x: clamp01(nx), y: clamp01(ny) };
}

function scoreQuadPerimeter(
  quad: QuadCorners,
  mag: Float32Array,
  w: number,
  h: number,
  maxMag: number
): number {
  const samplesPerEdge = 32;
  let totalScore = 0;
  let totalSamples = 0;

  for (let e = 0; e < 4; e++) {
    const p1 = quad[e];
    const p2 = quad[(e + 1) % 4];
    for (let s = 1; s < samplesPerEdge; s++) {
      const t = s / samplesPerEdge;
      const x = Math.round((p1.x + (p2.x - p1.x) * t) * (w - 1));
      const y = Math.round((p1.y + (p2.y - p1.y) * t) * (h - 1));

      // Check a 3x3 neighborhood around the perimeter sample
      let localMax = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const val = mag[yy * w + xx];
          if (val > localMax) localMax = val;
        }
      }
      totalScore += localMax / Math.max(1, maxMag);
      totalSamples++;
    }
  }

  return totalSamples > 0 ? totalScore / totalSamples : 0;
}

function detectDocumentByLuminanceContrast(
  blurred: Float32Array,
  mag: Float32Array,
  w: number,
  h: number,
  maxMag: number
): QuadCorners | null {
  // Sample center region vs outer border region luminance
  let centerSum = 0;
  let centerCount = 0;
  for (let y = Math.round(h * 0.3); y < Math.round(h * 0.7); y++) {
    for (let x = Math.round(w * 0.3); x < Math.round(w * 0.7); x++) {
      centerSum += blurred[y * w + x];
      centerCount++;
    }
  }
  const centerMean = centerCount > 0 ? centerSum / centerCount : 180;

  let borderSum = 0;
  let borderCount = 0;
  for (let x = 0; x < w; x++) {
    borderSum += blurred[x] + blurred[(h - 1) * w + x];
    borderCount += 2;
  }
  for (let y = 0; y < h; y++) {
    borderSum += blurred[y * w] + blurred[y * w + (w - 1)];
    borderCount += 2;
  }
  const borderMean = borderCount > 0 ? borderSum / borderCount : 100;

  if (Math.abs(centerMean - borderMean) < 18) {
    return null;
  }

  const midCutoff = (centerMean + borderMean) * 0.5;
  const isBrightDoc = centerMean > borderMean;

  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  let hitCount = 0;

  for (let y = Math.round(h * 0.03); y < Math.round(h * 0.97); y++) {
    for (let x = Math.round(w * 0.03); x < Math.round(w * 0.97); x++) {
      const val = blurred[y * w + x];
      const matches = isBrightDoc ? val >= midCutoff : val <= midCutoff;
      if (matches) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hitCount++;
      }
    }
  }

  if (hitCount < w * h * 0.15) {
    return null;
  }

  const candidate: QuadCorners = [
    { x: clamp01(minX / (w - 1)), y: clamp01(minY / (h - 1)) },
    { x: clamp01(maxX / (w - 1)), y: clamp01(minY / (h - 1)) },
    { x: clamp01(maxX / (w - 1)), y: clamp01(maxY / (h - 1)) },
    { x: clamp01(minX / (w - 1)), y: clamp01(maxY / (h - 1)) }
  ];

  const score = scoreQuadPerimeter(candidate, mag, w, h, maxMag);
  return score > 0.08 ? candidate : null;
}
