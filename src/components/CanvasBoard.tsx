import { useEffect, useRef, useState, MouseEvent, WheelEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PixelData, UserProfile } from "../types";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Move, 
  Coins, 
  Check, 
  Wallet,
  Trash2, 
  Crosshair, 
  Layers,
  Sparkles,
  Eraser,
  Trophy,
  Shield,
  HelpCircle,
  HelpCircle as InfoIcon,
  Zap,
  MapPin,
  MoreVertical,
  X,
  ChevronsUpDown,
  Star,
  Share2,
  RotateCcw,
  RotateCw,
  Image as ImageIcon,
  Paintbrush,
  Palette,
  ShoppingCart,
  CreditCard,
  Globe,
  MessageSquare,
  Activity,
  Terminal as TerminalIcon,
  Compass,
  Info,
  Flame,
  Upload,
  Sliders
} from "lucide-react";

interface CanvasBoardProps {
  pixels: Record<string, PixelData>;
  currentAddress: string;
  userProfile: UserProfile | null;
  charges: number;
  maxCharges: number;
  hasGlowBrush?: boolean;
  onPaintPixels: (pixels: { x: number; y: number; color: string }[], currency: "FB" | "MOONYETIS" | "PX") => Promise<any>;
  onTriggerStore: () => void;
  onTriggerProfile: () => void;
  activeMenuOverlay?: string | null;
  onToggleMenuOverlay?: (overlay: string) => void;
  onlineCount?: number;
}

const PALETTE = [
  "transparent", // Correction Eraser
  "#e11d48", // Rose Red
  "#f43f5e", // Light Pink
  "#ea580c", // Orange
  "#f97316", // Coral
  "#eab308", // Yellow
  "#16a34a", // Green
  "#10b981", // Emerald
  "#0d9488", // Teal
  "#2563eb", // Blue
  "#3b82f6", // Sky Blue
  "#6366f1", // Indigo
  "#9333ea", // Purple
  "#db2777", // Hot Pink
  "#ffffff", // Snow White
  "#64748b", // Slate Gray
  "#030712", // Matte Black
];

// Stylized geographical continent coordinates (mesh boundary data)
const CONTINENTS = [
  // North America
  [
    { x: 100, y: 140 }, { x: 240, y: 110 }, { x: 310, y: 150 }, { x: 360, y: 130 },
    { x: 370, y: 220 }, { x: 340, y: 290 }, { x: 280, y: 350 }, { x: 230, y: 360 },
    { x: 250, y: 440 }, { x: 200, y: 450 }, { x: 190, y: 390 }, { x: 140, y: 330 },
    { x: 90, y: 240 }, { x: 100, y: 180 }
  ],
  // Greenland
  [
    { x: 380, y: 80 }, { x: 440, y: 60 }, { x: 470, y: 90 }, { x: 420, y: 120 }
  ],
  // South America
  [
    { x: 250, y: 440 }, { x: 290, y: 480 }, { x: 350, y: 530 }, { x: 365, y: 610 },
    { x: 330, y: 720 }, { x: 280, y: 830 }, { x: 255, y: 850 }, { x: 250, y: 810 },
    { x: 220, y: 650 }, { x: 195, y: 530 }, { x: 230, y: 460 }
  ],
  // Eurasia / Asia / Europe
  [
    { x: 400, y: 180 }, { x: 480, y: 140 }, { x: 580, y: 110 }, { x: 720, y: 80 },
    { x: 880, y: 100 }, { x: 960, y: 150 }, { x: 980, y: 240 }, { x: 920, y: 330 },
    { x: 840, y: 420 }, { x: 730, y: 450 }, { x: 670, y: 420 }, { x: 550, y: 370 },
    { x: 460, y: 330 }, { x: 390, y: 260 }
  ],
  // Africa
  [
    { x: 420, y: 440 }, { x: 490, y: 410 }, { x: 550, y: 440 }, { x: 610, y: 470 },
    { x: 625, y: 550 }, { x: 595, y: 670 }, { x: 545, y: 780 }, { x: 520, y: 800 },
    { x: 490, y: 730 }, { x: 460, y: 640 }, { x: 415, y: 530 }
  ],
  // Australia
  [
    { x: 780, y: 680 }, { x: 870, y: 690 }, { x: 920, y: 735 }, { x: 890, y: 810 },
    { x: 810, y: 820 }, { x: 760, y: 750 }
  ],
  // Antarctica
  [
    { x: 100, y: 920 }, { x: 900, y: 920 }, { x: 850, y: 960 }, { x: 155, y: 960 }
  ]
];

const PLACES_LABELS = [
  { text: "NORTH AMERICA", x: 210, y: 230 },
  { text: "SOUTH AMERICA", x: 280, y: 630 },
  { text: "EUROPE", x: 490, y: 230 },
  { text: "AFRICA", x: 500, y: 570 },
  { text: "ASIA", x: 760, y: 220 },
  { text: "AUSTRALIA", x: 840, y: 750 },
  { text: "ANTARCTICA", x: 480, y: 945 },
  { text: "PACIFIC OCEAN", x: 70, y: 540 },
  { text: "ATLANTIC OCEAN", x: 380, y: 480 },
  { text: "INDIAN OCEAN", x: 680, y: 630 }
];

const HOTSPOTS = [
  { id: "europe", x: 490, y: 230, label: "Eurasia Core", count: 8, isMajor: true },
  { id: "south-america", x: 280, y: 630, label: "South Delta", count: 1, isMajor: false },
  { id: "africa", x: 500, y: 570, label: "African Apex", count: 1, isMajor: false },
  { id: "asia-india", x: 680, y: 630, label: "Indian Ocean Hub", count: 3, isMajor: false }
];

