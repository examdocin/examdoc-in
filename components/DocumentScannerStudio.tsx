"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";
import {
  Camera,
  Upload,
  ScanLine,
  Sparkles,
  RotateCw,
  Maximize2,
  CheckCircle2,
  Download,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  CreditCard,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Send,
  Crop,
  Eye,
  RefreshCw,
  X
} from "lucide-react";
import {
  LoadedScanSource,
  loadScanSourceFromFile,
  rotateScanSource90,
  imageDataToCanvas,
  imageDataToHtmlImage
} from "@/lib/scanner/imageLoader";
import {
  QuadCorners,
  DEFAULT_INSET_QUAD,
  FULL_IMAGE_QUAD,
  rotateQuadCorners90
} from "@/lib/scanner/edgeDetector";
import { ScanAspectPreset } from "@/lib/scanner/perspectiveWarp";
import { ScanFilterId } from "@/lib/scanner/scanFilters";
import {
  runAutoEdgeDetection,
  runWarpAndFilter,
  runScanFilterOnly
} from "@/lib/scanner/scannerClient";
import {
  packImagesToCompliantPdf,
  PackedPdfResult,
  PdfPageItem
} from "@/lib/pdfBinaryEngine";
import {
  encodeCompliantJpeg,
  PackedJpegResult
} from "@/lib/jpegBinaryEngine";
import { createDemoDeskDocumentBlob } from "@/lib/sampleGenerator";

export type ScannerWorkflowMode = "document" | "id-card";
export type TargetKbBudget = "100" | "200" | "300" | "best";

export interface ScannedPageRecord {
  id: string;
  label: string;
  source: LoadedScanSource;
  quad: QuadCorners;
  aspectPreset: ScanAspectPreset;
  filter: ScanFilterId;
  brightness: number;
  contrast: number;
  warpedImageData: ImageData | null;
  filteredImageData: ImageData | null;
  previewDataUrl: string;
  htmlImage: HTMLImageElement | null;
}

interface DocumentScannerStudioProps {
  initialMode?: ScannerWorkflowMode;
  initialBudget?: TargetKbBudget;
  onSendToResizer?: (
    image: HTMLImageElement,
    name: string,
    targetTab: "photo" | "signature"
  ) => void;
}

const FILTER_PRESETS: {
  id: ScanFilterId;
  name: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "magic",
    name: "Magic Color",
    badge: "Best",
    desc: "Removes shadows & yellow tint; keeps stamps/ink vivid"
  },
  {
    id: "bw",
    name: "B&W Scan",
    badge: "Crisp",
    desc: "Pure #FFFFFF paper with razor-sharp black text"
  },
  {
    id: "lighten",
    name: "Shadow Remove",
    badge: "Soft",
    desc: "Gentle illumination lift for certificates with photos"
  },
  {
    id: "grayscale",
    name: "Grayscale",
    badge: "Govt",
    desc: "Clean high-contrast monochrome xerox look"
  },
  {
    id: "original",
    name: "Original",
    badge: "Raw",
    desc: "Perspective-flattened with untouched original colors"
  }
];

const ASPECT_PRESETS: { id: ScanAspectPreset; label: string }[] = [
  { id: "auto", label: "Auto Ratio" },
  { id: "a4-portrait", label: "A4 Portrait" },
  { id: "a4-landscape", label: "A4 Landscape" },
  { id: "id-card", label: "ID Card (85.6×54mm)" }
];

const KB_BUDGETS: {
  id: TargetKbBudget;
  label: string;
  shortLabel: string;
  minKB: number;
  maxKB: number;
}[] = [
  { id: "100", label: "Under 100 KB (50–95 KB)", shortLabel: "<100KB", minKB: 50, maxKB: 95 },
  { id: "200", label: "Under 200 KB (100–190 KB)", shortLabel: "<200KB", minKB: 100, maxKB: 190 },
  { id: "300", label: "Under 300 KB (150–285 KB)", shortLabel: "<300KB", minKB: 150, maxKB: 285 },
  { id: "best", label: "High Quality (250–750 KB)", shortLabel: "Best HQ", minKB: 180, maxKB: 750 }
];

