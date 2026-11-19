import {
  detectDocumentEdges,
  QuadCorners,
  DEFAULT_INSET_QUAD
} from "./edgeDetector";
import {
  warpPerspectiveRaw,
  ScanAspectPreset
} from "./perspectiveWarp";
import {
  applyScanFilterRaw,
  ScanFilterOptions
} from "./scanFilters";
import type {
  ScannerWorkerRequest,
  ScannerWorkerResponse
} from "./scanner.worker";

let sharedWorker: Worker | null = null;
let workerFailed = false;
let nextReqId = 1;
const pendingCallbacks = new Map<
  number,
  {
    resolve: (res: ScannerWorkerResponse) => void;
    reject: (err: Error) => void;
  }
>();

function getOrInitScannerWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined" || workerFailed) {
    return null;
  }
  if (sharedWorker) {
    return sharedWorker;
  }

  try {
    const w = new Worker(new URL("./scanner.worker.ts", import.meta.url));
    w.onmessage = (event: MessageEvent<ScannerWorkerResponse>) => {
      const res = event.data;
      if (!res || typeof res.id !== "number") return;
      const pending = pendingCallbacks.get(res.id);
      if (!pending) return;
      pendingCallbacks.delete(res.id);

      if (res.type === "ERROR") {
        pending.reject(new Error(res.message));
      } else {
        pending.resolve(res);
      }
    };
    w.onerror = () => {
      workerFailed = true;
      sharedWorker = null;
      pendingCallbacks.forEach((cb) => cb.reject(new Error("Worker runtime error")));
      pendingCallbacks.clear();
    };
    sharedWorker = w;
    return sharedWorker;
  } catch {
    workerFailed = true;
    return null;
  }
}

/**
 * Runs Auto-Edge Detection in Web Worker with Main-Thread Fallback.
 */
export async function runAutoEdgeDetection(
  imageData: ImageData
): Promise<QuadCorners> {
  const worker = getOrInitScannerWorker();
  if (worker) {
    try {
      const id = nextReqId++;
      const copy = new Uint8ClampedArray(imageData.data);
      const res = await new Promise<ScannerWorkerResponse>((resolve, reject) => {
        pendingCallbacks.set(id, { resolve, reject });
        worker.postMessage(
          {
            id,
            type: "DETECT_EDGES",
            rgba: copy,
            width: imageData.width,
            height: imageData.height
          } satisfies ScannerWorkerRequest,
          [copy.buffer]
        );
      });
      if (res.type === "DETECT_EDGES_RESULT") {
        return res.quad;
      }
    } catch {
      // Fallback to main thread below
    }
  }

  try {
    return detectDocumentEdges(imageData.data, imageData.width, imageData.height);
  } catch {
    return [
      { ...DEFAULT_INSET_QUAD[0] },
      { ...DEFAULT_INSET_QUAD[1] },
      { ...DEFAULT_INSET_QUAD[2] },
      { ...DEFAULT_INSET_QUAD[3] }
    ];
  }
}

/**
 * Runs Perspective Homography Warp + Studio Scan Filter in Web Worker with Main-Thread Fallback.
 */
export async function runWarpAndFilter(
  sourceImageData: ImageData,
  quad: QuadCorners,
  aspectPreset: ScanAspectPreset,
  filterOptions: ScanFilterOptions,
  maxOutputEdgePx = 1750
): Promise<{
  warpedImageData: ImageData;
  filteredImageData: ImageData;
}> {
  const worker = getOrInitScannerWorker();
  if (worker) {
    try {
      const id = nextReqId++;
      const copy = new Uint8ClampedArray(sourceImageData.data);
      const res = await new Promise<ScannerWorkerResponse>((resolve, reject) => {
        pendingCallbacks.set(id, { resolve, reject });
        worker.postMessage(
          {
            id,
            type: "WARP_AND_FILTER",
            rgba: copy,
            width: sourceImageData.width,
            height: sourceImageData.height,
            quad,
            aspectPreset,
            maxOutputEdgePx,
            filterOptions
          } satisfies ScannerWorkerRequest,
          [copy.buffer]
        );
      });

      if (res.type === "WARP_AND_FILTER_RESULT") {
        const warpedCopy = new Uint8ClampedArray(res.warpedRgba.length);
        warpedCopy.set(res.warpedRgba);
        const filteredCopy = new Uint8ClampedArray(res.filteredRgba.length);
        filteredCopy.set(res.filteredRgba);
        return {
          warpedImageData: new ImageData(warpedCopy, res.width, res.height),
          filteredImageData: new ImageData(filteredCopy, res.width, res.height)
        };
      }
    } catch {
      // Fallback to main thread below
    }
  }

  const warped = warpPerspectiveRaw(
    sourceImageData.data,
    sourceImageData.width,
    sourceImageData.height,
    quad,
    aspectPreset,
    maxOutputEdgePx
  );
  const filtered = applyScanFilterRaw(
    warped.data,
    warped.width,
    warped.height,
    filterOptions
  );

  const warpedArr = new Uint8ClampedArray(warped.data.length);
  warpedArr.set(warped.data);
  const filteredArr = new Uint8ClampedArray(filtered.length);
  filteredArr.set(filtered);

  return {
    warpedImageData: new ImageData(warpedArr, warped.width, warped.height),
    filteredImageData: new ImageData(filteredArr, warped.width, warped.height)
  };
}

/**
 * Re-applies only the Studio Scan Filter on an already-warped ImageData buffer (instant <15ms filter switch).
 */
export async function runScanFilterOnly(
  warpedImageData: ImageData,
  filterOptions: ScanFilterOptions
): Promise<ImageData> {
  const worker = getOrInitScannerWorker();
  if (worker) {
    try {
      const id = nextReqId++;
      const copy = new Uint8ClampedArray(warpedImageData.data);
      const res = await new Promise<ScannerWorkerResponse>((resolve, reject) => {
        pendingCallbacks.set(id, { resolve, reject });
        worker.postMessage(
          {
            id,
            type: "APPLY_FILTER",
            warpedRgba: copy,
            width: warpedImageData.width,
            height: warpedImageData.height,
            filterOptions
          } satisfies ScannerWorkerRequest,
          [copy.buffer]
        );
      });

      if (res.type === "APPLY_FILTER_RESULT") {
        const filteredCopy = new Uint8ClampedArray(res.filteredRgba.length);
        filteredCopy.set(res.filteredRgba);
        return new ImageData(filteredCopy, res.width, res.height);
      }
    } catch {
      // Fallback to main thread below
    }
  }

  const filtered = applyScanFilterRaw(
    warpedImageData.data,
    warpedImageData.width,
    warpedImageData.height,
    filterOptions
  );
  const filteredArr = new Uint8ClampedArray(filtered.length);
  filteredArr.set(filtered);
  return new ImageData(filteredArr, warpedImageData.width, warpedImageData.height);
}
