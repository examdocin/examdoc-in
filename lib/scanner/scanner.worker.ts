import {
  detectDocumentEdges,
  QuadCorners
} from "./edgeDetector";
import {
  warpPerspectiveRaw,
  ScanAspectPreset
} from "./perspectiveWarp";
import {
  applyScanFilterRaw,
  ScanFilterOptions
} from "./scanFilters";

export type ScannerWorkerRequest =
  | {
      id: number;
      type: "DETECT_EDGES";
      rgba: Uint8ClampedArray;
      width: number;
      height: number;
    }
  | {
      id: number;
      type: "WARP_AND_FILTER";
      rgba: Uint8ClampedArray;
      width: number;
      height: number;
      quad: QuadCorners;
      aspectPreset: ScanAspectPreset;
      maxOutputEdgePx: number;
      filterOptions: ScanFilterOptions;
    }
  | {
      id: number;
      type: "APPLY_FILTER";
      warpedRgba: Uint8ClampedArray;
      width: number;
      height: number;
      filterOptions: ScanFilterOptions;
    };

export type ScannerWorkerResponse =
  | {
      id: number;
      type: "DETECT_EDGES_RESULT";
      quad: QuadCorners;
    }
  | {
      id: number;
      type: "WARP_AND_FILTER_RESULT";
      warpedRgba: Uint8ClampedArray;
      filteredRgba: Uint8ClampedArray;
      width: number;
      height: number;
    }
  | {
      id: number;
      type: "APPLY_FILTER_RESULT";
      filteredRgba: Uint8ClampedArray;
      width: number;
      height: number;
    }
  | {
      id: number;
      type: "ERROR";
      message: string;
    };

const workerScope = self as unknown as {
  onmessage: ((e: MessageEvent<ScannerWorkerRequest>) => void) | null;
  postMessage: (msg: ScannerWorkerResponse, transfer?: Transferable[]) => void;
};

workerScope.onmessage = (event: MessageEvent<ScannerWorkerRequest>) => {
  const req = event.data;
  if (!req || typeof req.id !== "number") return;

  try {
    if (req.type === "DETECT_EDGES") {
      const quad = detectDocumentEdges(req.rgba, req.width, req.height);
      workerScope.postMessage({
        id: req.id,
        type: "DETECT_EDGES_RESULT",
        quad
      });
    } else if (req.type === "WARP_AND_FILTER") {
      const warped = warpPerspectiveRaw(
        req.rgba,
        req.width,
        req.height,
        req.quad,
        req.aspectPreset,
        req.maxOutputEdgePx
      );
      const filtered = applyScanFilterRaw(
        warped.data,
        warped.width,
        warped.height,
        req.filterOptions
      );
      workerScope.postMessage(
        {
          id: req.id,
          type: "WARP_AND_FILTER_RESULT",
          warpedRgba: warped.data,
          filteredRgba: filtered,
          width: warped.width,
          height: warped.height
        },
        [warped.data.buffer, filtered.buffer]
      );
    } else if (req.type === "APPLY_FILTER") {
      const filtered = applyScanFilterRaw(
        req.warpedRgba,
        req.width,
        req.height,
        req.filterOptions
      );
      workerScope.postMessage(
        {
          id: req.id,
          type: "APPLY_FILTER_RESULT",
          filteredRgba: filtered,
          width: req.width,
          height: req.height
        },
        [filtered.buffer]
      );
    }
  } catch (err) {
    workerScope.postMessage({
      id: req.id,
      type: "ERROR",
      message: err instanceof Error ? err.message : "Worker processing error"
    });
  }
};
