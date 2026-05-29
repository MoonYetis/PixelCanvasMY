import { useEffect, useRef, useState, MouseEvent, WheelEvent } from "react";
import { PixelData, UserProfile } from "../types";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Move, 
  Coins, 
  Check, 
  Trash2, 
  Crosshair, 
  Layers,
  Sparkles,
  Eraser,
  Trophy,
  Shield,
  HelpCircle,
  HelpCircle as InfoIcon
} from "lucide-react";

interface CanvasBoardProps {
  pixels: Record<string, PixelData>;
  currentAddress: string;
  userProfile: UserProfile | null;
  charges: number;
  maxCharges: number;
  onPaintPixels: (pixels: { x: number; y: number; color: string }[], currency: "FB" | "MOONYETIS") => Promise<any>;
  onTriggerStore: () => void;
  onTriggerProfile: () => void;
}

const PALETTE = [
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
  "transparent", // Correction Eraser
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

export default function CanvasBoard({
  pixels,
  currentAddress,
  userProfile,
  charges,
  maxCharges,
  onPaintPixels,
  onTriggerStore,
  onTriggerProfile,
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasCenteredRef = useRef(false);

  // Viewport zoom level and translation offsets (Center initially on Europe/America mesh)
  const [zoom, setZoom] = useState<number>(1.8);
  const [panX, setPanX] = useState<number>(20);
  const [panY, setPanY] = useState<number>(20);

  const [selectedColor, setSelectedColor] = useState<string>("#9333ea"); // Default purple
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);

  // Coordinates warping teleporter
  const [teleportX, setTeleportX] = useState<number>(490);
  const [teleportY, setTeleportY] = useState<number>(230);

  // Staging checkout basket
  const [stagedPixels, setStagedPixels] = useState<Record<string, string>>({}); // "x,y" : hexColor
  const [chosenCurrency, setChosenCurrency] = useState<"FB" | "MOONYETIS">("FB");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visual helper toggles
  const [showStagingPanel, setShowStagingPanel] = useState(true);
  const [showGridLines, setShowGridLines] = useState(false);

  // Map background projection mode presets (fixed to voyager)
  const [mapMode, setMapMode] = useState<"tactical" | "satellite" | "voyager" | "classic">("voyager");
  
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

  // Canvas drawing effect handles layers of geography and painted inputs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw solid pristine light ocean background
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw map layer (Tactical / Satellite / Voyager / Classic hand-drawn outline fallback)
    let mapDrawSuccess = false;

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

    // 5. Optionally draw high precision 1px grid lines (only visible when zooming in high values)
    if (showGridLines || zoom >= 6) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      ctx.lineWidth = 0.25;
      for (let i = 0; i <= canvas.width; i += 10) {
         ctx.beginPath();
         ctx.moveTo(i, 0);
         ctx.lineTo(i, canvas.height);
         ctx.stroke();

         ctx.beginPath();
         ctx.moveTo(0, i);
         ctx.lineTo(canvas.width, i);
         ctx.stroke();
      }
    }

    // 6. Draw all committed pixels on top
    Object.keys(pixels).forEach((key) => {
      const p = pixels[key];
      if (p.x >= 0 && p.x < canvasWidth && p.y >= 0 && p.y < canvasHeight) {
        // If color is transparent/deleted, we let the continent show or paint ocean
        if (p.color === "transparent") {
          return; // Skip drawing transparent ones to allow erasure
        }
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 1, 1);
      }
    });

    // 7. Draw staged pixels currently in staging basket
    Object.keys(stagedPixels).forEach((key) => {
      const [sx, sy] = key.split(",").map(Number);
      const col = stagedPixels[key];
      
      if (col === "transparent") {
        // Erase preview
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sx, sy, 1, 1);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
        ctx.lineWidth = 0.2;
        ctx.strokeRect(sx, sy, 1, 1);
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(sx, sy, 1, 1);
        // Highlight active edits nicely with high contrast dark stroke for light theme map
        ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
        ctx.lineWidth = 0.15;
        ctx.strokeRect(sx, sy, 1, 1);
      }
    });
  }, [pixels, stagedPixels, zoom, showGridLines, mapMode, tacticalCanvas, satelliteCanvas, voyagerCanvas]);

  // Viewport zoom operations
  const handleZoomOffset = (direction: "in" | "out") => {
    const container = containerRef.current;
    if (!container) return;

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    const pixelX = (centerX - panX) / zoom;
    const pixelY = (centerY - panY) / zoom;

    let newZoom = zoom;
    if (direction === "in" && zoom < 32) newZoom = Number((zoom * 1.5).toFixed(2));
    if (direction === "out" && zoom > 0.4) newZoom = Number((zoom / 1.5).toFixed(2));

    setZoom(newZoom);
    setPanX(centerX - pixelX * newZoom);
    setPanY(centerY - pixelY * newZoom);
  };

  const handleWheelAction = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? "in" : "out";
    handleZoomOffset(direction);
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

  // Pan interactions
  const handleMouseDownAction = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click drag
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMoveAction = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDragging) {
      setPanX(e.clientX - dragStart.current.x);
      setPanY(e.clientY - dragStart.current.y);
    } else {
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
    if (!isDragging) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const localX = e.clientX - rect.left - panX;
        const localY = e.clientY - rect.top - panY;

        const px = Math.floor(localX / zoom);
        const py = Math.floor(localY / zoom);

        if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
          setSelectedPixel({ x: px, y: py });

          // Directly stage pixel on click to make it extremely immediate (wplace workflow)
          const key = `${px},${py}`;
          setStagedPixels((prev) => ({
            ...prev,
            [key]: selectedColor,
          }));
        }
      }
    }
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
  const costPerPixel = chosenCurrency === "MOONYETIS" ? 50 : 0.01;
  const totalStagedCost = stagedCount * costPerPixel;

  const handleSendBatch = async () => {
    if (!currentAddress) {
      // Prompt wallet profile connection dialog
      onTriggerProfile();
      return;
    }
    if (stagedCount === 0) {
      alert("Please choose a color and click points on the map to stage pixels first!");
      return;
    }
    if (charges < stagedCount) {
      alert(`⚠️ Energy depleted! You have ${charges}/${maxCharges} charges left. Place fewer pixels or wait for auto-regeneration (+1 every 10s). You can also boost charges in Store!`);
      return;
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
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Verify transactions: painting failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPixelDetails: PixelData | null = selectedPixel
    ? pixels[`${selectedPixel.x},${selectedPixel.y}`] || null
    : null;

  return (
    <div id="full-screen-wplace-canvas" className="relative w-full h-full flex-1 bg-[#f8fafc] overflow-hidden rounded-2xl border border-slate-200/60 shadow-xl select-none">
      
      {/* 100% Bleed Map Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownAction}
        onMouseMove={handleMouseMoveAction}
        onMouseUp={handleMouseUpAction}
        onWheel={handleWheelAction}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute origin-top-left shadow-2xl"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* HUD: Center Coordinates Overlay (Float top center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-lg border border-slate-200/80 rounded-full py-1.5 px-4 flex items-center justify-center gap-3.5 shadow-xl">
          <div className="flex items-center gap-1 shrink-0">
            <Crosshair className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">COORDINATE INDEX</span>
          </div>
          
          <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-[120px] justify-center">
            <span className="text-purple-600">X:</span>
            <span className="text-slate-800 bg-slate-50 border border-slate-200 py-0.5 px-1.5 rounded">{hoveredPixel ? hoveredPixel.x : (selectedPixel ? selectedPixel.x : "-")}</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-purple-600">Y:</span>
            <span className="text-slate-800 bg-slate-50 border border-slate-200 py-0.5 px-1.5 rounded">{hoveredPixel ? hoveredPixel.y : (selectedPixel ? selectedPixel.y : "-")}</span>
          </div>

          <button 
            onClick={() => {
              setShowGridLines(!showGridLines);
              triggerBeep(330, "sine", 0.05);
            }}
            className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded transition-all cursor-pointer ${showGridLines ? "bg-purple-650/15 text-purple-600 border border-purple-500/30 font-extrabold" : "bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200"}`}
          >
            GRID
          </button>
        </div>

        {/* Loading GIS Map Tiles badge */}
        {loadingMaps && (
          <div className="bg-purple-950/90 border border-purple-500/40 rounded-full px-3 py-1 flex items-center gap-1.5 animate-pulse shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span className="text-[8px] font-mono font-bold text-purple-300 uppercase tracking-widest">
              STREAMING GLOBAL GIS CORE MAP...
            </span>
          </div>
        )}

        {/* Projection Mode selected as Voyager Geo */}
      </div>

      {/* FLOAT: Controls HUD (Pill float right side) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2">
        <div className="flex flex-col bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg p-1.5 shadow-xl">
          <button
            onClick={() => handleZoomOffset("in")}
            className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="text-[10px] font-mono text-purple-600 text-center font-bold my-1 border-y border-slate-200 py-1">
            {zoom}x
          </div>

          <button
            onClick={() => handleZoomOffset("out")}
            className="p-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-px bg-slate-200 my-1"></div>

          <button
            onClick={() => warpToLocation(490, 230)}
            className="p-2 rounded hover:bg-slate-100 text-purple-600 hover:text-purple-700 transition-all cursor-pointer"
            title="Center Europe"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FLOAT: Teleporter input (Bottom left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-[280px]">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
            <Move className="w-3.5 h-3.5 text-indigo-500" />
            <span>Map Teleporter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2.5 py-1 max-w-[80px]">
              <span className="text-[9px] font-mono text-slate-400 mr-1 font-bold">X</span>
              <input
                type="number"
                min="0"
                max="999"
                value={teleportX}
                onChange={(e) => setTeleportX(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                className="w-full bg-transparent text-slate-800 focus:outline-none font-mono text-xs font-semibold"
              />
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2.5 py-1 max-w-[80px]">
              <span className="text-[9px] font-mono text-slate-400 mr-1 font-bold">Y</span>
              <input
                type="number"
                min="0"
                max="999"
                value={teleportY}
                onChange={(e) => setTeleportY(Math.max(0, Math.min(999, parseInt(e.target.value) || 0)))}
                className="w-full bg-transparent text-slate-800 focus:outline-none font-mono text-xs font-semibold"
              />
            </div>
            <button
              onClick={() => warpToLocation(teleportX, teleportY)}
              className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              Warp
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BOTTOM CONTAINER (Palette Docks, Staging Drawers, Charges systems) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 flex flex-col items-center gap-3">
        
        {/* CHECKOUT CART DRAWER: Displays when pixels are staged in the palette basket */}
        {stagedCount > 0 && showStagingPanel && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-sans font-bold text-xs text-slate-900">Painting Basket ({stagedCount} px)</h4>
              </div>
              <button
                onClick={clearStagedBasket}
                className="text-slate-450 hover:text-red-550 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                title="Discard basket changes"
              >
                <Trash2 className="w-3 h-3" />
                Clear Space
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Payment Token Selector */}
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-slate-450 uppercase tracking-widest block">Fuel Token</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setChosenCurrency("FB")}
                    className={`py-1 px-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                      chosenCurrency === "FB"
                        ? "border-yellow-550 bg-yellow-50"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    }`}
                  >
                    <span className="text-[8px] font-mono text-slate-500 leading-none">Coins</span>
                    <span className="text-[10px] font-bold text-yellow-650 mt-0.5">0.01 W</span>
                  </button>

                  <button
                    onClick={() => setChosenCurrency("MOONYETIS")}
                    className={`py-1 px-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                      chosenCurrency === "MOONYETIS"
                        ? "border-purple-550 bg-purple-50"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50"
                    }`}
                  >
                    <span className="text-[8px] font-mono text-slate-500 leading-none">Yeti</span>
                    <span className="text-[10px] font-bold text-purple-600 mt-0.5">50 MY</span>
                  </button>
                </div>
              </div>

              {/* Cost Box */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9px] text-slate-500">
                  <span>Placing energy:</span>
                  <span className={`font-mono font-bold ${charges < stagedCount ? "text-red-500" : "text-purple-650"}`}>
                    -{stagedCount} Charge {charges < stagedCount ? "⚠️" : ""}
                  </span>
                </div>
                <div className="border-t border-slate-200/60 pt-1.5 flex justify-between items-center text-[10px] font-mono text-slate-800">
                  <span>TOTAL ESTIMATED:</span>
                  <span className="text-emerald-600 font-bold">
                    {totalStagedCost.toFixed(chosenCurrency === "FB" ? 3 : 0)} {chosenCurrency === "FB" ? "Coins" : "MY"}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Action Trigger */}
            <button
              onClick={handleSendBatch}
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                charges < stagedCount
                  ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/10 active:scale-98"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-200" />
                  Painting world map...
                </>
              ) : charges < stagedCount ? (
                `Depleted: Require Refill (+${stagedCount - charges} Energy)`
              ) : !currentAddress ? (
                "Verify profile & Connect Faucet"
              ) : (
                <>
                  <Check className="w-4 h-4 text-white animate-pulse" />
                  Paint these {stagedCount} Pixels
                </>
              )}
            </button>
          </div>
        )}

        {/* Selected Pixel Inspector details */}
        {selectedPixel && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-slate-250 rounded-xl p-2 px-3.5 shadow-md flex items-center justify-between text-[11px] font-mono text-slate-800">
            <div className="flex items-center gap-2 max-w-[70%] text-slate-700">
              <span 
                className="w-2.5 h-2.5 rounded-sm border border-slate-300 shrink-0" 
                style={{ backgroundColor: selectedPixelDetails?.color || "#64748b" }} 
              />
              <div className="truncate">
                <span>Selected: </span>
                <strong className="text-indigo-600">[{selectedPixel.x}, {selectedPixel.y}]</strong>
                {selectedPixelDetails ? (
                  <span> • Owner: <span className="text-purple-600 font-bold">{selectedPixelDetails.owner.substring(0, 8)}...</span></span>
                ) : (
                  <span className="text-emerald-600"> • Vacant Space</span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedPixel(null)}
              className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Curved Glass Color Dock */}
        <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full py-2 px-3.5 shadow-xl flex flex-col gap-1.5 text-slate-800">
          
          {/* Progress bar of current painting charges (True wplace.live mechanics) */}
          <div className="flex items-center justify-between text-[8px] font-mono px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase tracking-widest font-semibold">Charges Left:</span>
              <span className={`font-bold ${charges < 10 ? "text-red-500 animate-pulse" : "text-emerald-600"}`}>
                {charges}/{maxCharges} px
              </span>
            </div>
            <div className="text-slate-500 text-right">
              {charges < maxCharges ? (
                <span className="animate-pulse">Regen in progress (+1 pixel/10s)...</span>
              ) : (
                <span className="text-emerald-600 font-bold">READY TO PAINT</span>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(charges / maxCharges) * 100}%` }}
            />
          </div>

          <div className="h-[1px] bg-slate-100 my-0.5"></div>

          {/* Color Pallet Circle Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-start items-center gap-1.5 overflow-x-auto scrollbar-none max-w-[88%] pr-2">
              {PALETTE.map((color) => (
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
                  }}
                  className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full shrink-0 border relative transition-all active:scale-90 cursor-pointer ${
                    selectedColor === color 
                      ? "border-slate-800 scale-110 shadow-md" 
                      : "border-slate-200 hover:border-slate-400 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color === "transparent" ? "#ff000000" : color }}
                  title={color === "transparent" ? "Eraser Brush" : color}
                >
                  {color === "transparent" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-full border border-red-200">
                      <Eraser className="w-3.5 h-3.5 text-red-500" />
                    </span>
                  )}
                  {selectedColor === color && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-slate-200 mx-1"></div>

            {/* Toggle staged list */}
            <button
              onClick={() => setShowStagingPanel(!showStagingPanel)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${stagedCount > 0 ? "bg-purple-550/15 text-purple-600 animate-pulse" : "text-slate-400 hover:text-slate-800"}`}
              title="Toggle Basket checkout drawer"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