export default function CanvasBoard({
  pixels,
  currentAddress,
  userProfile,
  charges,
  maxCharges,
  hasGlowBrush = false,
  onPaintPixels,
  onTriggerStore,
  onTriggerProfile,
  activeMenuOverlay = null,
  onToggleMenuOverlay,
  onlineCount = 142,
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blueprintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasCenteredRef = useRef(false);

  // Direct instant paint mode and drag separation refs
  const [directPaintMode, setDirectPaintMode] = useState<boolean>(false);
  const mouseDownCoords = useRef<{ x: number; y: number } | null>(null);
  const dragThresholdPassed = useRef<boolean>(false);

  // Viewport zoom level and translation offsets (Center initially on Europe/America mesh)
  const [zoom, setZoom] = useState<number>(1.8);
  const [panX, setPanX] = useState<number>(20);
  const [panY, setPanY] = useState<number>(20);

  const [selectedColor, setSelectedColor] = useState<string>("#9333ea"); // Default purple
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  useEffect(() => {
    if (charges >= maxCharges) {
      setSecondsLeft(0);
    } else if (secondsLeft === 0) {
      setSecondsLeft(10);
    }
  }, [charges, maxCharges]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (charges >= maxCharges) return 0;
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [charges, maxCharges]);

  // Coordinates warping teleporter
  const [teleportX, setTeleportX] = useState<number>(490);
  const [teleportY, setTeleportY] = useState<number>(230);
  const [showTeleporter, setShowTeleporter] = useState<boolean>(false);

  // Custom non-blocking visual Toast Notification system
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning"; key: number } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type, key: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Staging checkout basket
  const [stagedPixels, setStagedPixels] = useState<Record<string, string>>({}); // "x,y" : hexColor
  const chosenCurrency = "PX"; // Only Pixel Tokens (PX) used for drawing!
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visual helper toggles
  const [showStagingPanel, setShowStagingPanel] = useState(true);
  const [showGridLines, setShowGridLines] = useState(false);

  // Map background projection mode presets (fixed to voyager)
  const [mapMode, setMapMode] = useState<"tactical" | "satellite" | "voyager" | "classic">("voyager");

  // Persistent Favorites & Live Shares
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("wplace_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSharePopover, setShowSharePopover] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [customPalette, setCustomPalette] = useState<string[]>(() => {
    // Start with a copy of PALETTE
    return [...PALETTE];
  });
  const [showExtendedColors, setShowExtendedColors] = useState<boolean>(false);

  // 40 Beautiful unique color presets spanning the whole spectrum for the extended palette picker
  const EXTENDED_COLORS = [
    "#990000", "#d73a49", "#ff6b6b", "#ffccd5", // Reds & Pinks
    "#db2777", "#f472b6", "#ffc4d6", "#4a0404", // Magentas / Dark Maroon
    "#7c2d12", "#ea580c", "#ff9233", "#ffd166", // Browns & Oranges
    "#eab308", "#fef08a", "#fef9c3", "#3f2d1e", // Yellows & Dark Wood
    "#064e3b", "#22c55e", "#4ade80", "#a7f3d0", // Greens
    "#0891b2", "#22d3ee", "#e0f7fa", "#004b49", // Cyans & Dark Teal
    "#1e3a8a", "#2563eb", "#60a5fa", "#d0e1fd", // Blues
    "#4c1d95", "#8b5cf6", "#c084fc", "#f3e8ff", // Purples
    "#2d3748", "#4a5568", "#718096", "#a0aec0", // Slate & Dark Grays
    "#1a202c", "#ffffff", "#e2e8f0", "#ebdcb9"  // Black, White, Soft Sand
  ];

  const handleSelectExtendedColor = (colorHex: string) => {
    const withoutTransparent = customPalette.filter(c => c !== "transparent" && c !== colorHex);
    // Add the selected color as the first option after transparent (eraser) and slice to keep size identical
    const newSubset = [colorHex, ...withoutTransparent].slice(0, PALETTE.length - 1);
    const updated = ["transparent", ...newSubset];
    setCustomPalette(updated);
    setSelectedColor(colorHex);

    if (selectedPixel) {
      const key = `${selectedPixel.x},${selectedPixel.y}`;
      setStagedPixels(prev => ({
        ...prev,
        [key]: colorHex
      }));
    }
    triggerBeep(784, "sine", 0.05);
    setShowExtendedColors(false);
  };

  // Premium Image Importer state
  const [showImgImporter, setShowImgImporter] = useState<boolean>(false);
  const [uploadedImgSrc, setUploadedImgSrc] = useState<string | null>(null);
  const [importResolution, setImportResolution] = useState<number>(96); // default 96x96
  const [useSmoothing, setUseSmoothing] = useState<boolean>(false); // default crisp (nearest-neighbor)
  const [useOriginalColors, setUseOriginalColors] = useState<boolean>(true); // default true so uploaded images look identical
  const [blueprintWidth, setBlueprintWidth] = useState<number>(96);
  const [blueprintHeight, setBlueprintHeight] = useState<number>(96);
  const [pixelatedBlueprint, setPixelatedBlueprint] = useState<{ x: number; y: number; color: string }[] | null>(null);
  const [isAnalyzingImg, setIsAnalyzingImg] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Helper cost function based on dimensions starting from 16x16 to 96x96
  const getPremiumFee = (res: number) => {
    switch (res) {
      case 16: return 20;
      case 32: return 40;
      case 48: return 60;
      case 64: return 80;
      case 96: return 120;
      default: return 120;
    }
  };

  // Convert hex color to rgb
  const hexToRgb = (hex: string) => {
    if (hex === "transparent") return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Get closest palette color using cached fast math precomputations to avoid layout thread freeze
  const getClosestPaletteColorFast = (
    r: number,
    g: number,
    b: number,
    a: number,
    parsedPalette: { hex: string; r: number; g: number; b: number }[]
  ) => {
    if (a < 80) return "transparent"; // map to transparent if low alpha

    let minDistance = Infinity;
    let closestColor = "#ffffff";

    for (let i = 0; i < parsedPalette.length; i++) {
      const item = parsedPalette[i];
      const rmean = (r + item.r) / 2;
      const dr = r - item.r;
      const dg = g - item.g;
      const db = b - item.b;
      // Perceptually weighted redmean color distance formula
      const dist = (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db;
      if (dist < minDistance) {
        minDistance = dist;
        closestColor = item.hex;
      }
    }
    return closestColor;
  };

  // Process selected image and build pixel-art blueprint list
  const runPixelizer = (src: string, resolution: number, smoothing: boolean, origColors: boolean) => {
    setIsAnalyzingImg(true);
    setImportStatus("Analizando imagen y calculando mapeo de color...");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const originalWidth = img.width || 1;
        const originalHeight = img.height || 1;

        let targetWidth = resolution;
        let targetHeight = resolution;

        // Force keeping the exact original aspect ratio relative to the target maximum bounding box
        if (originalWidth > originalHeight) {
          targetHeight = Math.max(4, Math.round((originalHeight / originalWidth) * resolution));
        } else {
          targetWidth = Math.max(4, Math.round((originalWidth / originalHeight) * resolution));
        }

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) {
          throw new Error("Could not construct 2D canvas context");
        }

        // Configure smoothing
        tempCtx.imageSmoothingEnabled = smoothing;
        if (smoothing) {
          tempCtx.imageSmoothingQuality = "high";
        }

        tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imgData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        // Base coordinates: anchor centered on currently selected pixel, or default center (490, 230)
        const anchorX = selectedPixel ? selectedPixel.x : 490;
        const anchorY = selectedPixel ? selectedPixel.y : 230;

        const halfWidth = Math.floor(targetWidth / 2);
        const halfHeight = Math.floor(targetHeight / 2);
        const blueprintArr: { x: number; y: number; color: string }[] = [];

        // Precompute a rich combined selection of standard and extended colors as RGB values to optimize hot path and prevent distortion
        const parsedPalette: { hex: string; r: number; g: number; b: number }[] = [];
        const uniqueColors = Array.from(new Set([...PALETTE, ...EXTENDED_COLORS])).filter(c => c !== "transparent");
        uniqueColors.forEach((hex) => {
          const rgb = hexToRgb(hex);
          if (rgb) {
            parsedPalette.push({ hex, r: rgb.r, g: rgb.g, b: rgb.b });
          }
        });

        for (let y = 0; y < targetHeight; y++) {
          for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Compute board coordinates relative to anchor so it's centered
            const boardX = anchorX + (x - halfWidth);
            const boardY = anchorY + (y - halfHeight);

            // Double check bounds of the infinite canvas map just in case
            if (boardX >= 0 && boardX <= 1000 && boardY >= 0 && boardY <= 1000) {
              let finalColor: string;
              if (origColors) {
                if (a < 80) {
                  finalColor = "transparent";
                } else {
                  const toHexVal = (val: number) => {
                    const h = Math.max(0, Math.min(255, Math.round(val))).toString(16);
                    return h.length === 1 ? "0" + h : h;
                  };
                  finalColor = `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`;
                }
              } else {
                finalColor = getClosestPaletteColorFast(r, g, b, a, parsedPalette);
              }

              blueprintArr.push({
                x: boardX,
                y: boardY,
                color: finalColor
              });
            } else {
              blueprintArr.push({
                x: boardX,
                y: boardY,
                color: "transparent"
              });
            }
          }
        }

        setBlueprintWidth(targetWidth);
        setBlueprintHeight(targetHeight);
        setPixelatedBlueprint(blueprintArr);
        setImportStatus(null);
      } catch (err: any) {
        console.error(err);
        setImportStatus("Error al procesar la imagen: " + err.message);
      } finally {
        setIsAnalyzingImg(false);
      }
    };
    img.onerror = () => {
      setImportStatus("Error al cargar la imagen seleccionada.");
      setIsAnalyzingImg(false);
    };
  };

  const handleImgFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const srcResult = event.target?.result as string;
      setUploadedImgSrc(srcResult);
      runPixelizer(srcResult, importResolution, useSmoothing, useOriginalColors);
    };
    reader.readAsDataURL(file);
    triggerBeep(587.33, "sine", 0.05);
  };

  // Re-run conversion when resolution, smoothing or color mappings change
  useEffect(() => {
    if (uploadedImgSrc) {
      runPixelizer(uploadedImgSrc, importResolution, useSmoothing, useOriginalColors);
    }
  }, [importResolution, useSmoothing, useOriginalColors]);

  // Draw pixelated blueprint onto preview canvas
  useEffect(() => {
    const canvas = blueprintCanvasRef.current;
    if (!canvas || !pixelatedBlueprint || pixelatedBlueprint.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = blueprintWidth;
    const h = blueprintHeight;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Convert colors & details to exact pixels
    for (let i = 0; i < pixelatedBlueprint.length; i++) {
      const p = pixelatedBlueprint[i];
      const idx = i * 4;
      if (!p || p.color === "transparent") {
        // Draw standard checkerboard transparent look
        const pixelX = i % w;
        const pixelY = Math.floor(i / w);
        const isChSquare = (Math.floor(pixelX / 4) + Math.floor(pixelY / 4)) % 2 === 0;
        const colorVal = isChSquare ? 245 : 255;
        data[idx] = colorVal;
        data[idx + 1] = colorVal;
        data[idx + 2] = colorVal;
        data[idx + 3] = 255;
      } else {
        const rgb = hexToRgb(p.color);
        if (rgb) {
          data[idx] = rgb.r;
          data[idx + 1] = rgb.g;
          data[idx + 2] = rgb.b;
          data[idx + 3] = 255;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [pixelatedBlueprint, blueprintWidth, blueprintHeight]);

  const handleApplyPremiumBlueprint = async () => {
    if (!pixelatedBlueprint || pixelatedBlueprint.length === 0) return;
    const fee = getPremiumFee(importResolution);

    if (!currentAddress) {
      showToast("⚠️ Por favor conecta tu billetera primero para realizar transacciones premium.", "warning");
      return;
    }

    if (!userProfile) {
      showToast("⚠️ Cargando datos de perfil, inténtalo de nuevo.", "info");
      return;
    }

    const currentBalance = userProfile.pixel_tokens_balance || 0;
    if (currentBalance < fee) {
      showToast(`❌ Saldo Insuficiente. Esta conversión premium de ${importResolution}x${importResolution} requiere una tasa algorítmica de ${fee} PX.\n\nTu saldo actual: ${currentBalance} PX.\n\nSugerencia: Ve a la tienda para reclamar PX en el Grifo (Faucet) de pruebas gratis, o intercambia tus FB/MOONYETIS en el panel de intercambio de forma gratuita.`, "error");
      return;
    }

    try {
      setImportStatus("Autorizando transacción premium en el nodo...");
      triggerBeep(880, "sine", 0.1);

      // Call the buy-item endpoint to lock and deduct the fee on server db!
      const buyResponse = await fetch("/api/wallet/buy-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: currentAddress,
          itemId: `premium_pixel_importer_${importResolution}x${importResolution}`,
          costPx: fee
        })
      });

      const buyRes = await buyResponse.json();
      if (!buyResponse.ok) {
        throw new Error(buyRes.error || "La transacción de pago premium falló.");
      }

      // Add all converted pixel array directly to staged pixels!
      const nextStaged = { ...stagedPixels };
      let loadedCount = 0;
      pixelatedBlueprint.forEach(p => {
        if (p.color !== "transparent") {
          const key = `${p.x},${p.y}`;
          nextStaged[key] = p.color;
          loadedCount++;
        }
      });

      // Automatically add the imported image colors to custom palette so they can easily edit them if they want!
      const importedColors = Array.from(new Set(pixelatedBlueprint.map(p => p.color))).filter(c => c !== "transparent" && c !== "rgba(255, 255, 255, 0.4)");
      let updatedPalette = [...customPalette];
      importedColors.forEach(colorHex => {
        if (!updatedPalette.includes(colorHex)) {
          // Prepend right after "transparent"
          updatedPalette.splice(1, 0, colorHex);
        }
      });
      // Keep it reasonable, say max 24 colors or custom palette length
      if (updatedPalette.length > 28) {
        updatedPalette = [
          "transparent",
          ...Array.from(new Set(updatedPalette.filter(c => c !== "transparent"))).slice(0, 27)
        ];
      }
      setCustomPalette(updatedPalette);

      setStagedPixels(nextStaged);
      triggerBeep(987.77, "sine", 0.15);
      setTimeout(() => triggerBeep(1318.51, "sine", 0.2), 100);

      showToast(`⭐ ¡Conversión exitosa!\n\nSe ha descontado la tasa premium de ${fee} PX de tu cuenta Fractal.\n\nSe han plasmado ${loadedCount} píxeles de color en tu bandeja de borrador. ¡Presiona "Pintar" para estampar la imagen permanentemente en el canvas!`, "success");
      
      // Close the modal and clean up
      setShowImgImporter(false);
      setUploadedImgSrc(null);
      setPixelatedBlueprint(null);
      setImportStatus(null);

      // Force high-level updates if app/parent passed them
      if (onToggleMenuOverlay) {
        // This will update indicators
      }
    } catch (err: any) {
      showToast(err.message || "Error al descontar saldo premium.", "error");
      setImportStatus(null);
    }
  };

  const handleToggleFavorite = (x: number, y: number) => {
    const key = `${x},${y}`;
    const updated = favorites.includes(key)
      ? favorites.filter((k) => k !== key)
      : [...favorites, key];
    setFavorites(updated);
    try {
      localStorage.setItem("wplace_favorites", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to commit favorites", err);
    }
    triggerBeep(updated.includes(key) ? 587.33 : 349.23, "sine", 0.08);
  };
  
  // High-fidelity preloaded tiled canvases
  const [tacticalCanvas, setTacticalCanvas] = useState<HTMLCanvasElement | null>(null);
  const [satelliteCanvas, setSatelliteCanvas] = useState<HTMLCanvasElement | null>(null);
  const [voyagerCanvas, setVoyagerCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loadingMaps, setLoadingMaps] = useState<boolean>(true);

  // Sound client feedback trigger beep
  const triggerBeep = (freq = 440, type: OscillatorType = "sine", duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Background map tiled GIS loading sequence (Zoom level 2, 4x4 grids)
  useEffect(() => {
    let pending = 3;

    const createPreloadedCanvas = (
      name: string,
      urlTemplate: (x: number, y: number) => string,
      postProcess: (cv: HTMLCanvasElement) => HTMLCanvasElement,
      setter: (cv: HTMLCanvasElement) => void
    ) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 1000;
      offscreen.height = 1000;
      const octx = offscreen.getContext("2d");
      if (!octx) return;

      let loadedCount = 0;
      const totalTiles = 16;
      const imgGrid: HTMLImageElement[][] = Array(4).fill(null).map(() => Array(4).fill(null));

      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = urlTemplate(x, y);
          img.onload = () => {
            imgGrid[y][x] = img;
            loadedCount++;
            if (loadedCount === totalTiles) {
              // Draw 4x4 tiles side-by-side
              for (let ry = 0; ry < 4; ry++) {
                for (let rx = 0; rx < 4; rx++) {
                  if (imgGrid[ry][rx]) {
                    octx.drawImage(imgGrid[ry][rx], rx * 250, ry * 250, 250, 250);
                  }
                }
              }
              try {
                const processed = postProcess(offscreen);
                setter(processed);
              } catch (e) {
                setter(offscreen);
              }
              pending--;
              if (pending === 0) setLoadingMaps(false);
            }
          };
          img.onerror = () => {
            console.warn(`Tile failed to load in ${name} set: x=${x}, y=${y}`);
            loadedCount++;
            if (loadedCount === totalTiles) {
              pending--;
              if (pending === 0) setLoadingMaps(false);
            }
          };
        }
      }
    };

    // 1. Pristine Light Minimalist (CartoDB Positron)
    createPreloadedCanvas(
      "Pristine Light",
      (x, y) => `https://basemaps.cartocdn.com/light_all/2/${x}/${y}.png`,
      (cv) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(cv, 0, 0);
          ctx.fillStyle = "rgba(99, 102, 241, 0.01)"; // ultra-faint cozy purple tint
          ctx.fillRect(0, 0, 1000, 1000);
        }
        return canvas;
      },
      setTacticalCanvas
    );

    // 2. Real Earth Satellite (photographic projection)
    createPreloadedCanvas(
      "Satellite NASA/Esri",
      (x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/2/${y}/${x}`,
      (cv) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(cv, 0, 0);
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)"; // Soft light veil overlay suitable for nice visibility
          ctx.fillRect(0, 0, 1000, 1000);
        }
        return canvas;
      },
      setSatelliteCanvas
    );

    // 3. Voyager Geopolitical colorful map
    createPreloadedCanvas(
      "Voyager Geopolitical",
      (x, y) => `https://basemaps.cartocdn.com/rastertiles/voyager/2/${x}/${y}.png`,
      (cv) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(cv, 0, 0);
          ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
          ctx.fillRect(0, 0, 1000, 1000);
        }
        return canvas;
      },
      setVoyagerCanvas
    );
  }, []);

  // Panning drag interactions
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const canvasWidth = 1000;
  const canvasHeight = 1000;

  // Initial scaling on container mount to center the entire vector world map visually
  useEffect(() => {
    const handleCenterViewport = () => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Center with a lovely medium zoom starting point (e.g. 1.8x) on load
      if (!hasCenteredRef.current) {
        const targetZoom = 1.8;
        setZoom(targetZoom);
        setPanX((width - 1000 * targetZoom) / 2);
        setPanY((height - 1000 * targetZoom) / 2);
        hasCenteredRef.current = true;
      }
    };

    const timer = setTimeout(handleCenterViewport, 100);
    window.addEventListener("resize", handleCenterViewport);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleCenterViewport);
    };
  }, []);

  // Performance-optimized native wheel event listener that completely bypasses
  // Chrome/Safari "passive listener" scroll delays and enables ultra-fluid zoom transitions.
  const stateRef = useRef({ zoom, panX, panY });
  const wheelRafRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = { zoom, panX, panY };
  }, [zoom, panX, panY]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const { zoom: curZoom, panX: curPanX, panY: curPanY } = stateRef.current;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const pixelX = (mouseX - curPanX) / curZoom;
      const pixelY = (mouseY - curPanY) / curZoom;

      const delta = -e.deltaY;
      
      // Compute delta-proportional speed multiplier (feels amazing on both trackpads and mouse-wheels)
      const intensity = Math.min(Math.abs(delta) / 100, 2.0);
      const factor = 1 + 0.12 * intensity;

      let newZoom = curZoom;
      if (delta > 0) {
        newZoom = curZoom * factor;
      } else {
        newZoom = curZoom / factor;
      }

      if (newZoom > 120) newZoom = 120;
      if (newZoom < 0.4) newZoom = 0.4;
      newZoom = Number(newZoom.toFixed(2));

      const newPanX = mouseX - pixelX * newZoom;
      const newPanY = mouseY - pixelY * newZoom;

      if (wheelRafRef.current) {
        cancelAnimationFrame(wheelRafRef.current);
      }

      wheelRafRef.current = requestAnimationFrame(() => {
        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelRafRef.current) {
        cancelAnimationFrame(wheelRafRef.current);
      }
    };
  }, []);

  // Discretize zoom level to run the heavy canvas drawing logic ONLY when crossing major thresholds.
  // This achieves flawless 60+ FPS zoom performance, offloading continuous scaling to the GPU via CSS!
  const getDiscretizedZoom = (z: number) => {
    if (z < 3.0) return 1.0;
    if (z < 6.0) return 4.0;
    if (z < 12.0) return 8.0;
    if (z < 24.0) return 16.0;
    return 32.0;
  };
  const drawZoom = getDiscretizedZoom(zoom);

  // Canvas drawing effect handles layers of geography and painted inputs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Force exact crisp pixel-art styling without any browser blur smoothing
    ctx.imageSmoothingEnabled = false;

    // 1. Draw solid pristine light ocean background
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw map layer (Tactical / Satellite / Voyager / Classic hand-drawn outline fallback)
    let mapDrawSuccess = false;

    if (drawZoom < 3.0) {
      if (mapMode === "tactical" && tacticalCanvas) {
        ctx.drawImage(tacticalCanvas, 0, 0, canvas.width, canvas.height);
        mapDrawSuccess = true;
      } else if (mapMode === "satellite" && satelliteCanvas) {
        ctx.drawImage(satelliteCanvas, 0, 0, canvas.width, canvas.height);
        mapDrawSuccess = true;
      } else if (mapMode === "voyager" && voyagerCanvas) {
        ctx.drawImage(voyagerCanvas, 0, 0, canvas.width, canvas.height);
        mapDrawSuccess = true;
      }

      // Classic low-polygon vector lines as fallback or explicit choice
      if (!mapDrawSuccess || mapMode === "classic") {
        CONTINENTS.forEach((poly) => {
          // Soft drop shadow for classic islands
          ctx.shadowColor = "rgba(15, 23, 42, 0.05)";
          ctx.shadowBlur = 4;

          ctx.fillStyle = "#f1f5f9"; // Soft modern silver terrestrial land
          ctx.strokeStyle = "rgba(99, 102, 241, 0.3)"; // Radiant continent coast lines
          ctx.lineWidth = 1;

          ctx.beginPath();
          if (poly.length > 0) {
            ctx.moveTo(poly[0].x, poly[0].y);
            poly.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Reset shadows
          ctx.shadowBlur = 0;
        });
      }

      // 3. Draw blueprint style coordinates lat/long lines (extremely sleek overlay in light gray)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.07)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // 4. Draw labels for place identification
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "rgba(71, 85, 105, 0.55)"; // Sleek translucent labels
      PLACES_LABELS.forEach((lbl) => {
        ctx.fillText(lbl.text, lbl.x, lbl.y);
      });
    }

    // 6. Draw all committed pixels on top
    if (drawZoom >= 3.0) {
      Object.keys(pixels).forEach((key) => {
        const p = pixels[key];
        if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
          // If color is transparent/deleted, we let the continent show or paint ocean
          if (p.color === "transparent") {
            return; // Skip drawing transparent ones to allow erasure
          }
          ctx.fillStyle = p.color;
          // Clean solid 1x1 contiguous pixel blocks for seamless wplace-style art
          ctx.fillRect(p.x, p.y, 1, 1);
        }
      });

      // 7. Draw staged pixels currently in staging basket as neat solid rectangles (no subpixel stroke)
      Object.keys(stagedPixels).forEach((key) => {
        const [sx, sy] = key.split(",").map(Number);
        const col = stagedPixels[key];
        if (col === "transparent") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx, sy, 1, 1);
        } else {
          ctx.fillStyle = col;
          ctx.fillRect(sx, sy, 1, 1);
        }
      });
    }

    // 8. Selected pixel target cursor highlight is rendered as a clean, high-contrast, non-bleeding HTML overlay on top!
  }, [pixels, stagedPixels, selectedPixel, selectedColor, drawZoom, mapMode, tacticalCanvas, satelliteCanvas, voyagerCanvas]);

  // Viewport zoom operations
  const handleZoomOffset = (direction: "in" | "out") => {
    const container = containerRef.current;
    if (!container) return;

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    const pixelX = (centerX - panX) / zoom;
    const pixelY = (centerY - panY) / zoom;

    let newZoom = zoom;
    if (direction === "in") {
      if (zoom < 120) {
        newZoom = Number((zoom * 1.5).toFixed(2));
        if (newZoom > 120) newZoom = 120;
      }
    } else {
      if (zoom > 0.4) {
        newZoom = Number((zoom / 1.5).toFixed(2));
        if (newZoom < 0.4) newZoom = 0.4;
      }
    }

    setZoom(newZoom);
    setPanX(centerX - pixelX * newZoom);
    setPanY(centerY - pixelY * newZoom);
  };


  // Warp teleporter
  const warpToLocation = (x: number, y: number) => {
    const validX = Math.max(0, Math.min(canvasWidth - 1, x));
    const validY = Math.max(0, Math.min(canvasHeight - 1, y));

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Center on selected targets
    const targetZoom = Math.max(8, zoom);
    setZoom(targetZoom);
    setPanX(-(validX * targetZoom) + width / 2);
    setPanY(-(validY * targetZoom) + height / 2);
    setSelectedPixel({ x: validX, y: validY });
  };

  // Direct coordinate painting helper
  const paintSinglePixelDirect = async (x: number, y: number, color: string) => {
    if (!currentAddress) {
      onTriggerProfile();
      return;
    }
    if (charges < 1) {
      showToast(`⚠️ Energy depleted! You have 0/${maxCharges} charges. Please wait for auto-regeneration (+1 every 10s). you can also boost charges in Store!`, "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      triggerBeep(784, "sine", 0.05); // Play modern high chime chord on paint success
      const res = await onPaintPixels([{ x, y, color }], chosenCurrency);
      if (res && res.success) {
        // Remove from staging list if it existed there
        const key = `${x},${y}`;
        setStagedPixels((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        setSelectedPixel(null);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Verify transactions: painting failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pan & Click Separation mechanics
  const handleMouseDownAction = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click drag
    mouseDownCoords.current = { x: e.clientX, y: e.clientY };
    dragThresholdPassed.current = false;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMoveAction = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (mouseDownCoords.current) {
      const dx = e.clientX - mouseDownCoords.current.x;
      const dy = e.clientY - mouseDownCoords.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If moved more than 5px, it is a drag/pan operation!
      if (distance > 5) {
        dragThresholdPassed.current = true;
        if (!isDragging) {
          setIsDragging(true);
        }
        setPanX(e.clientX - dragStart.current.x);
        setPanY(e.clientY - dragStart.current.y);
      }
    } else {
      if (zoom < 3.0) {
        setHoveredPixel(null);
        return;
      }
      const localX = e.clientX - rect.left - panX;
      const localY = e.clientY - rect.top - panY;

      const px = Math.floor(localX / zoom);
      const py = Math.floor(localY / zoom);

      if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
        setHoveredPixel({ x: px, y: py });
      } else {
        setHoveredPixel(null);
      }
    }
  };

  const handleMouseUpAction = (e: MouseEvent<HTMLDivElement>) => {
    if (mouseDownCoords.current) {
      const dx = e.clientX - mouseDownCoords.current.x;
      const dy = e.clientY - mouseDownCoords.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Treat as clean click only if cursor moved less than 5px
      if (distance < 5 && !dragThresholdPassed.current) {
        if (zoom < 3.0) {
          // No pixel selection or drawing allowed while zoomed out!
          mouseDownCoords.current = null;
          return;
        }
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const localX = e.clientX - rect.left - panX;
          const localY = e.clientY - rect.top - panY;

          const px = Math.floor(localX / zoom);
          const py = Math.floor(localY / zoom);

          if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
            if (directPaintMode) {
              triggerBeep(329.63, "sine", 0.04);
              setSelectedPixel({ x: px, y: py });
              // Direct painting Mode: Place instantly to the backend database!
              paintSinglePixelDirect(px, py, selectedColor);
            } else {
              if (isEditingMode) {
                const key = `${px},${py}`;
                const isAlreadyStaged = stagedPixels[key] !== undefined;
                if (isAlreadyStaged) {
                  setStagedPixels((prev) => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
                  setSelectedPixel(null);
                  triggerBeep(220, "sine", 0.04);
                } else {
                  setSelectedPixel({ x: px, y: py });
                  triggerBeep(329.63, "sine", 0.04);
                  setStagedPixels((prev) => ({
                    ...prev,
                    [key]: selectedColor,
                  }));
                }
              } else {
                // Not in editing mode: simple inspector selection (Image 1)
                setSelectedPixel({ x: px, y: py });
                triggerBeep(329.63, "sine", 0.04);
              }
            }
          }
        }
      }
    }

    mouseDownCoords.current = null;
    dragThresholdPassed.current = false;
    setIsDragging(false);
  };

  // Remove pixel from staging
  const removeStaged = (key: string) => {
    const updated = { ...stagedPixels };
    delete updated[key];
    setStagedPixels(updated);
  };

  const clearStagedBasket = () => {
    setStagedPixels({});
  };

  // Staging metrics
  const stagedCount = Object.keys(stagedPixels).length;
  const costPerPixel = 1; // 1 Pixel Token (PX) per pixel
  const totalStagedCost = stagedCount * costPerPixel;

  const handleSendBatch = async () => {
    if (!currentAddress) {
      // Prompt wallet profile connection dialog
      onTriggerProfile();
      return;
    }
    if (stagedCount === 0) {
      showToast("⚠️ El borrador está vacío. Por favor selecciona un color y haz clic en el mapa para estampar píxeles primero.", "warning");
      return;
    }

    const userBalance = userProfile?.pixel_tokens_balance || 0;
    const isPremiumBatch = stagedCount > maxCharges;

    if (isPremiumBatch) {
      // For large premium batches, verify PX balance directly and bypass energy limit
      if (userProfile && userBalance < totalStagedCost) {
        showToast(`❌ Saldo de Pixel Tokens (PX) insuficiente.\n\nLa colocación de esta imagen requiere ${totalStagedCost} PX.\n\nTu saldo actual es de ${userBalance} PX.\n\nSugerencia: Ve al menú de la Tienda de creador y obtén tokens gratuitos en el Grifo de pruebas (faucet), o intercambia tus monedas de juego de forma instantánea.`, "error");
        return;
      }
    } else {
      // Standard drawing uses energy cooldown
      if (charges < stagedCount) {
        showToast(`⚠️ Reactor de energía enfriándose (${charges}/${maxCharges} cargas).\n\nRequieres al menos ${stagedCount} de energía para colocar este grupo de píxeles.\n\nSugerencia: Espera unos momentos (se recarga automáticamente +1 cada 10s) o compra un potenciador en la Tienda.`, "warning");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formatted = Object.keys(stagedPixels).map((key) => {
        const [x, y] = key.split(",").map(Number);
        return { x, y, color: stagedPixels[key] };
      });

      const res = await onPaintPixels(formatted, chosenCurrency);
      if (res && res.success) {
        clearStagedBasket();
        setSelectedPixel(null);
        triggerBeep(880, "sine", 0.08);
        showToast(`⭐ ¡Pintado exitoso!\n\nSe han guardado ${formatted.length} píxeles de manera permanente en el mapa de Fractal Bitcoin.`, "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Verify transactions: painting failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPixelDetails: PixelData | null = selectedPixel
    ? pixels[`${selectedPixel.x},${selectedPixel.y}`] || null
    : null;

  return (
    <div id="full-screen-wplace-canvas" className="relative w-full h-full flex-1 bg-[#f8fafc] overflow-hidden rounded-2xl border border-slate-200/60 shadow-xl select-none">
      
      {/* Immersive Sandbox Custom Toasts Feed */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence mode="pop-layout">
          {toast && (
            <motion.div
              key={toast.key}
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 18, stiffness: 120 }}
              className={`pointer-events-auto w-full rounded-xl shadow-2xl border p-4 flex gap-3 text-slate-800 backdrop-blur-xl ${
                toast.type === "success" 
                  ? "border-emerald-500/30 bg-emerald-950/95 text-emerald-100 shadow-emerald-950/20" 
                  : toast.type === "error" 
                  ? "border-rose-500/30 bg-rose-950/95 text-rose-100 shadow-rose-950/20" 
                  : toast.type === "warning"
                  ? "border-amber-500/35 bg-amber-950/95 text-amber-100 shadow-amber-950/20"
                  : "border-slate-800 bg-slate-900/95 text-slate-100 shadow-slate-950/20"
              }`}
            >
              <div className="flex-1 text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap">
                {toast.message}
              </div>
              <button
                onClick={() => setToast(null)}
                className="self-start text-xs font-bold leading-none select-none hover:opacity-80 active:opacity-60 cursor-pointer p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 100% Bleed Map Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownAction}
        onMouseMove={handleMouseMoveAction}
        onMouseUp={handleMouseUpAction}
        onMouseLeave={() => setHoveredPixel(null)}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute origin-top-left shadow-2xl crisp-canvas"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            imageRendering: "pixelated",
          }}
        />

        {/* GPU-Accelerated CSS-Only Grid Overlay (Replaces expensive Canvas grid loop!) */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            left: `${panX}px`,
            top: `${panY}px`,
            width: `${canvasWidth * zoom}px`,
            height: `${canvasHeight * zoom}px`,
            display: showGridLines ? "block" : "none",
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(15, 23, 42, 0.1) 1px, transparent 1px)`,
            backgroundSize: `${zoom}px ${zoom}px`,
          }}
        />

        {/* Dynamic High-Contrast Sharp Target Overlays (Screen-Space Crisp Rendering) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle cursor-hovered pixel shading reference */}
          {hoveredPixel && zoom >= 2 && (!selectedPixel || selectedPixel.x !== hoveredPixel.x || selectedPixel.y !== hoveredPixel.y) && (
            <div
              className="absolute pointer-events-none border border-slate-950/40"
              style={{
                left: `${hoveredPixel.x * zoom + panX}px`,
                top: `${hoveredPixel.y * zoom + panY}px`,
                width: `${zoom}px`,
                height: `${zoom}px`,
                boxSizing: "border-box",
                backgroundColor: selectedColor === "transparent" ? "rgba(0, 0, 0, 0.15)" : selectedColor,
                opacity: 0.35,
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.4)",
              }}
            />
          )}

          {/* Active selection pixel cursor */}
          {selectedPixel && (
            <>
              <div
                className={`absolute pointer-events-none ${
                  hasGlowBrush 
                    ? "border-2 border-amber-400 bg-amber-400/20 active-glow shadow-[0_0_15px_rgba(245,158,11,1)] animate-pulse" 
                    : "border-2 border-purple-600 bg-purple-500/10"
                }`}
                style={{
                  left: `${selectedPixel.x * zoom + panX}px`,
                  top: `${selectedPixel.y * zoom + panY}px`,
                  width: `${zoom}px`,
                  height: `${zoom}px`,
                  boxSizing: "border-box",
                  boxShadow: hasGlowBrush
                    ? "0 0 12px rgba(245, 158, 11, 0.9), inset 0 0 8px rgba(245,158,11,0.9)"
                    : "0 0 0 1px rgba(255, 255, 255, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.85)",
                }}
              />
              {/* Glowing blue map-pin pointing exactly to the pixel */}
              <div
                className="absolute pointer-events-none transition-all duration-150 ease-out z-30"
                style={{
                  left: `${selectedPixel.x * zoom + panX}px`,
                  top: `${selectedPixel.y * zoom + panY}px`,
                  transform: `translate(${zoom / 2 - 16}px, -36px)`,
                }}
              >
                <div className="flex flex-col items-center animate-bounce origin-bottom">
                  <svg className={`w-8 h-8 drop-shadow-md ${hasGlowBrush ? "text-amber-500 fill-amber-500" : "text-blue-600 fill-blue-600"}`} viewBox="0 0 24 24">
                    <path 
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                      stroke="white" 
                      strokeWidth="1.5" 
                    />
                  </svg>
                  <div className={`-mt-1 w-1 h-1 ${hasGlowBrush ? "bg-amber-400" : "bg-blue-600"} rounded-full border border-white shadow animate-ping`} />
                </div>
              </div>
            </>
          )}

          {/* Staged pixels highlighted boundaries */}
          {stagedCount <= 200 && Object.keys(stagedPixels).map((key) => {
            const [sx, sy] = key.split(",").map(Number);
            return (
              <div
                key={key}
                className={`absolute pointer-events-none border bg-transparent ${
                  hasGlowBrush 
                    ? "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] ring-1 ring-amber-400" 
                    : "border-slate-900/60"
                }`}
                style={{
                  left: `${sx * zoom + panX}px`,
                  top: `${sy * zoom + panY}px`,
                  width: `${zoom}px`,
                  height: `${zoom}px`,
                  boxSizing: "border-box",
                  boxShadow: hasGlowBrush
                    ? "0 0 6px rgba(245,158,11,0.8), inset 0 0 6px rgba(245,158,11,0.8)"
                    : "inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
                }}
              />
            );
          })}

          {/* Activity Hotspots / Flame Markers (only visible when zoomed out, i.e., zoom < 3.0) */}
          {zoom < 3.0 && (
            <>
              {HOTSPOTS.map((spot) => {
                const screenX = spot.x * zoom + panX;
                const screenY = spot.y * zoom + panY;

                return (
                  <button
                    key={spot.id}
                    onClick={() => {
                      warpToLocation(spot.x, spot.y);
                      // Since warpToLocation sets zoom based on Math.max(8, zoom), we force zoom to 8.0
                      setZoom(8);
                      triggerBeep(784, "sine", 0.08);
                    }}
                    className="absolute z-20 pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 hover:scale-115 active:scale-95 group focus:outline-none cursor-pointer"
                    style={{
                      left: `${screenX}px`,
                      top: `${screenY}px`,
                    }}
                    title={`Hotspot: ${spot.label} (${spot.count} paints)`}
                  >
                    {/* Pulsing Aura */}
                    <span className="absolute inline-flex rounded-full bg-orange-500/25 w-11 h-11 animate-ping" />
                    
                    {/* Badge Container */}
                    <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 border border-white text-white font-extrabold flex items-center justify-center gap-1 shadow-lg shadow-orange-500/20 rounded-full py-1 px-2.5">
                      <Flame className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                      {spot.isMajor && (
                        <span className="text-[10px] font-mono font-black select-none tracking-tighter leading-none mt-0.5">
                          {spot.count}
                        </span>
                      )}

                      {/* Tooltip */}
                      <div className="absolute top-10 bg-slate-950/90 backdrop-blur-md border border-slate-700/55 text-[8.5px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {spot.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* HUD: Tiny Center Coordinates Overlay (Float top center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        <div className="bg-slate-900/90 text-white backdrop-blur-lg border border-slate-700/50 rounded-full py-1 px-3 flex items-center justify-center gap-1.5 shadow-md">
          <Crosshair className="w-3 h-3 text-emerald-400" />
          <span className="font-mono text-[10px] font-extrabold tracking-wide">
            X: {hoveredPixel ? hoveredPixel.x : (selectedPixel ? selectedPixel.x : "-")} | Y: {hoveredPixel ? hoveredPixel.y : (selectedPixel ? selectedPixel.y : "-")}
          </span>
        </div>
      </div>

      {/* FLOAT: Stack on the left side of separate circular white buttons */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            if (onToggleMenuOverlay) {
              onToggleMenuOverlay("rules");
            } else {
              onTriggerStore();
            }
            triggerBeep(493, "sine", 0.05);
          }}
          className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center bg-white/95 backdrop-blur-sm shadow-slate-200 text-slate-600 hover:text-slate-900 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border-slate-200/90"
          title="Información y Reglas"
        >
          <span className="font-serif text-sm font-black italic text-slate-800">i</span>
        </button>
        <button
          onClick={() => {
            handleZoomOffset("in");
            triggerBeep(330, "sine", 0.05);
          }}
          className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center bg-white/95 backdrop-blur-sm shadow-slate-200 text-slate-600 hover:text-slate-900 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border-slate-200/90 font-sans text-xl"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            handleZoomOffset("out");
            triggerBeep(330, "sine", 0.05);
          }}
          className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center bg-white/95 backdrop-blur-sm shadow-slate-200 text-slate-600 hover:text-slate-900 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border-slate-200/90 font-sans text-xl"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* FLOAT: Stack on the right side of separate circular white buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Header toolbar */}
        <div className="flex items-center gap-2">
          {/* Open Wallet Button with Green Wallet icon */}
          <button
            onClick={() => {
              onTriggerProfile();
              triggerBeep(523, "sine", 0.05);
            }}
            className="h-10 px-4 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/65 text-emerald-700 hover:text-emerald-800 rounded-xl flex items-center gap-1.5 font-bold font-sans text-xs transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/10 shrink-0"
            title="Open Wallet Config"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Open Wallet</span>
          </button>

          {/* Active Player Profile bubble (Clicking opens settings settings modal) */}
          <button
            onClick={() => {
              onTriggerProfile();
              triggerBeep(523, "sine", 0.05);
            }}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-emerald-400 ring-offset-2 hover:ring-indigo-400 shrink-0"
            title="Editar Perfil y Faucets"
          >
            <span className="text-xl" role="img" aria-label="your flag">
              {userProfile?.flag_emoji || "🇺🇸"}
            </span>
            <span className="absolute -bottom-1 -left-1 bg-indigo-600 border border-slate-150 text-white rounded-full text-[8.5px] font-black h-5 w-5 flex items-center justify-center shadow-md font-mono shrink-0">
              {charges}
            </span>
          </button>
        </div>

        {/* Vertical feature buttons stack */}
        <div className="flex flex-col gap-2 mt-1">
          {/* 1. Subscriptions button */}
          <button
            onClick={() => {
              if (onToggleMenuOverlay) onToggleMenuOverlay("subscriptions");
              triggerBeep(659, "sine", 0.05);
            }}
            className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              activeMenuOverlay === "subscriptions" 
                ? "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-950/20 font-bold" 
                : "bg-white border-slate-200 text-amber-500 hover:text-amber-600 hover:border-amber-300 font-medium"
            }`}
            title="Suscripciones y Tiers"
          >
            <CreditCard className="w-5 h-5 font-bold" />
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => {
              if (onToggleMenuOverlay) onToggleMenuOverlay("leaderboard");
              triggerBeep(587, "sine", 0.05);
            }}
            className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              activeMenuOverlay === "leaderboard" 
                ? "bg-purple-600 border-purple-500 text-white animate-pulse" 
                : "bg-white border-slate-200 text-slate-655 hover:text-slate-800"
            }`}
            title="Ránking y Líderes"
          >
            <Trophy className="w-5 h-5" />
          </button>

          {/* Live Feed Globe */}
          <button
            onClick={() => {
              if (onToggleMenuOverlay) onToggleMenuOverlay("feed");
              triggerBeep(523, "sine", 0.05);
            }}
            className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              activeMenuOverlay === "feed" 
                ? "bg-purple-600 border-purple-500 text-white" 
                : "bg-white border-slate-200 text-slate-650 hover:text-slate-800"
            }`}
            title="Feed de Actividad"
          >
            <Globe className="w-5 h-5" />
          </button>

          {/* 5. Teleporter Portal overlay toggler */}
          <button
            onClick={() => {
              setShowTeleporter(!showTeleporter);
              triggerBeep(330, "sine", 0.05);
            }}
            className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              showTeleporter 
                ? "bg-indigo-600 border-indigo-500 text-white" 
                : "bg-white border-slate-200 text-slate-650 hover:text-slate-800"
            }`}
            title="Portal Warp Teleporter"
          >
            <MapPin className="w-5 h-5" />
          </button>

          {/* 6. Dev RPC Terminal */}
          <button
            onClick={() => {
              if (onToggleMenuOverlay) onToggleMenuOverlay("developer_rpc");
              triggerBeep(493, "sine", 0.05);
            }}
            className={`w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              activeMenuOverlay === "developer_rpc" 
                ? "bg-indigo-600 border-indigo-500 text-white" 
                : "bg-white border-slate-200 text-slate-650 hover:text-slate-800"
            }`}
            title="Dev RPC Terminal Command Console"
          >
            <TerminalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FLOAT: Compact Teleporter input (Bottom left, floating above the Grid toggler!) */}
      {showTeleporter && (
        <div className="absolute bottom-16 left-4 z-20 pointer-events-auto max-w-[190px] animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 px-2.5 shadow-xl flex flex-col gap-1 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-700 font-black mb-0.5">
              <Move className="w-3 h-3 text-indigo-500" />
              <span>Teleporter Portal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 max-w-[45px]">
                <span className="text-[8px] font-mono text-slate-400 mr-0.5">X</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={teleportX}
                  onChange={(e) => setTeleportX(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                  className="w-full bg-transparent text-slate-800 focus:outline-none font-mono text-[9px] font-semibold"
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 max-w-[45px]">
                <span className="text-[8px] font-mono text-slate-400 mr-0.5">Y</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={teleportY}
                  onChange={(e) => setTeleportY(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                  className="w-full bg-transparent text-slate-800 focus:outline-none font-mono text-[9px] font-semibold"
                />
              </div>
              <button
                onClick={() => {
                  warpToLocation(teleportX, teleportY);
                  triggerBeep(587, "sine", 0.05);
                }}
                className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[9px] font-bold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Warp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Re-center Compass (Bottom Right Corner) */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => warpToLocation(490, 230)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-xl flex items-center justify-center text-red-500 hover:text-red-650 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Re-centrar Mapa"
        >
          <Crosshair className="w-5 h-5 animate-pulse" />
        </button>
      </div>

      {/* Floating Grid Toggle Button (Bottom Left Corner) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <button
          onClick={() => {
            setShowGridLines(!showGridLines);
            triggerBeep(330, "sine", 0.05);
          }}
          className={`w-10 h-10 rounded-full border shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            showGridLines 
              ? "bg-blue-50 border-blue-300 text-blue-600 font-extrabold" 
              : "bg-white border-slate-200 text-slate-550 hover:text-slate-800"
          }`}
          title="Alternar cuadrícula"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* FLOATING ACTION BOTTOM CONTAINER (Palette Docks, Staging Drawers, Charges systems) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 flex flex-col items-center gap-3">
        
        {/* CASE 1: Dormant Active Paint / Trigger Action (Image 3) */}
        {!selectedPixel && !isEditingMode && (
          <div className="flex items-center justify-center gap-1.5 w-full pointer-events-auto">
            <button
              onClick={() => {
                const defaultX = 490;
                const defaultY = 230;
                setSelectedPixel({ x: defaultX, y: defaultY });
                setIsEditingMode(true);
                setStagedPixels({ [`${defaultX},${defaultY}`]: selectedColor });
                warpToLocation(defaultX, defaultY);
                triggerBeep(523.25, "sine", 0.06);
              }}
              className="px-8 py-3 bg-[#0066ff] hover:bg-[#0055ee] text-white font-extrabold text-sm tracking-wide rounded-full shadow-lg shadow-blue-600/20 transition-all duration-150 hover:scale-[1.05] active:scale-[0.95] cursor-pointer flex items-center justify-center gap-2 max-w-[280px] w-full"
            >
              <Paintbrush className="w-4 h-4 text-white" />
              Pintar {charges}/{maxCharges} {charges < maxCharges && `(0:${secondsLeft < 10 ? "0" : ""}${secondsLeft})`}
            </button>
          </div>
        )}

        {/* CASE 2: Selected Pixel Inspector Details Card (Image 1) */}
        {selectedPixel && !isEditingMode && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-fade-in text-slate-800 pointer-events-auto max-w-[430px]">
            {/* Top Row: Avatar, Info, Badges, Options, Close */}
            <div className="flex items-start justify-between gap-3">
              {/* Left & Middle section */}
              <div className="flex items-center gap-3">
                {/* Large Round Avatar: Painter Profile Photo or Generic Grid Icon */}
                {selectedPixelDetails ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-indigo-200/80 shadow bg-slate-50 flex items-center justify-center shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(selectedPixelDetails.owner)}`}
                      alt={selectedPixelDetails.ownerUsername || "Painter"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-dashed border-slate-300 shadow-inner flex items-center justify-center text-slate-400 shrink-0">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
                      <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Info & Badges block */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sans font-extrabold text-base text-slate-900 tracking-tight truncate leading-tight">
                      {selectedPixelDetails ? (selectedPixelDetails.ownerUsername || "Painter Guest") : "Libre"}
                    </h3>
                  </div>
                  
                  {selectedPixelDetails ? (
                    <div className="text-[10px] font-mono text-slate-500 truncate max-w-[160px] leading-normal" title={selectedPixelDetails.owner}>
                      {selectedPixelDetails.owner.substring(0, 16)}...
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-600 font-bold tracking-wide flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Disponible para pintar
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                    {selectedPixelDetails ? (selectedPixelDetails.owner === currentAddress ? "¡Tuyo!" : "Sin alianza") : "Aún sin pintar"}
                  </span>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold">
                      <MapPin className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                      {selectedPixel.x}, {selectedPixel.y}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Options Button & Close Button */}
              <div className="flex items-center gap-1 shrink-0 relative">
                <button 
                  onClick={() => handleToggleFavorite(selectedPixel.x, selectedPixel.y)}
                  title={favorites.includes(`${selectedPixel.x},${selectedPixel.y}`) ? "Quitar de favoritos" : "Agregar a favoritos"}
                  className="p-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <Star 
                    className={`w-4 h-4 transition-all duration-150 ${
                      favorites.includes(`${selectedPixel.x},${selectedPixel.y}`)
                        ? "text-amber-500 fill-amber-400 scale-110"
                        : "text-slate-400 fill-transparent hover:text-amber-500 hover:fill-amber-400"
                    }`} 
                  />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => {
                      triggerBeep(350, "sine", 0.05);
                      setShowSharePopover(!showSharePopover);
                    }}
                    title="Compartir"
                    className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                      showSharePopover 
                        ? "bg-blue-50 border-blue-200 text-blue-600" 
                        : "hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Share Popover Dropdown menu */}
                  {showSharePopover && (
                    <div id="share-popover-menu" className="absolute right-0 bottom-full mb-2 z-50 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-1.5 animate-scale-up text-left">
                      <div className="px-2 py-1 border-b border-slate-100 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Compartir pixel</span>
                      </div>
                      
                      {/* Share on X (Twitter) option */}
                      <button
                        onClick={() => {
                          const text = selectedPixelDetails
                            ? `¡Mira este pixel pintado por ${selectedPixelDetails.ownerUsername || 'un pintor'} en x:${selectedPixel.x}, y:${selectedPixel.y} en Wplace! 🎨🔥`
                            : `¡El pixel x:${selectedPixel.x}, y:${selectedPixel.y} está libre en Wplace! Ven a pintarlo ahora 🎨🚀`;
                          const url = window.location.href;
                          const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                          window.open(tweetUrl, "_blank", "noopener,noreferrer");
                          setShowSharePopover(false);
                          triggerBeep(480, "sine", 0.06);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-sans font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Compartir en X
                      </button>

                      {/* Share on Telegram option */}
                      <button
                        onClick={() => {
                          const text = selectedPixelDetails
                            ? `¡Mira este pixel pintado por ${selectedPixelDetails.ownerUsername || 'un pintor'} en x:${selectedPixel.x}, y:${selectedPixel.y} en Wplace! 🎨🔥`
                            : `¡El pixel x:${selectedPixel.x}, y:${selectedPixel.y} está libre en Wplace! Ven a pintarlo ahora 🎨🚀`;
                          const url = window.location.href;
                          const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                          window.open(telegramUrl, "_blank", "noopener,noreferrer");
                          setShowSharePopover(false);
                          triggerBeep(480, "sine", 0.06);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-sans font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-[#0088cc] fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.1.17.24.18.34.02.09.01.24 0 .32z" />
                        </svg>
                        Compartir en Telegram
                      </button>

                      {/* Copy Link option */}
                      <button
                        onClick={() => {
                          const shareUrl = window.location.href;
                          navigator.clipboard.writeText(shareUrl).then(() => {
                            setCopiedLink(true);
                            triggerBeep(659.25, "sine", 0.05);
                            setTimeout(() => {
                              setCopiedLink(false);
                              setShowSharePopover(false);
                            }, 1500);
                          });
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-755 font-sans font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {copiedLink ? (
                          <span className="text-emerald-600 flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" />
                            ¡Copiado!
                          </span>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125H6.75a9.06 9.06 0 011.5.124m7.5 0a9.06 9.06 0 011.5-.124" />
                            </svg>
                            Copiar Enlace
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <button className="p-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedPixel(null)} 
                  className="p-1.5 rounded-full hover:bg-slate-100 border border-slate-150 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Actions: Solid "Pintar" button */}
            <button
              onClick={() => {
                setIsEditingMode(true);
                const key = `${selectedPixel.x},${selectedPixel.y}`;
                if (stagedPixels[key] === undefined) {
                  setStagedPixels({
                    ...stagedPixels,
                    [key]: selectedColor
                  });
                }
                triggerBeep(523.25, "sine", 0.06);
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-sm text-white tracking-wide transition-all duration-150 shadow-md shadow-blue-600/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Paintbrush className="w-4 h-4" />
              Pintar
            </button>
          </div>
        )}

        {/* CASE 3: Active Paint Palette Drawer (Image 2) */}
        {isEditingMode && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 animate-fade-in text-slate-800 pointer-events-auto max-w-[430px]">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-sans font-black text-slate-900">
                  Pintar píxel {stagedCount > 0 ? `(${stagedCount})` : "(1)"}
                </span>

                <div className="flex items-center gap-1 mt-0.5 ml-2 border-l border-slate-200 pl-2">
                  <button className="p-1 rounded hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors" title="Lápiz / Brush">
                    <Paintbrush className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="Map Overlays">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setShowImgImporter(true);
                      triggerBeep(523.25, "sine", 0.08);
                    }}
                    className="p-1 px-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer transition-all flex items-center gap-1 shrink-0" 
                    title="Importar Imagen y Transformar a Píxel (Premium)"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wide">Premium</span>
                  </button>
                  <button 
                    onClick={() => {
                      const keys = Object.keys(stagedPixels);
                      if (keys.length > 0) {
                        const lastKey = keys[keys.length - 1];
                        setStagedPixels((prev) => {
                          const updated = { ...prev };
                          delete updated[lastKey];
                          return updated;
                        });
                        triggerBeep(330, "sine", 0.05);
                      }
                    }}
                    disabled={stagedCount === 0}
                    className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 disabled:opacity-40 cursor-pointer transition-colors" 
                    title="Undo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    disabled={true}
                    className="p-1 rounded hover:bg-slate-50 text-slate-300 disabled:opacity-40 cursor-pointer transition-colors" 
                    title="Redo (Locked)"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsEditingMode(false);
                }}
                className="p-1 rounded-full text-slate-450 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Tooltip Toast pointing upwards (Image 2 style) */}
            <div className="relative">
              <div className="flex justify-center -mt-1.5 mb-1.5">
                <div className="flex items-center gap-1 bg-amber-500/90 text-amber-50 border border-amber-400/30 rounded-lg py-1 px-3.5 text-[10px] font-sans font-bold shadow-md animate-bounce">
                  <Paintbrush className="w-3 h-3 text-amber-200 fill-amber-300" />
                  Puedes pintar más de 1 píxel
                </div>
              </div>
            </div>

            {/* Color grid horizontal container (Beautifully styled round color pills matching Image 2) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5 px-0.5 justify-start max-w-full">
              {customPalette.map((color) => {
                const isSelected = selectedColor === color;
                const isEraser = color === "transparent";

                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      if (selectedPixel) {
                        const key = `${selectedPixel.x},${selectedPixel.y}`;
                        setStagedPixels(prev => ({
                          ...prev,
                          [key]: color
                        }));
                      }
                      triggerBeep(659.25, "sine", 0.04);
                    }}
                    className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full shrink-0 border relative transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
                      isSelected 
                        ? "border-slate-800 scale-110 shadow-md ring-2 ring-slate-400/40" 
                        : "border-slate-200 hover:border-slate-400 hover:scale-105"
                    }`}
                    style={{ backgroundColor: isEraser ? "transparent" : color }}
                    title={isEraser ? "Goma de borrar" : color}
                  >
                    {isEraser && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-full border border-slate-250 overflow-hidden">
                        <div className="w-full h-full bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0] opacity-60 flex items-center justify-center">
                          <Eraser className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
                        </div>
                      </span>
                    )}
                    {isSelected && !isEraser && (
                      <div className="w-2 h-2 rounded-full bg-slate-900 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom button controls row */}
            <div className="flex items-center justify-between gap-3 mt-1">
              {/* Left selector - Extended Palette Color Picker */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowExtendedColors(!showExtendedColors);
                    triggerBeep(392, "sine", 0.05);
                  }}
                  className={`w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all cursor-pointer shadow-sm text-slate-600 ${showExtendedColors ? 'bg-indigo-50 border-indigo-300 text-indigo-600 ring-2 ring-indigo-200' : ''}`}
                  title="Paleta de colores extendida"
                >
                  <Palette className="w-4 h-4" />
                </button>

                {/* Extended Color Palette Popover Grid */}
                {showExtendedColors && (
                  <div className="absolute left-0 bottom-full mb-2.5 z-55 w-[250px] bg-white border border-slate-200 rounded-2xl p-3 shadow-xl animate-scale-up text-left">
                    <div className="px-1 pb-1.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">
                        Gama Extendida (40 colores)
                      </span>
                      <button 
                        onClick={() => setShowExtendedColors(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Cerrar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto scrollbar-none py-0.5">
                      {EXTENDED_COLORS.map((colorHex, idx) => {
                        const isAlreadySelected = selectedColor === colorHex;
                        return (
                          <button
                            key={`${colorHex}-${idx}`}
                            onClick={() => handleSelectExtendedColor(colorHex)}
                            className={`w-5.5 h-5.5 rounded-full border relative transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
                              isAlreadySelected 
                                ? "border-slate-850 ring-2 ring-indigo-400/50 scale-105" 
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                            style={{ backgroundColor: colorHex }}
                            title={colorHex}
                          >
                            {isAlreadySelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-[9px] text-slate-400 font-sans italic text-center">
                      Se colocará después de la goma de borrar.
                    </div>
                  </div>
                )}
              </div>

              {/* Center Pintar button (Image 2 style) */}
              <button
                onClick={handleSendBatch}
                disabled={isSubmitting}
                className={`flex-1 max-w-[280px] py-2.5 rounded-full font-bold text-sm text-white tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-500 shadow-blue-600/10 hover:scale-[1.01] active:scale-[0.98]`}
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-200" />
                    Pintando...
                  </>
                ) : (
                  <>
                    <Paintbrush className="w-4 h-4" />
                    Pintar {stagedCount > 0 ? stagedCount : 1} px ({charges}/{maxCharges}) {charges < maxCharges && `(0:${secondsLeft < 10 ? "0" : ""}${secondsLeft})`}
                  </>
                )}
              </button>

              {/* Right Draw reset */}
              <button 
                onClick={() => {
                  clearStagedBasket();
                  triggerBeep(440, "sine", 0.05);
                }}
                className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all cursor-pointer shadow-sm text-slate-600"
                title="Discard draw basket"
              >
                <Trash2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CASE 4: PREMIUM IMAGE ART CONVERTER OVERLAY MODAL */}
      {showImgImporter && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 animate-scale-up text-slate-800 relative pointer-events-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full animate-pulse">
                  Premium
                </span>
                <span className="text-base font-sans font-black text-slate-900 flex items-center gap-1.5">
                  Importador de Píxel-Art
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowImgImporter(false);
                  setUploadedImgSrc(null);
                  setPixelatedBlueprint(null);
                  setImportStatus(null);
                  triggerBeep(330, "sine", 0.05);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informative introductory tooltip */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed text-slate-500 font-sans">
              🌟 Sube una foto y nuestro algoritmo la simplificará para adaptarla de forma espectacular a la cuadrícula del mapa global de Wplace, emparejando los colores con la paleta permitida. El pixel art se centrará en tu coordenada actual.
            </div>

            {/* Upload Area */}
            {!uploadedImgSrc ? (
              <label className="flex flex-col items-center justify-center gap-3.5 py-10 px-5 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 rounded-2xl cursor-pointer transition-all group">
                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-115 transition-all duration-200 border border-slate-100">
                  <Upload className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700 block">Sube una imagen (JPG, PNG, WEBP)</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans mt-0.5 block">Nivel de cuadrícula configurable en el siguiente paso</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImgFileChange} 
                  className="hidden" 
                />
              </label>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Image Comparison & Status Display */}
                <div className="flex justify-center items-center gap-6 py-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Original</span>
                    <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-0.5 shadow-sm">
                      <img 
                        src={uploadedImgSrc} 
                        alt="Original Upload" 
                        className="max-w-full max-h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="text-slate-300 font-black text-xl">➔</div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Mapeado Final</span>
                    <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-0.5 shadow-sm">
                      {isAnalyzingImg ? (
                        <div className="flex flex-col items-center gap-1 px-1">
                          <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" />
                          <span className="text-[9px] text-slate-400 text-center leading-tight">Analizando...</span>
                        </div>
                      ) : (
                        <canvas 
                          ref={blueprintCanvasRef}
                          style={{ imageRendering: "pixelated" }}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {importStatus && (
                  <div className="p-2.5 bg-indigo-50/50 border border-indigo-100/30 rounded-xl text-[11px] text-center text-indigo-700 font-mono animate-pulse">
                    {importStatus}
                  </div>
                )}

                {/* Grid resolution setting */}
                <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Resolución / Dimensiones:
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {blueprintWidth} x {blueprintHeight} px
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {[16, 32, 48, 64, 96].map((res) => {
                      const isActive = importResolution === res;
                      return (
                        <button
                          key={res}
                          onClick={() => {
                            setImportResolution(res);
                            triggerBeep(493.88, "sine", 0.04);
                          }}
                          className={`py-1.5 text-[10px] sm:text-xs font-sans font-bold rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? "bg-indigo-600 border-indigo-650 text-white shadow-sm scale-102"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {res}x{res}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conversion Filter setting */}
                <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Filtro de Conversión:
                    </span>
                    <span className="text-[10px] font-sans font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {useSmoothing ? "Suave (Bilinear)" : "Nítido (Pixel-Art)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        setUseSmoothing(false);
                        triggerBeep(493.88, "sine", 0.04);
                      }}
                      className={`py-1.5 px-2 text-xs font-sans rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        !useSmoothing
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold">Mapeo Nítido</span>
                      <span className={`text-[8px] ${!useSmoothing ? "text-indigo-205" : "text-slate-400"} font-medium`}>Sin suavizado (Líneas Claras)</span>
                    </button>
                    <button
                      onClick={() => {
                        setUseSmoothing(true);
                        triggerBeep(523.25, "sine", 0.04);
                      }}
                      className={`py-1.5 px-2 text-xs font-sans rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        useSmoothing
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold">Mapeo Suave</span>
                      <span className={`text-[8px] ${useSmoothing ? "text-indigo-205" : "text-slate-400"} font-medium`}>Con suavizado (Degradados)</span>
                    </button>
                  </div>
                </div>

                {/* Color Accuracy / Fidelity setting */}
                <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      Precisión de Color:
                    </span>
                    <span className="text-[10px] font-sans font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {useOriginalColors ? "Colores Reales (Idéntico)" : "Fuerza a Paleta"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => {
                        setUseOriginalColors(true);
                        triggerBeep(493.88, "sine", 0.04);
                      }}
                      className={`py-1.5 px-2 text-xs font-sans rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        useOriginalColors
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold">Colores Reales</span>
                      <span className={`text-[8px] ${useOriginalColors ? "text-indigo-205" : "text-slate-400"} font-medium`}>Mapeo fiel 100% idéntico</span>
                    </button>
                    <button
                      onClick={() => {
                        setUseOriginalColors(false);
                        triggerBeep(523.25, "sine", 0.04);
                      }}
                      className={`py-1.5 px-2 text-xs font-sans rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        !useOriginalColors
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold">Reducir a Paleta</span>
                      <span className={`text-[8px] ${!useOriginalColors ? "text-indigo-205" : "text-slate-400"} font-medium`}>Restringir a gama del canvas</span>
                    </button>
                  </div>
                </div>

                {/* Price and billing summary info badge */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-amber-50/30">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest leading-none">
                      PRECIO PREMIUM DEL ALGORITMO
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Tasa de conversión única
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-600 tracking-tight font-mono block">
                      {getPremiumFee(importResolution)} PX
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans block">
                      Saldo: {userProfile?.pixel_tokens_balance || 0} PX
                    </span>
                  </div>
                </div>

                {/* Warnings / Action buttons row */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      setUploadedImgSrc(null);
                      setPixelatedBlueprint(null);
                      setImportStatus(null);
                      triggerBeep(349.23, "sine", 0.05);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm tracking-wide rounded-full transition-all cursor-pointer text-center"
                  >
                    Otra Imagen
                  </button>
                  <button
                    onClick={handleApplyPremiumBlueprint}
                    disabled={isAnalyzingImg}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm tracking-wide rounded-full shadow-lg shadow-indigo-600/10 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] text-center"
                  >
                    Confirmar y Plasmar
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
