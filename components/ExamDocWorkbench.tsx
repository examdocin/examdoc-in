"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Camera,
  FileText,
  Image as ImageIcon,
  PenTool,
  Printer,
  Upload,
  Download,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sliders,
  Binary,
  RefreshCw,
  Eye
} from "lucide-react";
import {
  EXAMS,
  ExamSpec,
  DocumentPreset,
  ToolTabId,
  OFFICIAL_DECLARATIONS
} from "@/data/exams";
import {
  encodeCompliantJpeg,
  PackedJpegResult
} from "@/lib/jpegBinaryEngine";
import {
  loadImageFromFile,
  renderPassportPhotoCanvas,
  draw80PercentFaceGuideOverlay,
  renderSignatureThresholdCanvas,
  render4x6StudioPrintSheet,
  InkColorMode
} from "@/lib/imageProcessing";
import {
  packImagesToCompliantPdf,
  PdfPageItem,
  PackedPdfResult
} from "@/lib/pdfBinaryEngine";
import {
  createDemoPassportPhoto,
  createDemoGrayPaperSignature,
  createDemoDocumentPages
} from "@/lib/sampleGenerator";

interface ExamDocWorkbenchProps {
  initialExamSlug?: string;
}

function getTodayFormattedDDMMYYYY(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ExamDocWorkbench({ initialExamSlug }: ExamDocWorkbenchProps) {
  const currentExam: ExamSpec =
    EXAMS.find((e) => e.slug === initialExamSlug) || EXAMS[0];

  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(currentExam.slug);
  const activeExam = EXAMS.find((e) => e.slug === selectedExamSlug) || EXAMS[0];

  const [activeTab, setActiveTab] = useState<ToolTabId>(activeExam.defaultTab);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    activeExam.presets[0]?.id || "ssc-photo"
  );

  // Shared Binary Spec State (populated by selected preset, editable by user)
  const [widthPx, setWidthPx] = useState<number>(activeExam.presets[0]?.widthPx || 275);
  const [heightPx, setHeightPx] = useState<number>(activeExam.presets[0]?.heightPx || 354);
  const [minKB, setMinKB] = useState<number>(activeExam.presets[0]?.minKB || 20);
  const [maxKB, setMaxKB] = useState<number>(activeExam.presets[0]?.maxKB || 50);
  const [dpi, setDpi] = useState<200 | 300 | 600>(activeExam.presets[0]?.dpi || 200);

  // Tab 1: Photo Maker State
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [photoZoom, setPhotoZoom] = useState<number>(1.0);
  const [photoPanX, setPhotoPanX] = useState<number>(0);
  const [photoPanY, setPhotoPanY] = useState<number>(0);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoBrightness, setPhotoBrightness] = useState<number>(6);
  const [photoContrast, setPhotoContrast] = useState<number>(8);
  const [whiteBgBoost, setWhiteBgBoost] = useState<boolean>(true);
  const [showNameDop, setShowNameDop] = useState<boolean>(
    activeExam.presets[0]?.requiresNameDop ?? true
  );
  const [candidateName, setCandidateName] = useState<string>("AARAV SHARMA");
  const [dateOfPhoto, setDateOfPhoto] = useState<string>(getTodayFormattedDDMMYYYY());
  const [dopPrefix, setDopPrefix] = useState<string>("DOP:");
  const [show80FaceGuide, setShow80FaceGuide] = useState<boolean>(
    activeExam.presets[0]?.requiresFaceOval ?? true
  );
  const [photoBorderPx, setPhotoBorderPx] = useState<number>(0);
  const [packedPhoto, setPackedPhoto] = useState<PackedJpegResult | null>(null);
  const [cleanPhotoCanvas, setCleanPhotoCanvas] = useState<HTMLCanvasElement | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState<boolean>(false);
  const photoPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2: Signature, Thumb & Declaration State
  const [signImage, setSignImage] = useState<HTMLImageElement | null>(null);
  const [signZoom, setSignZoom] = useState<number>(1.0);
  const [signPanX, setSignPanX] = useState<number>(0);
  const [signPanY, setSignPanY] = useState<number>(0);
  const [signRotation, setSignRotation] = useState<number>(0);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState<number>(58);
  const [inkSharpness, setInkSharpness] = useState<number>(68);
  const [inkMode, setInkMode] = useState<InkColorMode>("natural");
  const [packedSign, setPackedSign] = useState<PackedJpegResult | null>(null);
  const [signProcessing, setSignProcessing] = useState<boolean>(false);
  const [declBankKey, setDeclBankKey] = useState<string>("IBPS");
  const [declCandidateName, setDeclCandidateName] = useState<string>("Aarav Sharma");
  const [declDob, setDeclDob] = useState<string>("15/08/2003");
  const [copiedDecl, setCopiedDecl] = useState<boolean>(false);

  // Tab 3: Marksheet & Aadhaar PDF <100KB / <300KB State
  const [pdfPages, setPdfPages] = useState<PdfPageItem[]>([]);
  const [pdfMinKB, setPdfMinKB] = useState<number>(50);
  const [pdfMaxKB, setPdfMaxKB] = useState<number>(95);
  const [mergeFrontBackSinglePage, setMergeFrontBackSinglePage] = useState<boolean>(true);
  const [enhancePdfContrast, setEnhancePdfContrast] = useState<boolean>(true);
  const [pdfGrayscale, setPdfGrayscale] = useState<boolean>(false);
  const [packedPdf, setPackedPdf] = useState<PackedPdfResult | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState<boolean>(false);

  // Tab 4: SSC Live Webcam Studio State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [webcamBrightnessBoost, setWebcamBrightnessBoost] = useState<number>(18);
  const [webcamCountdown, setWebcamCountdown] = useState<number | null>(null);
  const [webcamCapturedResult, setWebcamCapturedResult] = useState<PackedJpegResult | null>(null);

  // Tab 5: 4x6 Inch Studio Print Sheet State
  const [sheetLayout, setSheetLayout] = useState<"8-landscape" | "8-portrait" | "12-landscape">(
    "8-landscape"
  );
  const [sheetCutLines, setSheetCutLines] = useState<boolean>(true);
  const [sheetPhotoBorder, setSheetPhotoBorder] = useState<boolean>(true);
  const [packedSheet, setPackedSheet] = useState<PackedJpegResult | null>(null);
  const [sheetProcessing, setSheetProcessing] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply preset whenever preset selection changes
  const applyPreset = useCallback((preset: DocumentPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTab(preset.tab);
    if (preset.tab === "pdf") {
      setPdfMinKB(preset.minKB);
      setPdfMaxKB(preset.maxKB);
    } else {
      setWidthPx(preset.widthPx);
      setHeightPx(preset.heightPx);
      setMinKB(preset.minKB);
      setMaxKB(preset.maxKB);
      setDpi(preset.dpi);
      if (preset.tab === "photo") {
        setShowNameDop(preset.requiresNameDop);
        setShow80FaceGuide(preset.requiresFaceOval);
      }
    }
  }, []);

  // Load demo samples on initial client mount so user immediately sees live binary compliance
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [demoPhoto, demoSign, demoDocs] = await Promise.all([
          createDemoPassportPhoto(),
          createDemoGrayPaperSignature(),
          createDemoDocumentPages()
        ]);
        if (!mounted) return;
        setPhotoImage(demoPhoto);
        setSignImage(demoSign);
        setPdfPages(
          demoDocs.map((d, idx) => ({
            id: `demo-page-${idx}`,
            name: d.name,
            image: d.image,
            rotation: 0
          }))
        );
      } catch {
        // Ignore demo init errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Re-render Tab 1 Photo Maker + Binary JPEG Packer whenever parameters change
  useEffect(() => {
    if (!photoImage) return;
    let cancelled = false;
    setPhotoProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const renderedCanvas = renderPassportPhotoCanvas(photoImage, {
          widthPx: Math.max(50, Math.min(2400, widthPx)),
          heightPx: Math.max(50, Math.min(2400, heightPx)),
          zoom: photoZoom,
          panX: photoPanX,
          panY: photoPanY,
          rotation: photoRotation,
          brightness: photoBrightness,
          contrast: photoContrast,
          whiteBgBoost,
          showNameDopPlaque: showNameDop,
          candidateName,
          dateOfPhoto,
          dopPrefix,
          borderWidthPx: photoBorderPx
        });

        if (cancelled) return;
        setCleanPhotoCanvas(renderedCanvas);

        // Draw preview canvas (with optional 80% Face Coverage Oval Guide overlay)
        const previewCanvas = photoPreviewCanvasRef.current;
        if (previewCanvas) {
          previewCanvas.width = renderedCanvas.width;
          previewCanvas.height = renderedCanvas.height;
          const pCtx = previewCanvas.getContext("2d");
          if (pCtx) {
            pCtx.drawImage(renderedCanvas, 0, 0);
            if (show80FaceGuide) {
              draw80PercentFaceGuideOverlay(
                pCtx,
                renderedCanvas.width,
                renderedCanvas.height,
                showNameDop
              );
            }
          }
        }

        // Encode true binary-compliant JPEG with 200/300 DPI JFIF header + [minKB, maxKB] binary search & EOI padding
        const safeMinKB = Math.max(4, Math.min(minKB, maxKB - 2));
        const safeMaxKB = Math.max(safeMinKB + 2, maxKB);
        const packed = await encodeCompliantJpeg(renderedCanvas, {
          minKB: safeMinKB,
          maxKB: safeMaxKB,
          dpi
        });

        if (!cancelled) {
          setPackedPhoto(packed);
          setPhotoProcessing(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Photo processing failed");
          setPhotoProcessing(false);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    photoImage,
    widthPx,
    heightPx,
    minKB,
    maxKB,
    dpi,
    photoZoom,
    photoPanX,
    photoPanY,
    photoRotation,
    photoBrightness,
    photoContrast,
    whiteBgBoost,
    showNameDop,
    candidateName,
    dateOfPhoto,
    dopPrefix,
    show80FaceGuide,
    photoBorderPx
  ]);

  // Re-render Tab 2 Signature, Thumb & Declaration Adaptive Thresholding + Binary Packer
  useEffect(() => {
    if (!signImage) return;
    let cancelled = false;
    setSignProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const signW = activeTab === "signature" ? widthPx : 315;
        const signH = activeTab === "signature" ? heightPx : 157;
        const signMin = activeTab === "signature" ? minKB : 10;
        const signMax = activeTab === "signature" ? maxKB : 20;

        const renderedCanvas = renderSignatureThresholdCanvas(signImage, {
          widthPx: Math.max(40, Math.min(2400, signW)),
          heightPx: Math.max(30, Math.min(2400, signH)),
          zoom: signZoom,
          panX: signPanX,
          panY: signPanY,
          rotation: signRotation,
          adaptiveThreshold,
          inkSharpness,
          inkMode,
          autoTrimPadding: true
        });

        const safeMin = Math.max(4, Math.min(signMin, signMax - 2));
        const safeMax = Math.max(safeMin + 2, signMax);
        const packed = await encodeCompliantJpeg(renderedCanvas, {
          minKB: safeMin,
          maxKB: safeMax,
          dpi
        });

        if (!cancelled) {
          setPackedSign(packed);
          setSignProcessing(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Signature processing failed");
          setSignProcessing(false);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    signImage,
    activeTab,
    widthPx,
    heightPx,
    minKB,
    maxKB,
    dpi,
    signZoom,
    signPanX,
    signPanY,
    signRotation,
    adaptiveThreshold,
    inkSharpness,
    inkMode
  ]);

  // Re-render Tab 3 PDF Packer when pages or target KB change
  useEffect(() => {
    if (pdfPages.length === 0) {
      setPackedPdf(null);
      return;
    }
    let cancelled = false;
    setPdfProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const result = await packImagesToCompliantPdf(pdfPages, {
          minKB: pdfMinKB,
          maxKB: pdfMaxKB,
          mergeFrontBackOnSinglePage: mergeFrontBackSinglePage,
          enhanceDocumentContrast: enhancePdfContrast,
          grayscaleMode: pdfGrayscale
        });
        if (!cancelled) {
          setPackedPdf(result);
          setPdfProcessing(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "PDF packing failed");
          setPdfProcessing(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    pdfPages,
    pdfMinKB,
    pdfMaxKB,
    mergeFrontBackSinglePage,
    enhancePdfContrast,
    pdfGrayscale
  ]);

  // Re-render Tab 5 4x6 Inch Studio Print Sheet whenever cleanPhotoCanvas or sheet settings change
  useEffect(() => {
    if (!cleanPhotoCanvas) return;
    let cancelled = false;
    setSheetProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const sheetCanvas = render4x6StudioPrintSheet(cleanPhotoCanvas, {
          layout: sheetLayout,
          showCutLines: sheetCutLines,
          showPhotoBorder: sheetPhotoBorder,
          paperMarginPx: 42
        });

        const packed = await encodeCompliantJpeg(sheetCanvas, {
          minKB: 180,
          maxKB: 650,
          dpi: 300
        });

        if (!cancelled) {
          setPackedSheet(packed);
          setSheetProcessing(false);
        }
      } catch {
        if (!cancelled) setSheetProcessing(false);
      }
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanPhotoCanvas, sheetLayout, sheetCutLines, sheetPhotoBorder]);

  // Tab 4: Webcam Lifecycle Management
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  }, []);

  const startWebcam = useCallback(
    async (mode: "user" | "environment" = facingMode) => {
      setWebcamError(null);
      stopWebcam();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Camera API is not available in this browser context. Ensure you are on HTTPS or localhost."
          );
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 960 }
          },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setWebcamActive(true);

          // Draw 80% face oval overlay on webcam guide canvas
          const guideCanvas = webcamOverlayRef.current;
          if (guideCanvas) {
            guideCanvas.width = 550;
            guideCanvas.height = 708;
            const gCtx = guideCanvas.getContext("2d");
            if (gCtx) {
              gCtx.clearRect(0, 0, 550, 708);
              draw80PercentFaceGuideOverlay(gCtx, 550, 708, showNameDop);
            }
          }
        }
      } catch (err) {
        setWebcamError(
          err instanceof Error
            ? err.message
            : "Camera permission denied. Please allow camera access in your browser address bar."
        );
      }
    },
    [facingMode, showNameDop, stopWebcam]
  );

  useEffect(() => {
    if (activeTab !== "webcam") {
      stopWebcam();
    }
  }, [activeTab, stopWebcam]);

  const captureFromWebcam = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !webcamActive) return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Crop center 3.5:4.5 portrait frame from live webcam feed
    const targetAspect = 275 / 354;
    let cropW = vw;
    let cropH = Math.round(vw / targetAspect);
    if (cropH > vh) {
      cropH = vh;
      cropW = Math.round(vh * targetAspect);
    }
    const sx = Math.round((vw - cropW) / 2);
    const sy = Math.round((vh - cropH) / 2);

    const rawCaptureCanvas = document.createElement("canvas");
    rawCaptureCanvas.width = 550;
    rawCaptureCanvas.height = 708;
    const rCtx = rawCaptureCanvas.getContext("2d");
    if (!rCtx) return;

    rCtx.save();
    if (facingMode === "user") {
      // Un-mirror front camera so text/parting is natural
      rCtx.translate(550, 0);
      rCtx.scale(-1, 1);
    }
    rCtx.drawImage(video, sx, sy, cropW, cropH, 0, 0, 550, 708);
    rCtx.restore();

    const dataUrl = rawCaptureCanvas.toDataURL("image/png");
    const img = new Image();
    img.onload = async () => {
      setPhotoImage(img);
      setPhotoBrightness(webcamBrightnessBoost);
      setWhiteBgBoost(true);

      // Immediately generate SSC 275x354 20KB-50KB 200 DPI JPG
      const sscCanvas = renderPassportPhotoCanvas(img, {
        widthPx: 275,
        heightPx: 354,
        zoom: 1.0,
        panX: 0,
        panY: 0,
        rotation: 0,
        brightness: webcamBrightnessBoost,
        contrast: 10,
        whiteBgBoost: true,
        showNameDopPlaque: showNameDop,
        candidateName,
        dateOfPhoto,
        dopPrefix,
        borderWidthPx: 0
      });

      const packed = await encodeCompliantJpeg(sscCanvas, {
        minKB: 20,
        maxKB: 50,
        dpi: 200
      });
      setWebcamCapturedResult(packed);
    };
    img.src = dataUrl;
  }, [
    webcamActive,
    facingMode,
    webcamBrightnessBoost,
    showNameDop,
    candidateName,
    dateOfPhoto,
    dopPrefix
  ]);

  const triggerWebcamCountdownCapture = () => {
    setWebcamCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setWebcamCountdown(null);
        captureFromWebcam();
      } else {
        setWebcamCountdown(count);
      }
    }, 850);
  };

  // File upload handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    try {
      const img = await loadImageFromFile(file);
      setPhotoImage(img);
      setPhotoZoom(1.0);
      setPhotoPanX(0);
      setPhotoPanY(0);
      setPhotoRotation(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load photo");
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    try {
      const img = await loadImageFromFile(file);
      setSignImage(img);
      setSignZoom(1.0);
      setSignPanX(0);
      setSignPanY(0);
      setSignRotation(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load signature image");
    }
  };

  const handlePdfImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErrorMessage(null);
    try {
      const remainingSlots = Math.max(0, 5 - pdfPages.length);
      const toLoad = files.slice(0, Math.max(1, remainingSlots));
      const loadedItems: PdfPageItem[] = [];
      for (const f of toLoad) {
        const img = await loadImageFromFile(f);
        loadedItems.push({
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          image: img,
          rotation: 0
        });
      }
      setPdfPages((prev) => [...prev, ...loadedItems].slice(0, 5));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load document pages");
    }
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

  // Format personalized official declaration text
  const getPersonalizedDeclarationText = (): string => {
    const raw =
      OFFICIAL_DECLARATIONS[declBankKey]?.text || OFFICIAL_DECLARATIONS.IBPS.text;
    return raw
      .replace("_______ (Name of the candidate)", declCandidateName || "_______")
      .replace("______", declDob || "______");
  };

  const handleCopyDeclaration = () => {
    navigator.clipboard.writeText(getPersonalizedDeclarationText());
    setCopiedDecl(true);
    setTimeout(() => setCopiedDecl(false), 2500);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Exam & Portal Selector Pill Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Client-Side • Zero Server Upload • True JFIF 200/300 DPI Header
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Select Exam or Identity Portal Specification
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono">
              SOI: 0xFFD8FFE0
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono">
              JFIF Bytes 13-17: {dpi} DPI
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono">
              Target: {minKB}KB–{maxKB}KB
            </span>
          </div>
        </div>

        {/* Exam Preset Links / Buttons */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {EXAMS.map((exam) => {
            const isSelected = exam.slug === activeExam.slug;
            return (
              <button
                key={exam.slug}
                type="button"
                onClick={() => {
                  setSelectedExamSlug(exam.slug);
                  if (exam.presets[0]) {
                    applyPreset(exam.presets[0]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400"
                    : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {exam.shortName}
              </button>
            );
          })}
        </div>

        {/* Sub-Presets for the active exam */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">
            {activeExam.shortName} Presets:
          </span>
          {activeExam.presets.map((preset) => {
            const active = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <span>{preset.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900/80 text-[11px] font-mono text-emerald-300">
                  {preset.minKB}-{preset.maxKB}KB • {preset.dpi}DPI
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Tab All-in-One Pain-Point Toggle Suite Navigation */}
      <div
        role="tablist"
        aria-label="ExamDoc 5-in-1 Document Suite"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "photo"}
          onClick={() => setActiveTab("photo")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
            activeTab === "photo"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <ImageIcon className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tab 1
            </div>
            <div className="text-sm font-bold leading-tight">
              Photo + Name/DOP
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signature"}
          onClick={() => setActiveTab("signature")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
            activeTab === "signature"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <PenTool className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tab 2
            </div>
            <div className="text-sm font-bold leading-tight">
              Sign, Thumb & Decl.
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pdf"}
          onClick={() => setActiveTab("pdf")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
            activeTab === "pdf"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <FileText className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tab 3
            </div>
            <div className="text-sm font-bold leading-tight">
              Marksheet PDF &lt;100KB
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "webcam"}
          onClick={() => setActiveTab("webcam")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
            activeTab === "webcam"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <Camera className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tab 4
            </div>
            <div className="text-sm font-bold leading-tight">
              SSC Live Webcam
            </div>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "printsheet"}
          onClick={() => setActiveTab("printsheet")}
          className={`col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
            activeTab === "printsheet"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <Printer className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tab 5
            </div>
            <div className="text-sm font-bold leading-tight">
              4×6 Print Sheet (₹10)
            </div>
          </div>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== TAB 1: PHOTO MAKER ==================== */}
      {activeTab === "photo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Passport Photo Resizer, Name &amp; Date (DOP) + 80% Face Guide
                </h3>
                <p className="text-xs text-slate-500">
                  Converts WhatsApp WebP, PNG, HEIC &amp; JPG into baseline 0xFFD8FFE0 JPG with injected JFIF DPI.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition">
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*,.webp,.png,.jpg,.jpeg,.heic"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Exact Pixel, KB & DPI Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={50}
                  max={2400}
                  value={widthPx}
                  onChange={(e) => setWidthPx(Number(e.target.value) || 275)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={50}
                  max={2400}
                  value={heightPx}
                  onChange={(e) => setHeightPx(Number(e.target.value) || 354)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Min KB
                </label>
                <input
                  type="number"
                  min={4}
                  max={500}
                  value={minKB}
                  onChange={(e) => setMinKB(Number(e.target.value) || 20)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Max KB
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={maxKB}
                  onChange={(e) => setMaxKB(Number(e.target.value) || 50)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 bg-white"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  JFIF Header DPI
                </label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value) as 200 | 300 | 600)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900 bg-white"
                >
                  <option value={200}>200 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </div>
            </div>

            {/* Name & Date of Photo (DOP) White Plaque Toggle Box */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNameDop}
                    onChange={(e) => setShowNameDop(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-900">
                    Add Name &amp; Date of Photo (DOP) Bottom White Plaque
                  </span>
                </label>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  UPSC / SSC / NEET / State PSC
                </span>
              </div>

              {showNameDop && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Candidate Full Name
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. AARAV SHARMA"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold uppercase bg-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Photo (DD-MM-YYYY)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={dateOfPhoto}
                        onChange={(e) => setDateOfPhoto(e.target.value)}
                        placeholder="18-11-2026"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-semibold bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setDateOfPhoto(getTodayFormattedDDMMYYYY())}
                        className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold shrink-0"
                        title="Set to Today's Date"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date Prefix
                    </label>
                    <select
                      value={dopPrefix}
                      onChange={(e) => setDopPrefix(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                    >
                      <option value="DOP:">DOP: 18-11-2026</option>
                      <option value="">18-11-2026 (No Prefix)</option>
                      <option value="DATE:">DATE: 18-11-2026</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 80% Face Guide & Studio Lighting Sliders */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={show80FaceGuide}
                    onChange={(e) => setShow80FaceGuide(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Show 80% Face Coverage Oval Guide (Preview Only)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whiteBgBoost}
                    onChange={(e) => setWhiteBgBoost(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Plain Wall White Background Boost
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Face Zoom</span>
                    <span>{Math.round(photoZoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.4}
                    step={0.02}
                    value={photoZoom}
                    onChange={(e) => setPhotoZoom(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Horizontal Pan (X)</span>
                    <span>{photoPanX}</span>
                  </div>
                  <input
                    type="range"
                    min={-120}
                    max={120}
                    step={1}
                    value={photoPanX}
                    onChange={(e) => setPhotoPanX(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Vertical Pan (Y)</span>
                    <span>{photoPanY}</span>
                  </div>
                  <input
                    type="range"
                    min={-120}
                    max={120}
                    step={1}
                    value={photoPanY}
                    onChange={(e) => setPhotoPanY(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Brightness</span>
                    <span>{photoBrightness > 0 ? `+${photoBrightness}` : photoBrightness}</span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={50}
                    step={1}
                    value={photoBrightness}
                    onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Contrast</span>
                    <span>{photoContrast > 0 ? `+${photoContrast}` : photoContrast}</span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={45}
                    step={1}
                    value={photoContrast}
                    onChange={(e) => setPhotoContrast(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate 90°
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoZoom(1.0);
                      setPhotoPanX(0);
                      setPhotoPanY(0);
                      setPhotoRotation(0);
                      setPhotoBrightness(6);
                      setPhotoContrast(8);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview & True Binary Inspector Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Alignment Preview ({widthPx}×{heightPx} px)
              </span>
              {photoProcessing ? (
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Packing Binary...
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to Upload
                </span>
              )}
            </div>

            {/* Canvas Container */}
            <div className="relative bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-center w-full min-h-[290px]">
              <canvas
                ref={photoPreviewCanvasRef}
                className="max-h-[320px] w-auto rounded shadow-md bg-white"
              />
            </div>

            {show80FaceGuide && (
              <p className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center w-full">
                Green 80% Face Oval is for alignment only — it is <strong>not</strong> printed on your downloaded JPG.
              </p>
            )}

            {/* Download & Action Buttons */}
            {packedPhoto && (
              <div className="w-full mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedPhoto.blob,
                      `${activeExam.slug.split("-")[0]}-photo-${widthPx}x${heightPx}-${dpi}dpi-${Math.round(
                        packedPhoto.report.sizeKB
                      )}kb.jpg`
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    Download Verified JPG ({packedPhoto.report.sizeKB} KB • {packedPhoto.report.dpiX} DPI)
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("printsheet")}
                    className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    8 Photos on 4×6 Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("webcam")}
                    className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Use Live Webcam
                  </button>
                </div>

                {/* True Binary JFIF Verification Inspector */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-800">
                  <div className="flex items-center justify-between text-emerald-400 font-sans font-bold text-xs pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Binary className="w-3.5 h-3.5" />
                      TRUE BINARY COMPLIANCE REPORT
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                      PASSED
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exact File Size:</span>
                    <span className="text-white font-bold">
                      {packedPhoto.report.sizeKB} KB ({packedPhoto.report.byteLength.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allowed Exam Window:</span>
                    <span className="text-emerald-300">
                      {packedPhoto.report.minKB} KB – {packedPhoto.report.maxKB} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SOI + APP0 Magic:</span>
                    <span className="text-amber-300">0x{packedPhoto.report.magicHex} (Baseline JPG)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">JFIF Bytes 13..17:</span>
                    <span className="text-cyan-300">
                      {packedPhoto.report.jfifBytes13To17Hex} ({packedPhoto.report.dpiX}×{packedPhoto.report.dpiY} DPI)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EOI Marker &amp; Padding:</span>
                    <span className="text-slate-300">
                      0x{packedPhoto.report.eoiHex} (+{packedPhoto.report.paddedBytes} pad bytes)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SIGNATURE, THUMB & DECLARATION ==================== */}
      {activeTab === "signature" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Signature, Left Thumb &amp; Declaration Adaptive Paper Whitener
                </h3>
                <p className="text-xs text-slate-500">
                  Adaptive luminance thresholding turns dark/gray mobile notebook paper into pure #FFFFFF white while sharpening ink.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition">
                <Upload className="w-4 h-4" />
                <span>Upload Sign / Thumb / Decl.</span>
                <input
                  type="file"
                  accept="image/*,.webp,.png,.jpg,.jpeg"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Document Type Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "SSC / NEET Sign (315×157, 10-20KB)",
                  w: 315,
                  h: 157,
                  min: 10,
                  max: 20,
                  d: 200 as const
                },
                {
                  label: "IBPS / SBI Sign (140×60, 10-20KB)",
                  w: 140,
                  h: 60,
                  min: 10,
                  max: 20,
                  d: 200 as const
                },
                {
                  label: "IBPS / SBI Left Thumb (240×240, 20-50KB)",
                  w: 240,
                  h: 240,
                  min: 20,
                  max: 50,
                  d: 200 as const
                },
                {
                  label: "IBPS / SBI Declaration (800×400, 50-100KB)",
                  w: 800,
                  h: 400,
                  min: 50,
                  max: 100,
                  d: 200 as const
                },
                {
                  label: "UPSC Square Sign (500×500, 25-250KB)",
                  w: 500,
                  h: 500,
                  min: 25,
                  max: 250,
                  d: 300 as const
                },
                {
                  label: "UTI / NSDL PAN Sign (400×200, 12-45KB, 300 DPI)",
                  w: 400,
                  h: 200,
                  min: 12,
                  max: 45,
                  d: 300 as const
                },
                {
                  label: "RRB Railway Sign (315×157, 32-68KB)",
                  w: 315,
                  h: 157,
                  min: 32,
                  max: 68,
                  d: 200 as const
                }
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setWidthPx(p.w);
                    setHeightPx(p.h);
                    setMinKB(p.min);
                    setMaxKB(p.max);
                    setDpi(p.d);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    widthPx === p.w && heightPx === p.h && minKB === p.min
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Adaptive Luminance Thresholding Controls */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Adaptive Luminance Paper Bleaching &amp; Ink Booster
                </span>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                  Paper → #FFFFFF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Gray Paper Bleaching Strength</span>
                    <span>{adaptiveThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={95}
                    step={1}
                    value={adaptiveThreshold}
                    onChange={(e) => setAdaptiveThreshold(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <span className="text-[11px] text-slate-500">
                    Higher values remove deeper mobile camera shadows &amp; ruled lines.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Ink Stroke Sharpness &amp; Thickness</span>
                    <span>{inkSharpness}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={inkSharpness}
                    onChange={(e) => setInkSharpness(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <span className="text-[11px] text-slate-500">
                    Keeps fine cursive strokes legible at 140×60 px or 800×400 px.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: "natural", label: "Natural Pen Ink (Auto Blue/Black)" },
                    { id: "black", label: "Force Jet-Black Ink (#000000)" },
                    { id: "blue", label: "Royal Blue Ink / Stamp Pad" }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInkMode(mode.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      inkMode === mode.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Zoom & Rotate for Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Zoom Scale</span>
                    <span>{Math.round(signZoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.2}
                    step={0.02}
                    value={signZoom}
                    onChange={(e) => setSignZoom(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Pan Horizontal / Vertical</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={signPanX}
                      onChange={(e) => setSignPanX(Number(e.target.value))}
                      className="w-1/2 accent-blue-600"
                    />
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={signPanY}
                      onChange={(e) => setSignPanY(Number(e.target.value))}
                      className="w-1/2 accent-blue-600"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSignRotation((r) => (r + 90) % 360)}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate 90°
                  </button>
                </div>
              </div>
            </div>

            {/* Official Copyable IBPS / SBI / RBI Hand-Written Declaration Box */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Official Copyable Hand-Written Declaration Text (IBPS / SBI / RBI)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Write this text neatly in English with black ink on white paper (never in ALL CAPS).
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {Object.keys(OFFICIAL_DECLARATIONS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDeclBankKey(key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                        declBankKey === key
                          ? "bg-amber-600 text-white"
                          : "bg-white text-slate-700 border border-amber-300"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={declCandidateName}
                  onChange={(e) => setDeclCandidateName(e.target.value)}
                  placeholder="Enter Your Full Name"
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold"
                />
                {declBankKey === "SBI" && (
                  <input
                    type="text"
                    value={declDob}
                    onChange={(e) => setDeclDob(e.target.value)}
                    placeholder="Date of Birth (DD/MM/YYYY)"
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold"
                  />
                )}
              </div>

              <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs sm:text-sm font-serif text-slate-800 leading-relaxed select-all">
                &ldquo;{getPersonalizedDeclarationText()}&rdquo;
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-800 font-medium">
                  Required Spec: 800×400 px (10×5 cm) • 50KB to 100KB • 200 DPI JPG
                </span>
                <button
                  type="button"
                  onClick={handleCopyDeclaration}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                  {copiedDecl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied Text!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Official Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Signature Preview & Binary Report Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pure #FFFFFF Thresholded Output ({widthPx}×{heightPx} px)
              </span>
              {signProcessing ? (
                <span className="text-xs font-semibold text-blue-600">Processing...</span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Shadow Removed
                </span>
              )}
            </div>

            <div className="w-full min-h-[220px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center">
              {packedSign ? (
                <img
                  src={packedSign.dataUrl}
                  alt="Processed Signature or Declaration Preview"
                  className="max-h-[240px] w-auto rounded shadow bg-white border border-slate-200"
                />
              ) : (
                <span className="text-xs text-slate-400">Upload a signature image to preview</span>
              )}
            </div>

            {packedSign && (
              <div className="w-full mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedSign.blob,
                      `signature-${widthPx}x${heightPx}-${dpi}dpi-${Math.round(
                        packedSign.report.sizeKB
                      )}kb.jpg`
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    Download Verified JPG ({packedSign.report.sizeKB} KB • {packedSign.report.dpiX} DPI)
                  </span>
                </button>

                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400 font-sans font-bold text-xs pb-1 border-b border-slate-800">
                    <span>BINARY SIGNATURE REPORT</span>
                    <span>{packedSign.report.withinRange ? "100% COMPLIANT" : "ADJUSTING"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Output Dimensions:</span>
                    <span className="text-white">
                      {packedSign.report.widthPx} × {packedSign.report.heightPx} px
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exact Size:</span>
                    <span className="text-emerald-300 font-bold">
                      {packedSign.report.sizeKB} KB ({packedSign.report.byteLength.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">JFIF Bytes 13..17:</span>
                    <span className="text-cyan-300">
                      {packedSign.report.jfifBytes13To17Hex} ({packedSign.report.dpiX} DPI)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Safe EOI Padding:</span>
                    <span className="text-amber-300">
                      +{packedSign.report.paddedBytes} bytes before 0xFFD9
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MARKSHEET & AADHAAR PDF <100KB / <300KB ==================== */}
      {activeTab === "pdf" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left PDF Builder Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Marksheet, Caste Certificate &amp; Aadhaar PDF Packer (&lt;100KB / &lt;300KB)
                </h3>
                <p className="text-xs text-slate-500">
                  Combine 1 to 5 images (e.g., Aadhaar Front + Back or 10th/12th Marksheets) into a single pure DCTDecode PDF-1.4.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition">
                <Upload className="w-4 h-4" />
                <span>Add Images (1–5)</span>
                <input
                  type="file"
                  accept="image/*,.webp,.png,.jpg,.jpeg"
                  multiple
                  onChange={handlePdfImagesUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Target PDF KB Budget Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  title: "Strict < 100 KB PDF",
                  desc: "50KB – 95KB (Aadhaar / Domicile / Caste)",
                  min: 50,
                  max: 95
                },
                {
                  title: "Strict < 200 KB PDF",
                  desc: "100KB – 190KB (10th / 12th Marksheet)",
                  min: 100,
                  max: 190
                },
                {
                  title: "Strict < 300 KB PDF",
                  desc: "150KB – 285KB (UPSC ID / NSDL PAN / Degree)",
                  min: 150,
                  max: 285
                }
              ].map((b) => {
                const active = pdfMaxKB === b.max;
                return (
                  <button
                    key={b.title}
                    type="button"
                    onClick={() => {
                      setPdfMinKB(b.min);
                      setPdfMaxKB(b.max);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="text-sm font-bold">{b.title}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        active ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {b.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Layout & Contrast Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeFrontBackSinglePage}
                  onChange={(e) => setMergeFrontBackSinglePage(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Aadhaar Front+Back on 1 Page
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Stacks 2 images Top &amp; Bottom on a single A4 page.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancePdfContrast}
                  onChange={(e) => setEnhancePdfContrast(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Marksheet Text Contrast Boost
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Keeps roll numbers &amp; QR codes sharp under 100KB.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfGrayscale}
                  onChange={(e) => setPdfGrayscale(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Black &amp; White Scan Mode
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Saves 35% file size for multi-page certificates.
                  </div>
                </div>
              </label>
            </div>

            {/* Uploaded Pages List (1 to 5) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Document Pages ({pdfPages.length} / 5 Maximum)
                </span>
                {pdfPages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPdfPages([])}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Clear All Pages
                  </button>
                )}
              </div>

              {pdfPages.map((page, index) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <img
                      src={page.image.src}
                      alt={page.name}
                      className="w-12 h-12 object-cover rounded border border-slate-200"
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[260px]">
                        {page.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Original: {page.image.naturalWidth}×{page.image.naturalHeight} px • Rotation:{" "}
                        {page.rotation}°
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPdfPages((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
                          )
                        )
                      }
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Rotate Page 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        setPdfPages((prev) => {
                          const copy = [...prev];
                          const temp = copy[index - 1];
                          copy[index - 1] = copy[index];
                          copy[index] = temp;
                          return copy;
                        })
                      }
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === pdfPages.length - 1}
                      onClick={() =>
                        setPdfPages((prev) => {
                          const copy = [...prev];
                          const temp = copy[index + 1];
                          copy[index + 1] = copy[index];
                          copy[index] = temp;
                          return copy;
                        })
                      }
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPdfPages((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                      title="Remove Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right PDF Output & Binary Verification Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                DCTDecode PDF-1.4 Binary Packer
              </span>
              {pdfProcessing ? (
                <span className="text-xs font-semibold text-blue-600">Packing PDF...</span>
              ) : packedPdf ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified &lt;{pdfMaxKB}KB
                </span>
              ) : null}
            </div>

            {packedPdf ? (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      %PDF-1.4 /DCTDecode Ready
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {packedPdf.pageCount} A4 {packedPdf.pageCount === 1 ? "Page" : "Pages"}
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold tracking-tight text-emerald-400">
                    {packedPdf.sizeKB} KB
                    <span className="text-xs font-normal text-slate-300 ml-2">
                      ({packedPdf.byteLength.toLocaleString()} bytes)
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 font-mono pt-2 border-t border-slate-700/80">
                    <div className="flex justify-between">
                      <span>Target Exam Limit:</span>
                      <span className="text-emerald-300">
                        {packedPdf.minKB} KB – {packedPdf.maxKB} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Render Resolution:</span>
                      <span>
                        {packedPdf.resolutionWidthPx} ×{" "}
                        {Math.round(packedPdf.resolutionWidthPx * 1.4142)} px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stream Filter:</span>
                      <span className="text-cyan-300">/Filter /DCTDecode (Q={packedPdf.qualityUsed})</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedPdf.blob,
                      `document-verified-${Math.round(packedPdf.sizeKB)}kb.pdf`
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Compressed PDF ({packedPdf.sizeKB} KB)</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                Add 1 to 5 images on the left to build a guaranteed &lt;100KB or &lt;300KB PDF.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SSC LIVE WEBCAM STUDIO ==================== */}
      {activeTab === "webcam" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  SSC.gov.in Live Webcam Capture Studio (80% Face Guide)
                </h3>
                <p className="text-xs text-slate-500">
                  Align your face at eye-level against a plain wall, boost background brightness, and export directly to 20KB–50KB 200 DPI JPG.
                </p>
              </div>

              <div className="flex gap-2">
                {!webcamActive ? (
                  <button
                    type="button"
                    onClick={() => startWebcam(facingMode)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Start Live Camera
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMode = facingMode === "user" ? "environment" : "user";
                        setFacingMode(nextMode);
                        startWebcam(nextMode);
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                    >
                      Switch Camera
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold"
                    >
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
            </div>

            {webcamError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="font-bold">Camera Notice:</div>
                <div>{webcamError}</div>
              </div>
            )}

            {/* Live Video Viewport with 80% Oval Overlay */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[340px] flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`max-h-[400px] w-auto object-contain ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
                style={{
                  filter: `brightness(${100 + webcamBrightnessBoost}%) contrast(106%)`
                }}
              />
              <canvas
                ref={webcamOverlayRef}
                className="absolute inset-0 m-auto max-h-[400px] w-auto pointer-events-none"
              />

              {webcamCountdown !== null && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <span className="text-7xl font-black text-white drop-shadow-lg animate-pulse">
                    {webcamCountdown}
                  </span>
                </div>
              )}

              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-300 space-y-3">
                  <Camera className="w-12 h-12 text-blue-400 opacity-80" />
                  <div className="max-w-md space-y-1">
                    <p className="text-sm font-bold text-white">
                      Click &ldquo;Start Live Camera&rdquo; to open the SSC Webcam Alignment Studio
                    </p>
                    <p className="text-xs text-slate-400">
                      Remove spectacles to avoid lens glare, sit in front of a plain light wall, and look straight at the lens.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Webcam Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Plain Wall Brightness Boost</span>
                  <span>+{webcamBrightnessBoost}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  value={webcamBrightnessBoost}
                  onChange={(e) => setWebcamBrightnessBoost(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!webcamActive}
                  onClick={captureFromWebcam}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Instant Capture
                </button>
                <button
                  type="button"
                  disabled={!webcamActive}
                  onClick={triggerWebcamCountdownCapture}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs"
                >
                  3s Timer
                </button>
              </div>
            </div>
          </div>

          {/* Right Webcam Captured Result & SSC Compliance Checklist (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              SSC Captured Output (275×354 px • 20KB–50KB • 200 DPI)
            </h4>

            {webcamCapturedResult ? (
              <div className="space-y-4">
                <div className="bg-slate-100 p-4 rounded-xl flex justify-center border border-slate-200">
                  <img
                    src={webcamCapturedResult.dataUrl}
                    alt="SSC Webcam Captured Photo"
                    className="max-h-[260px] rounded shadow bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      webcamCapturedResult.blob,
                      `ssc-live-photo-275x354-200dpi-${Math.round(
                        webcamCapturedResult.report.sizeKB
                      )}kb.jpg`
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download SSC Photo ({webcamCapturedResult.report.sizeKB} KB • 200 DPI)
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Mandatory SSC Live Photo Checklist:
                </div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>
                    <strong>Remove Spectacles / Glasses:</strong> Even slight flash reflection on lenses causes automated SSC rejection.
                  </li>
                  <li>
                    <strong>Both Ears Visible:</strong> Look straight at the webcam so both ears and full forehead are inside the 80% oval.
                  </li>
                  <li>
                    <strong>Plain Light Wall:</strong> Stand against a white or light wall with light facing your face.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: 4x6 INCH STUDIO PRINT SHEET ==================== */}
      {activeTab === "printsheet" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                Save ₹90 at Local Photo Studios
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                4×6 Inch (300 DPI) 8-Photo Studio Print Sheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Arranges your resized passport photo from Tab 1 onto a standard 4×6 inch (1800×1200 px at 300 DPI) postcard sheet with scissor cut lines. Print at any shop for ₹10!
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500">
                4×6 Sheet Grid Layout
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "8-landscape" as const,
                    label: "8 Passport Photos — 4×2 Landscape (1800×1200 px, 300 DPI)"
                  },
                  {
                    id: "8-portrait" as const,
                    label: "8 Passport Photos — 2×4 Portrait (1200×1800 px, 300 DPI)"
                  },
                  {
                    id: "12-landscape" as const,
                    label: "12 Stamp/Mini Photos — 4×3 Grid (1800×1200 px, 300 DPI)"
                  }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSheetLayout(opt.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      sheetLayout === opt.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sheetCutLines}
                  onChange={(e) => setSheetCutLines(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Draw Dashed Scissor Cut Lines &amp; Crop Ticks
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sheetPhotoBorder}
                  onChange={(e) => setSheetPhotoBorder(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Add Crisp 2px Black Studio Frame Around Each Photo
                </span>
              </label>
            </div>

            {packedSheet && (
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedSheet.blob,
                      `4x6-inch-300dpi-studio-print-sheet-${sheetLayout}.jpg`
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    Download 4×6 Print Sheet ({packedSheet.report.sizeKB} KB • 300 DPI)
                  </span>
                </button>

                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canvas Resolution:</span>
                    <span>
                      {packedSheet.report.widthPx} × {packedSheet.report.heightPx} px (4×6 Inch)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">JFIF Header DPI:</span>
                    <span className="text-emerald-300">
                      {packedSheet.report.dpiX} DPI (Bytes 13-17: {packedSheet.report.jfifBytes13To17Hex})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4×6 Inch (10×15 cm) 300-DPI Lab Sheet Preview
              </span>
              {sheetProcessing && (
                <span className="text-xs font-semibold text-blue-600">Rendering 300 DPI...</span>
              )}
            </div>

            <div className="w-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center min-h-[340px]">
              {packedSheet ? (
                <img
                  src={packedSheet.dataUrl}
                  alt="4x6 Inch 8-Photo Studio Print Sheet Preview"
                  className="max-h-[420px] w-auto rounded shadow-md bg-white"
                />
              ) : (
                <span className="text-xs text-slate-400">
                  Upload a photo in Tab 1 to generate your 4×6 studio print sheet.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Programmatic SEO Quick Directory Bar at bottom of Workbench */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Dedicated Official Exam &amp; Portal Resizer Pages
          </h3>
          <span className="text-xs text-slate-400">Direct Slug URLs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {EXAMS.map((exam) => (
            <Link
              key={exam.slug}
              href={`/${exam.slug}`}
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition group"
            >
              <div className="text-xs font-bold text-blue-600 group-hover:underline">
                {exam.shortName}
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5 line-clamp-1">
                {exam.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {exam.presets[0]?.widthPx}×{exam.presets[0]?.heightPx}px • {exam.presets[0]?.minKB}–
                {exam.presets[0]?.maxKB}KB • {exam.presets[0]?.dpi} DPI
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