export default function DocumentScannerStudio({
  initialMode = "document",
  initialBudget = "100",
  onSendToResizer
}: DocumentScannerStudioProps) {
  const [workflowMode, setWorkflowMode] = useState<ScannerWorkflowMode>(initialMode);
  const [targetBudget, setTargetBudget] = useState<TargetKbBudget>(initialBudget);
  const [pages, setPages] = useState<ScannedPageRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Stage: "crop" (4-point perspective handle editor) vs "enhance" (flattened filter & export preview)
  const [viewStage, setViewStage] = useState<"crop" | "enhance">("crop");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDetectingEdges, setIsDetectingEdges] = useState<boolean>(false);
  const [showFineTuneSliders, setShowFineTuneSliders] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Packed Output States
  const [packedPdf, setPackedPdf] = useState<PackedPdfResult | null>(null);
  const [packedJpg, setPackedJpg] = useState<PackedJpegResult | null>(null);
  const [idCardCompositeUrl, setIdCardCompositeUrl] = useState<string | null>(null);

  // Pointer Dragging & Floating Magnifier Loupe State
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    kind: "corner" | "edge";
    index: number;
    pointerX: number; // normalized 0..1
    pointerY: number; // normalized 0..1
  } | null>(null);

  // Optional WebRTC Live Camera Fallback Modal State
  const [liveCamOpen, setLiveCamOpen] = useState<boolean>(false);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const activePage: ScannedPageRecord | undefined = pages[activeIndex];

  // Load initial demo marksheet on mount so users can test corner crop & Magic Color immediately
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const blob = await createDemoDeskDocumentBlob();
        if (!mounted) return;
        const src = await loadScanSourceFromFile(blob, "10th-Marksheet-Desk-Photo.jpg");
        const detectedQuad = await runAutoEdgeDetection(src.imageData);
        const aspect: ScanAspectPreset =
          initialMode === "id-card" ? "id-card" : "auto";
        const { warpedImageData, filteredImageData } = await runWarpAndFilter(
          src.imageData,
          detectedQuad,
          aspect,
          { filter: "magic", brightness: 0, contrast: 0 }
        );
        const { image, dataUrl } = await imageDataToHtmlImage(filteredImageData);
        if (!mounted) return;
        const firstPage: ScannedPageRecord = {
          id: src.id,
          label: initialMode === "id-card" ? "ID Card — Front Side" : "Page 1",
          source: src,
          quad: detectedQuad,
          aspectPreset: aspect,
          filter: "magic",
          brightness: 0,
          contrast: 0,
          warpedImageData,
          filteredImageData,
          previewDataUrl: dataUrl,
          htmlImage: image
        };
        setPages([firstPage]);
        setActiveIndex(0);
        setViewStage("enhance");
      } catch {
        // Ignore demo init error
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialMode]);

  // Draw the 2.5x Zoom Magnifier Loupe whenever a handle is being dragged
  useEffect(() => {
    if (!draggingHandle || !activePage || !loupeCanvasRef.current) return;
    const loupeCanvas = loupeCanvasRef.current;
    const ctx = loupeCanvas.getContext("2d");
    if (!ctx) return;

    const size = 96;
    loupeCanvas.width = size;
    loupeCanvas.height = size;

    const srcCanvas = imageDataToCanvas(activePage.source.imageData);
    const sw = activePage.source.width;
    const sh = activePage.source.height;

    const cx = draggingHandle.pointerX * sw;
    const cy = draggingHandle.pointerY * sh;

    // 2.5x magnification window radius
    const zoomRadius = Math.max(24, Math.min(sw, sh) * 0.075);

    ctx.save();
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, size, size);

    ctx.drawImage(
      srcCanvas,
      cx - zoomRadius,
      cy - zoomRadius,
      zoomRadius * 2,
      zoomRadius * 2,
      0,
      0,
      size,
      size
    );

    // Draw precision target crosshairs inside the loupe
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [draggingHandle, activePage]);

  /**
   * Builds a composite A4 canvas containing ID Card Front + Back stacked cleanly with subtle borders
   * when workflowMode === "id-card".
   */
  const buildIdCard2In1A4Canvas = useCallback(
    (frontImg: HTMLImageElement, backImg?: HTMLImageElement | null): HTMLCanvasElement => {
      const a4W = 1240;
      const a4H = 1754;
      const canvas = document.createElement("canvas");
      canvas.width = a4W;
      canvas.height = a4H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, a4W, a4H);

      // Standard ID-1 card width on A4 (~55% of page width, 85.6:54 ratio)
      const cardW = 720;
      const cardH = Math.round(cardW / (85.6 / 54.0)); // ~454 px
      const centerX = Math.round((a4W - cardW) / 2);

      const drawFramedCard = (img: HTMLImageElement, topY: number, caption: string) => {
        // Subtle card shadow & crisp border
        ctx.fillStyle = "#F8FAFC";
        ctx.fillRect(centerX - 8, topY - 8, cardW + 16, cardH + 16);
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - 4, topY - 4, cardW + 8, cardH + 8);
        ctx.drawImage(img, centerX, topY, cardW, cardH);

        ctx.fillStyle = "#64748B";
        ctx.font = "700 20px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(caption, a4W / 2, topY - 18);
      };

      if (backImg) {
        drawFramedCard(frontImg, 250, "FRONT SIDE");
        drawFramedCard(backImg, 960, "BACK SIDE");
      } else {
        drawFramedCard(frontImg, Math.round((a4H - cardH) / 2), "ID CARD SCAN");
      }

      return canvas;
    },
    []
  );

  // Re-pack PDF and JPG outputs whenever pages, workflowMode, or targetBudget change
  useEffect(() => {
    const validPages = pages.filter((p) => p.htmlImage !== null);
    if (validPages.length === 0) {
      setPackedPdf(null);
      setPackedJpg(null);
      setIdCardCompositeUrl(null);
      return;
    }

    let cancelled = false;
    const budgetObj =
      KB_BUDGETS.find((b) => b.id === targetBudget) || KB_BUDGETS[0];

    const timer = setTimeout(async () => {
      try {
        // 1. Pack multi-page or ID Card 2-in-1 PDF
        const pdfItems: PdfPageItem[] = validPages.map((p, idx) => ({
          id: p.id,
          name: `${p.label || `page-${idx + 1}`}.jpg`,
          image: p.htmlImage!,
          rotation: 0
        }));

        const pdfRes = await packImagesToCompliantPdf(pdfItems, {
          minKB: budgetObj.minKB,
          maxKB: budgetObj.maxKB,
          mergeFrontBackOnSinglePage: workflowMode === "id-card",
          enhanceDocumentContrast: false, // already enhanced by CamScanner filter!
          grayscaleMode: false
        });

        // 2. Pack single-page / ID-Card composite 200-DPI JPG
        let jpgSourceCanvas: HTMLCanvasElement;
        if (workflowMode === "id-card") {
          jpgSourceCanvas = buildIdCard2In1A4Canvas(
            validPages[0].htmlImage!,
            validPages[1]?.htmlImage || null
          );
          if (!cancelled) {
            setIdCardCompositeUrl(jpgSourceCanvas.toDataURL("image/jpeg", 0.9));
          }
        } else {
          const activeValid =
            activePage?.filteredImageData || validPages[0].filteredImageData!;
          jpgSourceCanvas = imageDataToCanvas(activeValid);
          if (!cancelled) {
            setIdCardCompositeUrl(null);
          }
        }

        const jpgRes = await encodeCompliantJpeg(jpgSourceCanvas, {
          minKB: budgetObj.minKB,
          maxKB: budgetObj.maxKB,
          dpi: 200
        });

        if (!cancelled) {
          setPackedPdf(pdfRes);
          setPackedJpg(jpgRes);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to pack scanned output"
          );
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pages, activePage, workflowMode, targetBudget, buildIdCard2In1A4Canvas]);

  // Add 1 or more uploaded/captured files as scanned pages
  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    forceSlotIndex?: number
  ) => {
    const fileList = Array.from(e.target.files || []);
    e.target.value = "";
    if (fileList.length === 0) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setIsDetectingEdges(true);

    try {
      const maxAllowed = workflowMode === "id-card" ? 2 : 10;
      const newRecords: ScannedPageRecord[] = [];

      for (let i = 0; i < fileList.length; i++) {
        if (
          forceSlotIndex === undefined &&
          pages.length + newRecords.length >= maxAllowed
        ) {
          break;
        }
        const f = fileList[i];
        const src = await loadScanSourceFromFile(f);
        const detectedQuad = await runAutoEdgeDetection(src.imageData);
        const aspect: ScanAspectPreset =
          workflowMode === "id-card" ? "id-card" : "auto";

        const { warpedImageData, filteredImageData } = await runWarpAndFilter(
          src.imageData,
          detectedQuad,
          aspect,
          { filter: "magic", brightness: 0, contrast: 0 }
        );
        const { image, dataUrl } = await imageDataToHtmlImage(filteredImageData);

        const slotNum =
          forceSlotIndex !== undefined
            ? forceSlotIndex + 1
            : pages.length + newRecords.length + 1;

        const label =
          workflowMode === "id-card"
            ? slotNum === 1
              ? "ID Card — Front Side"
              : "ID Card — Back Side"
            : `Page ${slotNum}`;

        newRecords.push({
          id: src.id,
          label,
          source: src,
          quad: detectedQuad,
          aspectPreset: aspect,
          filter: "magic",
          brightness: 0,
          contrast: 0,
          warpedImageData,
          filteredImageData,
          previewDataUrl: dataUrl,
          htmlImage: image
        });
      }

      if (forceSlotIndex !== undefined && newRecords[0]) {
        setPages((prev) => {
          const copy = [...prev];
          copy[forceSlotIndex] = newRecords[0];
          return copy;
        });
        setActiveIndex(forceSlotIndex);
      } else if (newRecords.length > 0) {
        const nextIndex = pages.length;
        setPages((prev) => [...prev, ...newRecords].slice(0, maxAllowed));
        setActiveIndex(nextIndex);
      }

      // Show the interactive 4-corner cropper first when a user uploads their own photo
      setViewStage("crop");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not load document image"
      );
    } finally {
      setIsProcessing(false);
      setIsDetectingEdges(false);
    }
  };

  // Re-run perspective warp + filter on the active page (when user clicks "Crop & Enhance" or changes aspect ratio)
  const applyCropAndWarp = useCallback(
    async (
      customQuad?: QuadCorners,
      customAspect?: ScanAspectPreset
    ) => {
      if (!activePage) return;
      setIsProcessing(true);
      try {
        const quadToUse = customQuad || activePage.quad;
        const aspectToUse = customAspect || activePage.aspectPreset;

        const { warpedImageData, filteredImageData } = await runWarpAndFilter(
          activePage.source.imageData,
          quadToUse,
          aspectToUse,
          {
            filter: activePage.filter,
            brightness: activePage.brightness,
            contrast: activePage.contrast
          }
        );
        const { image, dataUrl } = await imageDataToHtmlImage(filteredImageData);

        setPages((prev) =>
          prev.map((p, idx) =>
            idx === activeIndex
              ? {
                  ...p,
                  quad: quadToUse,
                  aspectPreset: aspectToUse,
                  warpedImageData,
                  filteredImageData,
                  previewDataUrl: dataUrl,
                  htmlImage: image
                }
              : p
          )
        );
        setViewStage("enhance");
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Perspective warp failed"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [activePage, activeIndex]
  );

  // Fast filter or brightness/contrast update on an already-warped scan
  const updateActivePageFilter = useCallback(
    async (
      nextFilter: ScanFilterId,
      nextBrightness: number,
      nextContrast: number
    ) => {
      if (!activePage || !activePage.warpedImageData) return;
      setIsProcessing(true);
      try {
        const filteredImageData = await runScanFilterOnly(
          activePage.warpedImageData,
          {
            filter: nextFilter,
            brightness: nextBrightness,
            contrast: nextContrast
          }
        );
        const { image, dataUrl } = await imageDataToHtmlImage(filteredImageData);

        setPages((prev) =>
          prev.map((p, idx) =>
            idx === activeIndex
              ? {
                  ...p,
                  filter: nextFilter,
                  brightness: nextBrightness,
                  contrast: nextContrast,
                  filteredImageData,
                  previewDataUrl: dataUrl,
                  htmlImage: image
                }
              : p
          )
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Filter update failed");
      } finally {
        setIsProcessing(false);
      }
    },
    [activePage, activeIndex]
  );

  // Rotate active page source 90 degrees clockwise
  const handleRotateActive90 = async () => {
    if (!activePage) return;
    setIsProcessing(true);
    try {
      const rotatedSource = rotateScanSource90(activePage.source);
      const rotatedQuad = rotateQuadCorners90(activePage.quad);
      const { warpedImageData, filteredImageData } = await runWarpAndFilter(
        rotatedSource.imageData,
        rotatedQuad,
        activePage.aspectPreset,
        {
          filter: activePage.filter,
          brightness: activePage.brightness,
          contrast: activePage.contrast
        }
      );
      const { image, dataUrl } = await imageDataToHtmlImage(filteredImageData);

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activeIndex
            ? {
                ...p,
                source: rotatedSource,
                quad: rotatedQuad,
                warpedImageData,
                filteredImageData,
                previewDataUrl: dataUrl,
                htmlImage: image
              }
            : p
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-run Auto-Detect on the active page
  const handleAutoDetectCorners = async () => {
    if (!activePage) return;
    setIsDetectingEdges(true);
    try {
      const detected = await runAutoEdgeDetection(activePage.source.imageData);
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activeIndex ? { ...p, quad: detected } : p
        )
      );
    } finally {
      setIsDetectingEdges(false);
    }
  };

  // Set corners to Full Image
  const handleSelectFullImage = () => {
    if (!activePage) return;
    const fullQuad: QuadCorners = [
      { ...FULL_IMAGE_QUAD[0] },
      { ...FULL_IMAGE_QUAD[1] },
      { ...FULL_IMAGE_QUAD[2] },
      { ...FULL_IMAGE_QUAD[3] }
    ];
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activeIndex ? { ...p, quad: fullQuad } : p
      )
    );
  };

  // Pointer Events for Corner & Edge Midpoint Dragging (touch-action: none)
  const updateQuadFromPointer = (
    clientX: number,
    clientY: number,
    handle: { kind: "corner" | "edge"; index: number }
  ) => {
    if (!cropContainerRef.current || !activePage) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const nx = Math.max(0.01, Math.min(0.99, (clientX - rect.left) / rect.width));
    const ny = Math.max(0.01, Math.min(0.99, (clientY - rect.top) / rect.height));

    setDraggingHandle({
      ...handle,
      pointerX: nx,
      pointerY: ny
    });

    setPages((prev) =>
      prev.map((p, idx) => {
        if (idx !== activeIndex) return p;
        const nextQuad: QuadCorners = [
          { ...p.quad[0] },
          { ...p.quad[1] },
          { ...p.quad[2] },
          { ...p.quad[3] }
        ];

        if (handle.kind === "corner") {
          nextQuad[handle.index] = {
            x: Number(nx.toFixed(4)),
            y: Number(ny.toFixed(4))
          };
        } else {
          // Edge midpoint nudger: move both endpoints along the perpendicular axis
          const i1 = handle.index;
          const i2 = (handle.index + 1) % 4;
          const midX = (nextQuad[i1].x + nextQuad[i2].x) * 0.5;
          const midY = (nextQuad[i1].y + nextQuad[i2].y) * 0.5;
          const dx = nx - midX;
          const dy = ny - midY;

          nextQuad[i1] = {
            x: Math.max(0.01, Math.min(0.99, Number((nextQuad[i1].x + dx).toFixed(4)))),
            y: Math.max(0.01, Math.min(0.99, Number((nextQuad[i1].y + dy).toFixed(4))))
          };
          nextQuad[i2] = {
            x: Math.max(0.01, Math.min(0.99, Number((nextQuad[i2].x + dx).toFixed(4)))),
            y: Math.max(0.01, Math.min(0.99, Number((nextQuad[i2].y + dy).toFixed(4))))
          };
        }

        return { ...p, quad: nextQuad };
      })
    );
  };

  // Optional WebRTC Live Camera Fallback
  const openWebRtcFallback = async () => {
    setErrorMsg(null);
    setLiveCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        },
        audio: false
      });
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
    } catch {
      setLiveCamOpen(false);
      setErrorMsg(
        "Live camera stream unavailable. Use the 'Take Photo (Camera)' button to open your device camera."
      );
    }
  };

  const closeWebRtcFallback = () => {
    if (liveVideoRef.current && liveVideoRef.current.srcObject) {
      const stream = liveVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      liveVideoRef.current.srcObject = null;
    }
    setLiveCamOpen(false);
  };

  const captureFromWebRtcFallback = async () => {
    const video = liveVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    closeWebRtcFallback();

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const fakeEvent = {
          target: { files: [new File([blob], `camera-scan-${Date.now()}.jpg`, { type: "image/jpeg" })], value: "" }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleFilesSelected(fakeEvent);
      },
      "image/jpeg",
      0.92
    );
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const quadPoints = activePage?.quad || DEFAULT_INSET_QUAD;
  const edgeMidpoints = [0, 1, 2, 3].map((i) => {
    const p1 = quadPoints[i];
    const p2 = quadPoints[(i + 1) % 4];
    return {
      x: (p1.x + p2.x) * 0.5,
      y: (p1.y + p2.y) * 0.5
    };
  });

  // SVG polygon path for outside dark mask (evenodd fillRule)
  const svgPolygonPath = `M 0 0 L 100 0 L 100 100 L 0 100 Z M ${
    quadPoints[0].x * 100
  } ${quadPoints[0].y * 100} L ${quadPoints[1].x * 100} ${
    quadPoints[1].y * 100
  } L ${quadPoints[2].x * 100} ${quadPoints[2].y * 100} L ${
    quadPoints[3].x * 100
  } ${quadPoints[3].y * 100} Z`;

  return (
    <div className="space-y-4">
      {/* Top Mode Switcher & Mobile Camera / Gallery Entry Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-[11px] font-bold mb-1">
              <ScanLine className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Auto-Edge Crop • Magic Color Shadow Remover</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Document, Marksheet &amp; ID Card 2-in-1 Scanner
            </h3>
          </div>

          {/* Workflow Mode Toggle: Multi-Page Document vs ID Card 2-in-1 */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setWorkflowMode("document");
              }}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                workflowMode === "document"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Document (1–10 Pages)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkflowMode("id-card");
                if (pages[activeIndex]) {
                  applyCropAndWarp(pages[activeIndex].quad, "id-card");
                }
              }}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                workflowMode === "id-card"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>ID Card 2-in-1 (Front+Back)</span>
            </button>
          </div>
        </div>

        {/* Capture / Upload Entry: Two Big Thumb-Friendly Buttons (min-h-[52px]) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Primary: Take Photo (Camera) with capture="environment" */}
          <label className="sm:col-span-5 cursor-pointer min-h-[52px] px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition">
            <Camera className="w-5 h-5 shrink-0" />
            <span>
              {workflowMode === "id-card"
                ? pages.length === 1
                  ? "Take Photo (Scan Back Side)"
                  : "Take Photo (Scan Front Side)"
                : "Take Photo (Camera)"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFilesSelected(e)}
              className="hidden"
            />
          </label>

          {/* Secondary: Choose from Gallery */}
          <label className="sm:col-span-5 cursor-pointer min-h-[52px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300/80 text-slate-800 font-bold text-sm flex items-center justify-center gap-2.5 transition">
            <Upload className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Choose from Gallery</span>
            <input
              type="file"
              accept="image/*,.webp,.png,.jpg,.jpeg"
              multiple={workflowMode === "document"}
              onChange={(e) => handleFilesSelected(e)}
              className="hidden"
            />
          </label>

          {/* Desktop / Fallback Live WebRTC Button */}
          <button
            type="button"
            onClick={openWebRtcFallback}
            className="sm:col-span-2 min-h-[52px] px-3 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            title="Open Browser Live Webcam"
          >
            <Camera className="w-4 h-4 text-slate-500 shrink-0" />
            <span>WebCam</span>
          </button>
        </div>

        {/* Guided 2-Step Banner when in ID Card 2-in-1 Mode */}
        {workflowMode === "id-card" && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[0, 1].map((slotIdx) => {
              const slotPage = pages[slotIdx];
              const isCurrent = activeIndex === slotIdx;
              return (
                <div
                  key={slotIdx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    isCurrent
                      ? "bg-blue-50/70 border-blue-400"
                      : slotPage
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
                      Step {slotIdx + 1}: {slotIdx === 0 ? "Front Side" : "Back Side"}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {slotPage ? "Scanned & Straightened" : "Waiting for scan..."}
                    </div>
                  </div>
                  <label className="cursor-pointer min-h-[44px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-800 flex items-center shrink-0">
                    <span>{slotPage ? "Replace" : "Scan"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFilesSelected(e, slotIdx)}
                      className="hidden"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="min-h-[44px] px-2 font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Desktop / Single-Column Mobile Scanner Workbench */}
      {activePage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* LEFT COLUMN (8 cols on Desktop): Interactive Corner Cropper OR Enhanced Scan Preview + Page Strip */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 space-y-4">
            {/* Top Mode Sub-bar: Switch between "Adjust 4 Corners" and "Enhanced Scan Preview" */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewStage("crop")}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                    viewStage === "crop"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>1. Adjust Corners</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCropAndWarp()}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                    viewStage === "enhance"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Flattened Scan</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isProcessing || isDetectingEdges ? (
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isDetectingEdges ? "Detecting Edges..." : "Warping..."}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activePage.label}</span>
                  </span>
                )}
              </div>
            </div>

            {/* ==================== STAGE 1: INTERACTIVE 4-CORNER TOUCH CROPPER ==================== */}
            {viewStage === "crop" && (
              <div className="space-y-3.5">
                <div className="relative bg-slate-950 rounded-2xl p-2 sm:p-4 flex items-center justify-center overflow-hidden select-none">
                  {/* Responsive Image Wrapper with exact aspect alignment */}
                  <div
                    ref={cropContainerRef}
                    style={{ touchAction: "none" }}
                    className="relative inline-block max-w-full"
                    onPointerMove={(e) => {
                      if (!draggingHandle) return;
                      e.preventDefault();
                      updateQuadFromPointer(e.clientX, e.clientY, draggingHandle);
                    }}
                    onPointerUp={() => setDraggingHandle(null)}
                    onPointerCancel={() => setDraggingHandle(null)}
                  >
                    <img
                      src={activePage.source.dataUrl}
                      alt="Source Document for Corner Cropping"
                      draggable={false}
                      className="max-h-[370px] sm:max-h-[480px] w-auto block rounded select-none pointer-events-none"
                    />

                    {/* SVG Shaded Outside Mask + Quadrilateral Perimeter Lines */}
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <path
                        d={svgPolygonPath}
                        fill="rgba(15, 23, 42, 0.58)"
                        fillRule="evenodd"
                      />
                      <polygon
                        points={quadPoints
                          .map((p) => `${p.x * 100},${p.y * 100}`)
                          .join(" ")}
                        fill="rgba(37, 99, 235, 0.08)"
                        stroke="#3B82F6"
                        strokeWidth="0.9"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* 4 Edge Midpoint Nudgers */}
                    {edgeMidpoints.map((mid, idx) => (
                      <div
                        key={`edge-${idx}`}
                        role="slider"
                        aria-label={`Edge ${idx + 1} Handle`}
                        tabIndex={0}
                        style={{
                          left: `${mid.x * 100}%`,
                          top: `${mid.y * 100}%`,
                          touchAction: "none"
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          updateQuadFromPointer(e.clientX, e.clientY, {
                            kind: "edge",
                            index: idx
                          });
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md" />
                      </div>
                    ))}

                    {/* 4 Circular Corner Drag Handles (44x44px hit target) */}
                    {quadPoints.map((pt, idx) => {
                      const isActive =
                        draggingHandle?.kind === "corner" &&
                        draggingHandle.index === idx;
                      return (
                        <div
                          key={`corner-${idx}`}
                          role="slider"
                          aria-label={`Corner ${idx + 1} Handle`}
                          tabIndex={0}
                          style={{
                            left: `${pt.x * 100}%`,
                            top: `${pt.y * 100}%`,
                            touchAction: "none"
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            updateQuadFromPointer(e.clientX, e.clientY, {
                              kind: "corner",
                              index: idx
                            });
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                        >
                          <span
                            className={`w-6 h-6 rounded-full border-3 shadow-lg flex items-center justify-center transition-transform ${
                              isActive
                                ? "bg-emerald-500 border-white scale-125"
                                : "bg-blue-600/90 border-white hover:scale-110"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating 96x96px 2.5x Zoom Magnifier Loupe (docks to opposite corner of active drag handle) */}
                  {draggingHandle && (
                    <div
                      className={`absolute top-3 ${
                        draggingHandle.pointerX < 0.5 ? "right-3" : "left-3"
                      } z-30 pointer-events-none flex flex-col items-center`}
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-white shadow-2xl bg-slate-900">
                        <canvas
                          ref={loupeCanvasRef}
                          className="w-full h-full block"
                        />
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold">
                        2.5× Loupe
                      </span>
                    </div>
                  )}
                </div>

                {/* Compact Bottom Tool Dock for Corner Cropper */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDetectCorners}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <ScanLine className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Auto-Detect</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectFullImage}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Maximize2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Full Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateActive90}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCw className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyCropAndWarp()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>Crop &amp; Enhance</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* ==================== STAGE 2: FLATTENED & FILTERED SCAN PREVIEW ==================== */}
            {viewStage === "enhance" && (
              <div className="space-y-3.5">
                <div className="relative bg-slate-100 border border-slate-200 rounded-2xl p-3 sm:p-5 flex items-center justify-center min-h-[240px] sm:min-h-[380px]">
                  <img
                    src={
                      workflowMode === "id-card" && idCardCompositeUrl
                        ? idCardCompositeUrl
                        : activePage.previewDataUrl
                    }
                    alt="Perspective Straightened & Enhanced Document Scan"
                    className="max-h-[260px] sm:max-h-[430px] w-auto rounded-lg shadow-md bg-white border border-slate-200"
                  />
                </div>

                {/* Mobile Filter Strip (Visible on <lg so mobile users can swipe filters right under the preview) */}
                <div className="lg:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Studio Scan Filter
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewStage("crop")}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Re-Crop Corners</span>
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
                    {FILTER_PRESETS.map((f) => {
                      const active = activePage.filter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() =>
                            updateActivePageFilter(
                              f.id,
                              activePage.brightness,
                              activePage.contrast
                            )
                          }
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition ${
                            active
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{f.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              active
                                ? "bg-blue-700 text-blue-100"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {f.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Horizontal Multi-Page Filmstrip (1 to 10 Pages) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {workflowMode === "id-card"
                    ? `ID Card Sides (${pages.length} / 2)`
                    : `Scanned Pages (${pages.length} / 10)`}
                </span>
                {packedPdf && (
                  <span className="text-xs font-bold text-emerald-700">
                    Merged PDF: {packedPdf.sizeKB} KB
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {pages.map((p, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <div
                      key={p.id}
                      className={`shrink-0 w-28 rounded-xl border p-1.5 transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className="w-full text-left"
                      >
                        <img
                          src={p.previewDataUrl}
                          alt={p.label}
                          className="w-full h-20 object-cover rounded-lg bg-white border border-slate-200"
                        />
                        <div className="mt-1 text-[11px] font-bold text-slate-800 truncate">
                          {workflowMode === "id-card"
                            ? idx === 0
                              ? "1. Front Side"
                              : "2. Back Side"
                            : `Page ${idx + 1}`}
                        </div>
                      </button>

                      <div className="mt-1 flex items-center justify-between border-t border-slate-200/70 pt-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            setPages((prev) => {
                              const copy = [...prev];
                              const tmp = copy[idx - 1];
                              copy[idx - 1] = copy[idx];
                              copy[idx] = tmp;
                              return copy;
                            });
                            setActiveIndex(idx - 1);
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={() => {
                            setPages((prev) => {
                              const copy = [...prev];
                              const tmp = copy[idx + 1];
                              copy[idx + 1] = copy[idx];
                              copy[idx] = tmp;
                              return copy;
                            });
                            setActiveIndex(idx + 1);
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPages((prev) => prev.filter((_, i) => i !== idx));
                              setActiveIndex((prevIdx) =>
                                Math.max(0, Math.min(prevIdx, pages.length - 2))
                              );
                            }}
                            className="p-1 rounded hover:bg-red-100 text-red-600"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* + Add Page Tile */}
                {pages.length < (workflowMode === "id-card" ? 2 : 10) && (
                  <label className="shrink-0 w-28 h-[126px] rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1 text-blue-700 transition">
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-extrabold">
                      {workflowMode === "id-card" ? "+ Back Side" : "+ Add Page"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.webp,.png,.jpg,.jpeg"
                      multiple={workflowMode === "document"}
                      onChange={(e) => handleFilesSelected(e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (4 cols on Desktop): Aspect Ratio, 5 Filter Cards, Brightness/Contrast, Target KB & Exports */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Document Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_PRESETS.map((ap) => {
                  const active = activePage.aspectPreset === ap.id;
                  return (
                    <button
                      key={ap.id}
                      type="button"
                      onClick={() => applyCropAndWarp(activePage.quad, ap.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition ${
                        active
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {ap.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Studio Scan Filter Cards (Desktop View) */}
            <div className="hidden lg:block">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Studio Scan Filter
              </label>
              <div className="space-y-1.5">
                {FILTER_PRESETS.map((f) => {
                  const active = activePage.filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        updateActivePageFilter(
                          f.id,
                          activePage.brightness,
                          activePage.contrast
                        )
                      }
                      className={`w-full min-h-[48px] p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold">{f.name}</div>
                        <div
                          className={`text-[11px] truncate ${
                            active ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {f.desc}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          active
                            ? "bg-blue-700 text-blue-100"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {f.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Fine-Tune Brightness & Contrast Sliders */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFineTuneSliders((v) => !v)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fine-Tune Brightness &amp; Contrast</span>
                </span>
                {showFineTuneSliders ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showFineTuneSliders && (
                <div className="p-3.5 space-y-3 bg-white border-t border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Brightness</span>
                      <span>
                        {activePage.brightness > 0
                          ? `+${activePage.brightness}`
                          : activePage.brightness}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      step={2}
                      value={activePage.brightness}
                      onChange={(e) =>
                        updateActivePageFilter(
                          activePage.filter,
                          Number(e.target.value),
                          activePage.contrast
                        )
                      }
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Contrast</span>
                      <span>
                        {activePage.contrast > 0
                          ? `+${activePage.contrast}`
                          : activePage.contrast}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={45}
                      step={2}
                      value={activePage.contrast}
                      onChange={(e) =>
                        updateActivePageFilter(
                          activePage.filter,
                          activePage.brightness,
                          Number(e.target.value)
                        )
                      }
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target KB Ceiling Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Target File Size Ceiling
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KB_BUDGETS.map((b) => {
                  const active = targetBudget === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setTargetBudget(b.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {b.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Export Buttons */}
            <div className="space-y-2.5 pt-1">
              {packedPdf && (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedPdf.blob,
                      `${
                        workflowMode === "id-card"
                          ? "id-card-front-back"
                          : "scanned-document"
                      }-${Math.round(packedPdf.sizeKB)}kb.pdf`
                    )
                  }
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>
                    Download Exact-KB PDF ({packedPdf.sizeKB} KB)
                  </span>
                </button>
              )}

              {packedJpg && (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedJpg.blob,
                      `${
                        workflowMode === "id-card"
                          ? "id-card-a4-200dpi"
                          : `scan-page-${activeIndex + 1}-200dpi`
                      }-${Math.round(packedJpg.report.sizeKB)}kb.jpg`
                    )
                  }
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Download 200-DPI JPG ({packedJpg.report.sizeKB} KB)
                  </span>
                </button>
              )}

              {/* 1-Click Handoff to Exam Photo / Sign Resizer */}
              {onSendToResizer && activePage.htmlImage && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onSendToResizer(
                        activePage.htmlImage!,
                        `${activePage.label}-Scan.jpg`,
                        "signature"
                      )
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Send to Sign/Decl.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSendToResizer(
                        activePage.htmlImage!,
                        `${activePage.label}-Scan.jpg`,
                        "photo"
                      )
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Send to Photo Maker</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar (fixed bottom-0 inset-x-0 z-40) */}
      {packedPdf && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 md:hidden shadow-lg space-y-2">
          <div className="max-w-md mx-auto flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-600">
              Target Limit:
            </span>
            <div className="flex items-center gap-1.5">
              {KB_BUDGETS.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTargetBudget(b.id)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    targetBudget === b.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {b.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  packedPdf.blob,
                  `${
                    workflowMode === "id-card"
                      ? "id-card-front-back"
                      : "scanned-document"
                  }-${Math.round(packedPdf.sizeKB)}kb.pdf`
                )
              }
              className="w-full min-h-[48px] px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download PDF ({packedPdf.sizeKB} KB)</span>
            </button>
          </div>
        </div>
      )}

      {/* Optional Live WebRTC Camera Modal Fallback */}
      {liveCamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900">
                Live Document Camera
              </h4>
              <button
                type="button"
                onClick={closeWebRtcFallback}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[260px]">
              <video
                ref={liveVideoRef}
                playsInline
                muted
                className="max-h-[340px] w-auto"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={captureFromWebRtcFallback}
                className="flex-1 min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Document</span>
              </button>
              <button
                type="button"
                onClick={closeWebRtcFallback}
                className="min-h-[48px] px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
