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
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Wand2,
  ScanLine
} from "lucide-react";
import DocumentScannerStudio from "./DocumentScannerStudio";
import {
  EXAMS,
  ExamPreset,
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

type ExamCategoryFilter = "All" | "SSC & RRB" | "Banking" | "NEET & UPSC" | "PAN & PDF";

function getTodayFormattedDDMMYYYY(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ExamDocWorkbench({ initialExamSlug }: ExamDocWorkbenchProps) {
  const currentExam: ExamPreset =
    EXAMS.find((e) => e.slug === initialExamSlug) || EXAMS[0];

  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(currentExam.slug);
  const activeExam = EXAMS.find((e) => e.slug === selectedExamSlug) || EXAMS[0];

  const [activeTab, setActiveTab] = useState<ToolTabId>(activeExam.defaultTab);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    activeExam.presets[0]?.id || "ssc-cgl-photo"
  );

  // Shared Specification State
  const [widthPx, setWidthPx] = useState<number>(activeExam.presets[0]?.widthPx || 275);
  const [heightPx, setHeightPx] = useState<number>(activeExam.presets[0]?.heightPx || 354);
  const [minKB, setMinKB] = useState<number>(activeExam.presets[0]?.minKB || 20);
  const [maxKB, setMaxKB] = useState<number>(activeExam.presets[0]?.maxKB || 50);
  const [dpi, setDpi] = useState<200 | 300 | 600>(activeExam.presets[0]?.dpi || 200);

  // Collapsible Accordion States (collapsed by default on both mobile & desktop)
  const [showPhotoAdjustAccordion, setShowPhotoAdjustAccordion] = useState<boolean>(false);
  const [showSignAdjustAccordion, setShowSignAdjustAccordion] = useState<boolean>(false);
  const [showBinaryDetails, setShowBinaryDetails] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<ExamCategoryFilter>("All");

  // Tab 1: Photo Maker State
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>("Sample Demo Photo");
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
  const [packedPhoto, setPackedPhoto] = useState<PackedJpegResult | null>(null);
  const [cleanPhotoCanvas, setCleanPhotoCanvas] = useState<HTMLCanvasElement | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState<boolean>(false);
  const photoPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2: Signature, Thumb & Declaration State
  const [signImage, setSignImage] = useState<HTMLImageElement | null>(null);
  const [uploadedSignName, setUploadedSignName] = useState<string>("Sample Handwritten Signature");
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

  const applyPreset = useCallback((preset: DocumentPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTab(preset.tab);
    if (preset.tab === "pdf" || preset.tab === "scanner") {
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

  // Load demo samples on initial client mount
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

  // Re-render Tab 1 Photo Maker + Binary JPEG Packer
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
          borderWidthPx: 0
        });

        if (cancelled) return;
        setCleanPhotoCanvas(renderedCanvas);

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
    }, 100);

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
    show80FaceGuide
  ]);

  // Re-render Tab 2 Signature, Thumb & Declaration
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
    }, 100);

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

  // Re-render Tab 3 PDF Packer
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
    }, 150);

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

  // Re-render Tab 5 4x6 Inch Studio Print Sheet
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
    }, 150);

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
      rCtx.translate(550, 0);
      rCtx.scale(-1, 1);
    }
    rCtx.drawImage(video, sx, sy, cropW, cropH, 0, 0, 550, 708);
    rCtx.restore();

    const dataUrl = rawCaptureCanvas.toDataURL("image/png");
    const img = new Image();
    img.onload = async () => {
      setPhotoImage(img);
      setUploadedPhotoName("Webcam Live Capture");
      setPhotoBrightness(webcamBrightnessBoost);
      setWhiteBgBoost(true);

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
      setUploadedPhotoName(file.name);
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
      setUploadedSignName(file.name);
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

  const TABS: {
    id: ToolTabId;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "photo",
      title: "Photo Maker",
      subtitle: "Exact KB, Name & Date",
      icon: ImageIcon
    },
    {
      id: "signature",
      title: "Sign & Thumb",
      subtitle: "White Paper Enhancer",
      icon: PenTool
    },
    {
      id: "scanner",
      title: "Doc Scanner",
      subtitle: "Auto-Crop & Magic Color",
      icon: ScanLine
    },
    {
      id: "pdf",
      title: "PDF <100KB",
      subtitle: "Marksheet & Aadhaar",
      icon: FileText
    },
    {
      id: "webcam",
      title: "SSC Webcam",
      subtitle: "80% Face Guide",
      icon: Camera
    },
    {
      id: "printsheet",
      title: "4×6 Print",
      subtitle: "8 Photos • ₹10",
      icon: Printer
    }
  ];

  // Filter exams for the directory grid
  const filteredExams = EXAMS.filter((exam) => {
    if (categoryFilter === "All") return true;
    if (categoryFilter === "SSC & RRB") {
      return exam.slug.includes("ssc") || exam.slug.includes("rrb") || exam.slug.includes("wbpsc");
    }
    if (categoryFilter === "Banking") {
      return exam.category === "Banking & Insurance";
    }
    if (categoryFilter === "NEET & UPSC") {
      return (
        exam.category === "Medical & Engineering" ||
        exam.slug.includes("upsc")
      );
    }
    if (categoryFilter === "PAN & PDF") {
      return exam.category === "Identity & PAN" || exam.category === "PDF & Marksheet";
    }
    return true;
  });

  // Determine active sticky mobile download action
  const getStickyDownloadAction = (): {
    label: string;
    meta: string;
    onTrigger: () => void;
  } | null => {
    if (activeTab === "photo" && packedPhoto) {
      return {
        label: `Download Ready Photo (${packedPhoto.report.sizeKB} KB)`,
        meta: `${packedPhoto.report.widthPx}×${packedPhoto.report.heightPx} px • ${packedPhoto.report.dpiX} DPI Verified`,
        onTrigger: () =>
          downloadBlob(
            packedPhoto.blob,
            `${activeExam.slug.split("-")[0]}-photo-${widthPx}x${heightPx}-${dpi}dpi-${Math.round(
              packedPhoto.report.sizeKB
            )}kb.jpg`
          )
      };
    }
    if (activeTab === "signature" && packedSign) {
      return {
        label: `Download Ready Signature (${packedSign.report.sizeKB} KB)`,
        meta: `${packedSign.report.widthPx}×${packedSign.report.heightPx} px • ${packedSign.report.dpiX} DPI Verified`,
        onTrigger: () =>
          downloadBlob(
            packedSign.blob,
            `signature-${widthPx}x${heightPx}-${dpi}dpi-${Math.round(
              packedSign.report.sizeKB
            )}kb.jpg`
          )
      };
    }
    if (activeTab === "pdf" && packedPdf) {
      return {
        label: `Download Ready PDF (${packedPdf.sizeKB} KB)`,
        meta: `${packedPdf.pageCount} A4 ${packedPdf.pageCount === 1 ? "Page" : "Pages"} • Under ${packedPdf.maxKB} KB`,
        onTrigger: () =>
          downloadBlob(
            packedPdf.blob,
            `document-verified-${Math.round(packedPdf.sizeKB)}kb.pdf`
          )
      };
    }
    if (activeTab === "webcam" && webcamCapturedResult) {
      return {
        label: `Download SSC Photo (${webcamCapturedResult.report.sizeKB} KB)`,
        meta: `275×354 px • 200 DPI Verified`,
        onTrigger: () =>
          downloadBlob(
            webcamCapturedResult.blob,
            `ssc-live-photo-275x354-200dpi-${Math.round(
              webcamCapturedResult.report.sizeKB
            )}kb.jpg`
          )
      };
    }
    if (activeTab === "printsheet" && packedSheet) {
      return {
        label: `Download 4×6 Print Sheet (${packedSheet.report.sizeKB} KB)`,
        meta: `1800×1200 px • 300 DPI Lab Ready`,
        onTrigger: () =>
          downloadBlob(
            packedSheet.blob,
            `4x6-inch-300dpi-studio-print-sheet-${sheetLayout}.jpg`
          )
      };
    }
    return null;
  };

  const stickyDownload = getStickyDownloadAction();

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-4">
      {/* Mobile-First Exam Preset & Document Slot Selector Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-2xs border border-slate-200/90">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          {/* Step 1: Select Exam Dropdown */}
          <div className="lg:col-span-5">
            <label
              htmlFor="exam-selector"
              className="block text-xs font-bold uppercase tracking-wider text-blue-600 mb-1"
            >
              1. Choose Exam or Portal Preset
            </label>
            <div className="relative">
              <select
                id="exam-selector"
                value={selectedExamSlug}
                onChange={(e) => {
                  const nextSlug = e.target.value;
                  setSelectedExamSlug(nextSlug);
                  const found = EXAMS.find((ex) => ex.slug === nextSlug);
                  if (found && found.presets[0]) {
                    applyPreset(found.presets[0]);
                  }
                }}
                className="w-full min-h-[44px] appearance-none px-3.5 py-2 pr-9 rounded-xl border-2 border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:outline-none bg-slate-50/70 text-slate-900 font-bold text-base sm:text-sm transition cursor-pointer"
              >
                {EXAMS.map((exam) => (
                  <option key={exam.slug} value={exam.slug}>
                    {exam.shortName} — {exam.conductingBody}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Step 2: Document Type Toggle Pills */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Document Slot
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {activeTab === "pdf" || activeTab === "scanner"
                    ? `${pdfMinKB}–${pdfMaxKB} KB PDF`
                    : `${widthPx}×${heightPx} px • ${minKB}–${maxKB} KB • ${dpi} DPI`}
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeExam.presets.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="text-left">{preset.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${
                        isSelected
                          ? "bg-blue-700 text-blue-100"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {preset.minKB}–{preset.maxKB} KB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6-Tool Switcher: Swipeable Horizontal Pill Strip on Mobile, 6-Col Grid on Desktop */}
      <div
        role="tablist"
        aria-label="ExamDoc 6-in-1 Document Suite"
        className="flex lg:grid lg:grid-cols-6 gap-2 overflow-x-auto no-scrollbar flex-nowrap snap-x pb-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(t.id)}
              className={`snap-start shrink-0 min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200/90 hover:border-blue-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-xs sm:text-sm font-bold leading-tight whitespace-nowrap">
                  {t.title}
                </div>
                <div
                  className={`text-[11px] whitespace-nowrap ${
                    isActive ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {t.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="min-h-[44px] px-2 text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== TAB 1: PHOTO MAKER ==================== */}
      {activeTab === "photo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* 1. Prominent Upload Dropzone (Mobile Order 1, Desktop Left Col) */}
          <div className="order-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
            <label className="group cursor-pointer min-h-[110px] flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    Tap to Upload Passport Photo
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    JPG, PNG, WhatsApp WebP • Active:{" "}
                    <span className="font-semibold text-blue-700">{uploadedPhotoName}</span>
                  </div>
                </div>
              </div>
              <span className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition">
                Choose Photo
              </span>
              <input
                type="file"
                accept="image/*,.webp,.png,.jpg,.jpeg,.heic"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 2. Live Output Preview Card (Mobile Order 2, Desktop Right Col spanning rows) */}
          <div className="order-2 lg:col-span-5 lg:row-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Live Output Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Portal-Verified JPG • {dpi} DPI
                </p>
              </div>
              {photoProcessing ? (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </span>
              ) : packedPhoto ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {packedPhoto.report.sizeKB} KB Ready
                </span>
              ) : null}
            </div>

            {/* Compact Mobile Preview Canvas */}
            <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center w-full min-h-[190px] sm:min-h-[260px]">
              <canvas
                ref={photoPreviewCanvasRef}
                className="max-h-[200px] sm:max-h-[280px] w-auto rounded-lg shadow-sm bg-white border border-slate-200"
              />
            </div>

            {show80FaceGuide && (
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                Green 80% oval guide is for alignment only and will{" "}
                <strong className="text-slate-700">not</strong> appear on the downloaded photo.
              </p>
            )}

            {packedPhoto && (
              <div className="w-full mt-3.5 space-y-3">
                {/* 3 Stat Chips: File Size, Dimensions, DPI */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      File Size
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-600">
                      {packedPhoto.report.sizeKB} KB
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Dimensions
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {packedPhoto.report.widthPx}×{packedPhoto.report.heightPx}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Resolution
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-blue-600">
                      {packedPhoto.report.dpiX} DPI
                    </div>
                  </div>
                </div>

                {/* Primary Download CTA */}
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
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>
                    Download Ready Photo ({packedPhoto.report.sizeKB} KB)
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("printsheet")}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>4×6 Print Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("signature")}
                    className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <PenTool className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Next: Signature</span>
                  </button>
                </div>

                {/* Plain Trust Badge + Optional Technical Header Modal/Drawer */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBinaryDetails((v) => !v)}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs font-semibold"
                  >
                    <span className="flex items-center gap-1.5 text-left">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Portal-Verified JPG • {packedPhoto.report.dpiX} DPI</span>
                    </span>
                    <span className="underline text-[11px] shrink-0 ml-2">
                      {showBinaryDetails ? "Hide Header" : "Inspect Header"}
                    </span>
                  </button>

                  {showBinaryDetails && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Exact Bytes:</span>
                        <span>{packedPhoto.report.byteLength.toLocaleString()} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allowed Window:</span>
                        <span className="text-emerald-300">
                          {packedPhoto.report.minKB}–{packedPhoto.report.maxKB} KB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">JPEG Magic:</span>
                        <span className="text-amber-300">0x{packedPhoto.report.magicHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">DPI Header Bytes:</span>
                        <span className="text-cyan-300">
                          {packedPhoto.report.jfifBytes13To17Hex} ({packedPhoto.report.dpiX} DPI)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Print Candidate Name & Date (DOP) Card (Mobile Order 3, Desktop Left Col) */}
          <div className="order-3 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNameDop}
                  onChange={(e) => setShowNameDop(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-900">
                  Print Candidate Name &amp; Date (DOP) on Photo
                </span>
              </label>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                SSC / UPSC / NEET
              </span>
            </div>

            {showNameDop && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. AARAV SHARMA"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-base sm:text-sm font-bold uppercase bg-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Date of Photo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dateOfPhoto}
                      onChange={(e) => setDateOfPhoto(e.target.value)}
                      placeholder="18-11-2026"
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-base sm:text-sm font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setDateOfPhoto(getTodayFormattedDDMMYYYY())}
                      className="min-h-[44px] px-3 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 text-xs font-bold shrink-0"
                    >
                      Today
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Date Prefix
                  </label>
                  <select
                    value={dopPrefix}
                    onChange={(e) => setDopPrefix(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 py-2 rounded-xl border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                  >
                    <option value="DOP:">DOP: Date</option>
                    <option value="">Date Only</option>
                    <option value="DATE:">DATE: Date</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Collapsible "Adjust Crop, Zoom & Lighting" Accordion (Collapsed by default, Mobile Order 4, Desktop Left Col) */}
          <div className="order-4 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              type="button"
              aria-expanded={showPhotoAdjustAccordion}
              onClick={() => setShowPhotoAdjustAccordion((v) => !v)}
              className="w-full min-h-[48px] px-4 sm:px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Adjust Crop, Zoom, Lighting &amp; Custom Size</span>
              </span>
              {showPhotoAdjustAccordion ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {showPhotoAdjustAccordion && (
              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={show80FaceGuide}
                      onChange={(e) => setShow80FaceGuide(e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      80% Face Alignment Oval Guide
                    </span>
                  </label>

                  <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whiteBgBoost}
                      onChange={(e) => setWhiteBgBoost(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      Auto-Brighten Plain Wall
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Zoom Face</span>
                      <span className="text-blue-600 font-bold">{Math.round(photoZoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={2.4}
                      step={0.02}
                      value={photoZoom}
                      onChange={(e) => setPhotoZoom(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Move Left / Right</span>
                      <span className="text-slate-500">{photoPanX}</span>
                    </div>
                    <input
                      type="range"
                      min={-120}
                      max={120}
                      step={1}
                      value={photoPanX}
                      onChange={(e) => setPhotoPanX(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Move Up / Down</span>
                      <span className="text-slate-500">{photoPanY}</span>
                    </div>
                    <input
                      type="range"
                      min={-120}
                      max={120}
                      step={1}
                      value={photoPanY}
                      onChange={(e) => setPhotoPanY(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Brightness</span>
                      <span className="text-slate-500">
                        {photoBrightness > 0 ? `+${photoBrightness}` : photoBrightness}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={50}
                      step={1}
                      value={photoBrightness}
                      onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Contrast</span>
                      <span className="text-slate-500">
                        {photoContrast > 0 ? `+${photoContrast}` : photoContrast}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={45}
                      step={1}
                      value={photoContrast}
                      onChange={(e) => setPhotoContrast(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate
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
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Custom Dimensions & DPI Override */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={2400}
                      value={widthPx}
                      onChange={(e) => setWidthPx(Number(e.target.value) || 275)}
                      className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={2400}
                      value={heightPx}
                      onChange={(e) => setHeightPx(Number(e.target.value) || 354)}
                      className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Min KB
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={500}
                      value={minKB}
                      onChange={(e) => setMinKB(Number(e.target.value) || 20)}
                      className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Max KB
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={maxKB}
                      onChange={(e) => setMaxKB(Number(e.target.value) || 50)}
                      className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      DPI
                    </label>
                    <select
                      value={dpi}
                      onChange={(e) => setDpi(Number(e.target.value) as 200 | 300 | 600)}
                      className="w-full min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold bg-white"
                    >
                      <option value={200}>200 DPI</option>
                      <option value={300}>300 DPI</option>
                      <option value={600}>600 DPI</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: SIGNATURE, THUMB & DECLARATION ==================== */}
      {activeTab === "signature" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* 1. Prominent Upload Dropzone (Mobile Order 1, Desktop Left Col) */}
          <div className="order-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
            <label className="group cursor-pointer min-h-[110px] flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    Tap to Upload Signature, Thumb or Declaration
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    Turns gray notebook paper pure white • Active:{" "}
                    <span className="font-semibold text-blue-700">{uploadedSignName}</span>
                  </div>
                </div>
              </div>
              <span className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition">
                Choose Image
              </span>
              <input
                type="file"
                accept="image/*,.webp,.png,.jpg,.jpeg"
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 2. Live Output Preview Card (Mobile Order 2, Desktop Right Col) */}
          <div className="order-2 lg:col-span-5 lg:row-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Whitened Output Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Portal-Verified JPG • {dpi} DPI
                </p>
              </div>
              {signProcessing ? (
                <span className="text-xs font-bold text-blue-600">Cleaning...</span>
              ) : packedSign ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {packedSign.report.sizeKB} KB Ready
                </span>
              ) : null}
            </div>

            <div className="w-full min-h-[170px] sm:min-h-[210px] bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center">
              {packedSign ? (
                <img
                  src={packedSign.dataUrl}
                  alt="Processed Signature or Declaration Preview"
                  className="max-h-[180px] sm:max-h-[210px] w-auto rounded-lg shadow-sm bg-white border border-slate-200"
                />
              ) : (
                <span className="text-xs text-slate-400">Upload a signature image to preview</span>
              )}
            </div>

            {packedSign && (
              <div className="w-full mt-3.5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      File Size
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-600">
                      {packedSign.report.sizeKB} KB
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Dimensions
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {packedSign.report.widthPx}×{packedSign.report.heightPx}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Resolution
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-blue-600">
                      {packedSign.report.dpiX} DPI
                    </div>
                  </div>
                </div>

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
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>
                    Download Ready Signature ({packedSign.report.sizeKB} KB)
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Target Size Presets & Paper Whitener Controls (Mobile Order 3, Desktop Left Col) */}
          <div className="order-3 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Target Size Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "SSC / NEET Sign (10–20 KB)",
                    w: 315,
                    h: 157,
                    min: 10,
                    max: 20,
                    d: 200 as const
                  },
                  {
                    label: "IBPS / SBI Sign (140×60)",
                    w: 140,
                    h: 60,
                    min: 10,
                    max: 20,
                    d: 200 as const
                  },
                  {
                    label: "Left Thumb (240×240)",
                    w: 240,
                    h: 240,
                    min: 20,
                    max: 50,
                    d: 200 as const
                  },
                  {
                    label: "IBPS Declaration (800×400)",
                    w: 800,
                    h: 400,
                    min: 50,
                    max: 100,
                    d: 200 as const
                  },
                  {
                    label: "UPSC Sign (500×500)",
                    w: 500,
                    h: 500,
                    min: 25,
                    max: 250,
                    d: 300 as const
                  },
                  {
                    label: "PAN Sign (400×200, 600 DPI)",
                    w: 400,
                    h: 200,
                    min: 12,
                    max: 45,
                    d: 600 as const
                  },
                  {
                    label: "Railway RRB Sign (30–70 KB)",
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
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      widthPx === p.w && heightPx === p.h && minKB === p.min
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Paper Whitener &amp; Ink Enhancer</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Paper Whitening Strength</span>
                    <span className="text-blue-600 font-bold">{adaptiveThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={95}
                    step={1}
                    value={adaptiveThreshold}
                    onChange={(e) => setAdaptiveThreshold(Number(e.target.value))}
                    className="w-full h-6 accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Ink Darkness &amp; Sharpness</span>
                    <span className="text-blue-600 font-bold">{inkSharpness}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={inkSharpness}
                    onChange={(e) => setInkSharpness(Number(e.target.value))}
                    className="w-full h-6 accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "natural", label: "Auto Ink" },
                    { id: "black", label: "Black Ink" },
                    { id: "blue", label: "Blue Ink" }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInkMode(mode.id)}
                    className={`min-h-[44px] px-2.5 rounded-xl text-xs font-bold border transition ${
                      inkMode === mode.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Collapsible Crop & Official Declaration Accordion (Mobile Order 4, Desktop Left Col) */}
          <div className="order-4 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              type="button"
              aria-expanded={showSignAdjustAccordion}
              onClick={() => setShowSignAdjustAccordion((v) => !v)}
              className="w-full min-h-[48px] px-4 sm:px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Adjust Zoom, Rotate &amp; Copy IBPS/SBI Declaration Text</span>
              </span>
              {showSignAdjustAccordion ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {showSignAdjustAccordion && (
              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Zoom</span>
                      <span>{Math.round(signZoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={2.2}
                      step={0.02}
                      value={signZoom}
                      onChange={(e) => setSignZoom(Number(e.target.value))}
                      className="w-full h-6 accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Move Position</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={signPanX}
                        onChange={(e) => setSignPanX(Number(e.target.value))}
                        className="w-1/2 h-6 accent-blue-600"
                      />
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={signPanY}
                        onChange={(e) => setSignPanY(Number(e.target.value))}
                        className="w-1/2 h-6 accent-blue-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setSignRotation((r) => (r + 90) % 360)}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate 90°
                    </button>
                  </div>
                </div>

                {/* Official Copyable IBPS / SBI / RBI Hand-Written Declaration Box */}
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      Official Hand-Written Declaration Text (IBPS / SBI / RBI)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(OFFICIAL_DECLARATIONS).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDeclBankKey(key)}
                          className={`min-h-[44px] px-3 rounded-xl text-xs font-bold transition ${
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
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-300 bg-white text-base sm:text-sm font-semibold"
                    />
                    {declBankKey === "SBI" && (
                      <input
                        type="text"
                        value={declDob}
                        onChange={(e) => setDeclDob(e.target.value)}
                        placeholder="Date of Birth (DD/MM/YYYY)"
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-300 bg-white text-base sm:text-sm font-semibold"
                      />
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm font-serif text-slate-800 leading-relaxed select-all">
                    &ldquo;{getPersonalizedDeclarationText()}&rdquo;
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Required Size: 800×400 px • 50–100 KB • 200 DPI
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDeclaration}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      {copiedDecl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Text
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MARKSHEET & AADHAAR PDF <100KB / <300KB ==================== */}
      {activeTab === "pdf" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* 1. Prominent Upload Dropzone */}
          <div className="order-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <label className="group cursor-pointer min-h-[110px] flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50 transition">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    Tap to Add Marksheet or Aadhaar Photos (1–5)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Combines images into a single clear PDF under 100KB, 200KB, or 300KB
                  </div>
                </div>
              </div>
              <span className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition">
                Add Pages
              </span>
              <input
                type="file"
                accept="image/*,.webp,.png,.jpg,.jpeg"
                multiple
                onChange={handlePdfImagesUpload}
                className="hidden"
              />
            </label>

            {/* Target PDF KB Budget Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Choose Maximum PDF Size Limit
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    title: "Under 100 KB",
                    desc: "50–95 KB (Aadhaar / Caste)",
                    min: 50,
                    max: 95
                  },
                  {
                    title: "Under 200 KB",
                    desc: "100–190 KB (Marksheet)",
                    min: 100,
                    max: 190
                  },
                  {
                    title: "Under 300 KB",
                    desc: "150–285 KB (UPSC / PAN)",
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
                      className={`min-h-[48px] p-3 rounded-2xl border text-left transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="text-sm font-extrabold">{b.title}</div>
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
            </div>

            {/* Layout & Contrast Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeFrontBackSinglePage}
                  onChange={(e) => setMergeFrontBackSinglePage(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-800">
                  Front + Back on 1 Page
                </span>
              </label>

              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancePdfContrast}
                  onChange={(e) => setEnhancePdfContrast(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-800">
                  Sharpen Small Text
                </span>
              </label>

              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfGrayscale}
                  onChange={(e) => setPdfGrayscale(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-800">
                  Black &amp; White Scan
                </span>
              </label>
            </div>

            {/* Uploaded Pages List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Pages ({pdfPages.length} / 5)
                </span>
                {pdfPages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPdfPages([])}
                    className="min-h-[44px] px-2 text-xs text-red-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {pdfPages.map((page, index) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <img
                      src={page.image.src}
                      alt={page.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {page.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {page.image.naturalWidth}×{page.image.naturalHeight} px
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPdfPages((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
                          )
                        )
                      }
                      className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
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
                      className="min-h-[44px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"
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
                      className="min-h-[44px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPdfPages((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600"
                      title="Remove Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Right PDF Output Card */}
          <div className="order-2 lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Compressed PDF Output
                </h3>
                <p className="text-xs text-slate-500">
                  Portal-Verified PDF • Under {pdfMaxKB} KB
                </p>
              </div>
              {pdfProcessing ? (
                <span className="text-xs font-bold text-blue-600">Compressing...</span>
              ) : packedPdf ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {packedPdf.sizeKB} KB Ready
                </span>
              ) : null}
            </div>

            {packedPdf ? (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-emerald-50/50 border border-blue-200/80 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    {packedPdf.pageCount} A4 {packedPdf.pageCount === 1 ? "Page" : "Pages"} Merged
                  </div>

                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                    {packedPdf.sizeKB} <span className="text-lg text-emerald-600">KB</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Target Window: <strong>{packedPdf.minKB}–{packedPdf.maxKB} KB</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedPdf.blob,
                      `document-verified-${Math.round(packedPdf.sizeKB)}kb.pdf`
                    )
                  }
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>Download Ready PDF ({packedPdf.sizeKB} KB)</span>
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                Add 1 to 5 images to build a guaranteed &lt;100KB or &lt;300KB PDF.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SSC LIVE WEBCAM STUDIO ==================== */}
      {activeTab === "webcam" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  SSC Live Webcam Studio (80% Face Guide)
                </h3>
                <p className="text-xs text-slate-500">
                  Take a live eye-level photo against a plain wall and export directly to 20–50 KB JPG.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {!webcamActive ? (
                  <button
                    type="button"
                    onClick={() => startWebcam(facingMode)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-2xs"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera
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
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      Switch Camera
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {webcamError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="font-bold">Camera Access Required:</div>
                <div>{webcamError}</div>
              </div>
            )}

            <div className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[320px] flex items-center justify-center border border-slate-200">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`max-h-[340px] w-auto object-contain ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
                style={{
                  filter: `brightness(${100 + webcamBrightnessBoost}%) contrast(106%)`
                }}
              />
              <canvas
                ref={webcamOverlayRef}
                className="absolute inset-0 m-auto max-h-[340px] w-auto pointer-events-none"
              />

              {webcamCountdown !== null && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <span className="text-6xl font-black text-white drop-shadow-lg animate-pulse">
                    {webcamCountdown}
                  </span>
                </div>
              )}

              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 text-slate-300 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <p className="text-sm font-bold text-white">
                      Tap &ldquo;Start Camera&rdquo; to open the Live Studio
                    </p>
                    <p className="text-xs text-slate-400">
                      Remove spectacles to prevent lens glare and sit facing a light wall.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Wall Brightness Boost</span>
                  <span className="text-blue-600 font-bold">+{webcamBrightnessBoost}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  value={webcamBrightnessBoost}
                  onChange={(e) => setWebcamBrightnessBoost(Number(e.target.value))}
                  className="w-full h-6 accent-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!webcamActive}
                  onClick={captureFromWebcam}
                  className="flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  type="button"
                  disabled={!webcamActive}
                  onClick={triggerWebcamCountdownCapture}
                  className="min-h-[48px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs"
                >
                  3s Timer
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900">
              Captured SSC Photo (275×354 px • 20–50 KB)
            </h4>

            {webcamCapturedResult ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-2xl flex justify-center border border-slate-200">
                  <img
                    src={webcamCapturedResult.dataUrl}
                    alt="SSC Webcam Captured Photo"
                    className="max-h-[210px] rounded-lg shadow-sm bg-white"
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
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download SSC Photo ({webcamCapturedResult.report.sizeKB} KB)
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                  Quick Tips for 100% SSC Approval:
                </div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>
                    <strong>Remove Spectacles:</strong> Glare on glasses causes automated rejection on ssc.gov.in.
                  </li>
                  <li>
                    <strong>Both Ears Visible:</strong> Look straight ahead inside the green oval.
                  </li>
                  <li>
                    <strong>Plain Background:</strong> Sit against a plain white or light wall.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 5: 4x6 INCH STUDIO PRINT SHEET ==================== */}
      {activeTab === "printsheet" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          <div className="order-2 lg:order-1 lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                8 Photos • ₹10 Local Print
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                4×6 Inch (300 DPI) 8-Photo Print Sheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Arranges 8 copies of your passport photo onto a standard 4×6 inch postcard sheet for ₹10 printing at any photo shop.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Choose Sheet Layout
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "8-landscape" as const,
                    label: "8 Passport Photos — 4×2 Landscape (1800×1200 px)"
                  },
                  {
                    id: "8-portrait" as const,
                    label: "8 Passport Photos — 2×4 Portrait (1200×1800 px)"
                  },
                  {
                    id: "12-landscape" as const,
                    label: "12 Mini / Stamp Photos — 4×3 Grid (1800×1200 px)"
                  }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSheetLayout(opt.id)}
                    className={`min-h-[44px] p-3 rounded-xl border text-left text-xs font-bold transition ${
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

            <div className="space-y-1.5 pt-1">
              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sheetCutLines}
                  onChange={(e) => setSheetCutLines(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">
                  Show Scissor Cut Lines
                </span>
              </label>

              <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sheetPhotoBorder}
                  onChange={(e) => setSheetPhotoBorder(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">
                  Add Crisp Black Border Around Each Photo
                </span>
              </label>
            </div>

            {packedSheet && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      packedSheet.blob,
                      `4x6-inch-300dpi-studio-print-sheet-${sheetLayout}.jpg`
                    )
                  }
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>
                    Download 4×6 Print Sheet ({packedSheet.report.sizeKB} KB)
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4×6 Inch (10×15 cm) 300-DPI Print Preview
              </span>
              {sheetProcessing && (
                <span className="text-xs font-bold text-blue-600">Generating Sheet...</span>
              )}
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-center min-h-[200px] sm:min-h-[320px]">
              {packedSheet ? (
                <img
                  src={packedSheet.dataUrl}
                  alt="4x6 Inch 8-Photo Studio Print Sheet Preview"
                  className="max-h-[210px] sm:max-h-[380px] w-auto rounded-lg shadow-sm bg-white"
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

      {/* ==================== TAB 6: AI DOCUMENT & ID CARD SCANNER ==================== */}
      {activeTab === "scanner" && (
        <DocumentScannerStudio
          initialMode={
            selectedExamSlug.includes("id-card") ? "id-card" : "document"
          }
          initialBudget={
            pdfMaxKB <= 100 ? "100" : pdfMaxKB <= 200 ? "200" : "300"
          }
          onSendToResizer={(img, name, targetTab) => {
            if (targetTab === "photo") {
              setPhotoImage(img);
              setUploadedPhotoName(name);
              setPhotoZoom(1.0);
              setPhotoPanX(0);
              setPhotoPanY(0);
              setPhotoRotation(0);
              setActiveTab("photo");
            } else {
              setSignImage(img);
              setUploadedSignName(name);
              setSignZoom(1.0);
              setSignPanX(0);
              setSignPanY(0);
              setSignRotation(0);
              setActiveTab("signature");
            }
          }}
        />
      )}

      {/* Single "All 18 Official Exam Tools" Directory with Swipeable Category Filter Pills */}
      <div id="all-exams" className="pt-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3.5">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>All 18 Official Exam, Identity &amp; Scanner Tools</span>
          </h2>

          {/* Swipeable Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
            {(["All", "SSC & RRB", "Banking", "NEET & UPSC", "PAN & PDF"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredExams.map((exam) => (
            <Link
              key={exam.slug}
              href={`/${exam.slug}`}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition group flex flex-col justify-between min-h-[104px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-blue-600 group-hover:underline">
                    {exam.shortName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0">
                    {exam.dpi} DPI
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                  {exam.title}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>
                  {exam.widthPx}×{exam.heightPx} px
                </span>
                <span className="font-bold text-emerald-700">
                  {exam.minKB}–{exam.maxKB} KB ({exam.format})
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Sticky Bottom Download Bar (Thumb Zone) */}
      {stickyDownload && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 md:hidden shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{stickyDownload.meta}</span>
              </div>
              <div className="text-xs font-extrabold text-slate-900 truncate">
                {activeExam.shortName}
              </div>
            </div>
            <button
              type="button"
              onClick={stickyDownload.onTrigger}
              className="min-h-[48px] px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{stickyDownload.label}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
