import React, { useState, useEffect, FormEvent } from "react";
import { PixelData, UserProfile, PaintTransaction, BlockchainBlock } from "./types";
import CanvasBoard from "./components/CanvasBoard";
import GoogleSignInPopup from "./components/GoogleSignInPopup";
import { 
  Flame, 
  Terminal as TerminalIcon, 
  Layers, 
  Activity, 
  Globe, 
  Database, 
  Cpu, 
  RefreshCw,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Coins,
  ShieldAlert,
  Sliders,
  Wallet,
  Play,
  HeartHandshake,
  ShoppingBag,
  Trophy,
  Info,
  ChevronRight,
  Clock,
  Settings,
  Sparkles,
  Check,
  X,
  User,
  HelpCircle,
  Hash,
  MessageSquare,
  Send,
  LayoutDashboard,
  Zap,
  ArrowDown,
  Plus
} from "lucide-react";

// Curated flags selection list
const AVAILABLE_FLAGS = [
  { code: "🇺🇸", name: "United States" },
  { code: "🇪🇸", name: "Spain" },
  { code: "🇲🇽", name: "Mexico" },
  { code: "🇧🇷", name: "Brazil" },
  { code: "🇩🇪", name: "Germany" },
  { code: "🇫🇷", name: "France" },
  { code: "🇯🇵", name: "Japan" },
  { code: "🇬🇧", name: "United Kingdom" },
  { code: "🇨🇦", name: "Canada" },
  { code: "🇨🇳", name: "China" },
  { code: "🇮🇹", name: "Italy" },
  { code: "🇦🇷", name: "Argentina" },
  { code: "🇨🇴", name: "Colombia" },
  { code: "👾", name: "Retro Yeti Clan" },
  { code: "🛸", name: "Alien Nation" }
];

// Curated virtual store item list
const STORE_ITEMS = [
  { id: "charge_refill", title: "Instant Refuel", desc: "Top up +50 Charges to bypass cooldown constraints", cost_px: 15, reward: "refill" },
  { id: "brush_auras", title: "VIP Highlight Brush", desc: "Show flashy neon aura when custom placing pixels", cost_px: 50, reward: "glow" },
  { id: "max_cap_1", title: "Core Booster limit", desc: "Permanently expand maximum energy capacity to 100", cost_px: 100, reward: "cap100" },
  { id: "max_cap_2", title: "Colossal Reservoir", desc: "Permanently expand maximum energy capacity to 200", cost_px: 180, reward: "cap200" }
];

export default function App() {
  const [address, setAddress] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pixels, setPixels] = useState<Record<string, PixelData>>({});
  const [recentFeeds, setRecentFeeds] = useState<PixelData[]>([]);
  const [txHistory, setTxHistory] = useState<PaintTransaction[]>([]);
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);

  // Simulation active metrics
  const [onlineCount, setOnlineCount] = useState<number>(142);

  // Real-time Wplace board chats
  const [chats, setChats] = useState<any[]>([]);
  const [newChatText, setNewChatText] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Web Audio synth click/beep generator for authentic retro feel
  const triggerTone = (freq = 440, type: OscillatorType = "sine", duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // fail silently when browser blocks non-interactive audio play
    }
  };

  // State for VIP Highlight Brush
  const [hasGlowBrush, setHasGlowBrush] = useState<boolean>(() => {
    return typeof window !== "undefined" && localStorage.getItem("wplace_glow_brush") === "true";
  });

  // Active Charges Cooldown limit (wplace energy framework)
  const [maxCharges, setMaxCharges] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    const saved = localStorage.getItem("wplace_max_charges");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [charges, setCharges] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    const currentSaved = localStorage.getItem("wplace_charges");
    if (currentSaved) return parseInt(currentSaved, 10);
    const saved = localStorage.getItem("wplace_max_charges");
    return saved ? parseInt(saved, 10) : 50;
  });

  // Persist current charges to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wplace_charges", charges.toString());
    }
  }, [charges]);

  // Interactive UI panel navigation layout (Sleek minimalist sidebar)
  // Options: null | "store" | "leaderboard" | "feed" | "rules" | "developer_rpc"
  const [activeMenuOverlay, setActiveMenuOverlay] = useState<string | null>(null);

  // DEX Swap Interface State (Uniswap styles)
  const [swapPayToken, setSwapPayToken] = useState<"FB" | "MOONYETIS">("FB");
  const [swapPayAmount, setSwapPayAmount] = useState<string>("0.5");

  // Modals layout
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);

  // Profile customization fields
  const [tempUsername, setTempUsername] = useState("");
  const [tempFlag, setTempFlag] = useState("🇺🇸");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Faucet indicators
  const [faucetLoading, setFaucetLoading] = useState<string | null>(null);

  // Developer Node Terminal RPC state
  const [selectedCliCommand, setSelectedCliCommand] = useState<string>("getblockchaininfo");
  const [customCliArgs, setCustomCliArgs] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "// MoonYetis Wplace Node Command Shell\n// Select a preconfigured command or construct query to interact with the simulated Fractal Bitcoin JSON-RPC node."
  );
  const [isTerminalLoading, setIsTerminalLoading] = useState<boolean>(false);

  // Initial loads and background polling intervals
  useEffect(() => {
    // Generate a default Sandbox address or read session
    const storedAddr = localStorage.getItem("wplace_address");
    if (storedAddr) {
      setAddress(storedAddr);
    } else {
      // Auto-assign random tester address so page is instantly active (wplace play sandbox style!)
      const chars = "abcdef0123456789";
      let randomStr = "";
      for (let i = 0; i < 58; i++) {
        randomStr += chars[Math.floor(Math.random() * chars.length)];
      }
      const initialAddr = "bc1p" + randomStr;
      localStorage.setItem("wplace_address", initialAddr);
      setAddress(initialAddr);
    }

    fetchCanvasState();
    fetchBlockchainState();
    fetchChats();

    const interval = setInterval(() => {
      fetchCanvasState();
      fetchBlockchainState();
      fetchChats();
      
      // Randomize online user counts slightly to simulate vibrant environment
      setOnlineCount((c) => Math.max(120, Math.min(210, c + Math.floor(Math.random() * 5) - 2)));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sync profile when wallet address connects or upgrades
  useEffect(() => {
    if (address) {
      fetchUserProfile();
    }
  }, [address]);

  // Client-Side Charges Cooldown loop: regenerates +1 charge every 10 seconds up to maxCharges limit.
  useEffect(() => {
    const timer = setInterval(() => {
      setCharges((currentCharges) => {
        if (currentCharges < maxCharges) {
          return currentCharges + 1;
        }
        return currentCharges;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [maxCharges]);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.error("Failed to load chat room messages:", e);
    }
  };

  const sendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setIsSendingChat(true);
    triggerTone(523, "triangle", 0.05); // Play retro blip click!
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          text: newChatText
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChats(data.chat);
          setNewChatText("");
        }
      }
    } catch (e) {
      console.error("Error sending chat text:", e);
    } finally {
      setIsSendingChat(false);
    }
  };

  const fetchCanvasState = async () => {
    try {
      const res = await fetch("/api/canvas");
      if (res.ok) {
        const data = await res.json();
        setPixels(data);
      }

      const feedRes = await fetch("/api/feed");
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setRecentFeeds(feedData);
      }
    } catch (e) {
      console.error("Failed to load map canvas pixels:", e);
    }
  };

  const fetchBlockchainState = async () => {
    try {
      const blocksRes = await fetch("/api/blocks");
      if (blocksRes.ok) {
        const blocksData = await blocksRes.json();
        setBlocks(blocksData);
      }

      const txsRes = await fetch("/api/transactions");
      if (txsRes.ok) {
        const txsData = await txsRes.json();
        setTxHistory(txsData);
      }
    } catch (e) {
      console.error("Failed to load blockchain syncing history:", e);
    }
  };

  const fetchUserProfile = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/users/profile/${address}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setTempUsername(data.username);
        setTempFlag(data.flag_emoji || "🇺🇸");
      }
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  };

  // Profile customized change dispatcher
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsUpdatingProfile(true);

    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          username: tempUsername,
          flagEmoji: tempFlag
        })
      });

      if (res.ok) {
        const bodyValue = await res.json();
        if (bodyValue.success) {
          setProfile(bodyValue.profile);
          setShowProfileSelector(false);
        }
      }
    } catch (err) {
      console.error("Failed updating profile details:", err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const triggerFaucet = async (tokenType: "FB" | "MOONYETIS" | "PX") => {
    if (!address) return;
    setFaucetLoading(tokenType);
    try {
      const response = await fetch("/api/wallet/sim-faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, type: tokenType }),
      });
      if (response.ok) {
        await fetchUserProfile();
        // Immediately refuel charges on faucet hit for awesome testing!
        setCharges(maxCharges);
      }
    } catch (err) {
      console.error("Faucet error:", err);
    } finally {
      setFaucetLoading(null);
    }
  };

  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const triggerTokenSwap = async (fromCurrency: "FB" | "MOONYETIS", fromAmount: number, pxAmount: number) => {
    if (!address || !profile) {
      alert("Please connect the painter wallet first.");
      return;
    }
    setIsSwapping(true);
    try {
      const response = await fetch("/api/wallet/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          fromCurrency,
          fromAmount,
          pxAmount
        })
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "Token swap transaction failed.");
        return;
      }
      alert(result.message || "Swap transaction committed and confirmed on-chain!");
      await fetchUserProfile();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Exchange connection failed.");
    } finally {
      setIsSwapping(false);
    }
  };

  const handlePaintSubmit = async (
    paintPixelsArr: { x: number; y: number; color: string }[],
    currency: "FB" | "MOONYETIS" | "PX"
  ) => {
    try {
      const response = await fetch("/api/pixels/paint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          pixels: paintPixelsArr,
          currency,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Payment verification failed");
      }

      // Deduct client-side interactive charges
      setCharges((c) => Math.max(0, c - paintPixelsArr.length));

      // Refresh states
      await fetchUserProfile();
      await fetchCanvasState();
      await fetchBlockchainState();

      return result;
    } catch (err: any) {
      throw err;
    }
  };

  // Virtual store purchases
  const handlePurchaseItem = async (item: typeof STORE_ITEMS[0]) => {
    if (!address || !profile) {
      alert("Profile validation missing.");
      return;
    }

    const price = item.cost_px;
    if ((profile.pixel_tokens_balance || 0) < price) {
      alert(`⚠️ Insufficient Pixel Tokens balance (Needs: ${price} PX). Buy Pixel Tokens with $FB or MoonYetis in the Store panel!`);
      return;
    }

    try {
      const response = await fetch("/api/wallet/buy-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, itemId: item.id, costPx: price })
      });

      if (!response.ok) {
        const errVal = await response.json();
        alert(errVal.error || "Unlock failed.");
        return;
      }

      if (item.reward === "refill") {
        setCharges(maxCharges);
        alert(`⚡ Refueling successful! Your energy has been boosted back to ${maxCharges}/${maxCharges} Charges.`);
      } else if (item.reward === "cap100") {
        setMaxCharges(100);
        setCharges(100);
        localStorage.setItem("wplace_max_charges", "100");
        alert(`⚡ Core boosted! Memory limit expanded to 100 max charges.`);
      } else if (item.reward === "cap200") {
        setMaxCharges(200);
        setCharges(200);
        localStorage.setItem("wplace_max_charges", "200");
        alert(`⚡ Colossal booster! Capacity upgraded to 200 max charges.`);
      } else if (item.reward === "glow") {
        setHasGlowBrush(true);
        localStorage.setItem("wplace_glow_brush", "true");
        alert("✨ Neon Highlight Brush acquired! The stroke edges will now glow during pixel edits.");
      }

      await fetchUserProfile();
    } catch (err) {
      console.error(err);
      alert("Item purchase failed.");
    }
  };

  // Execute JSON-RPC interface command
  const handleExecuteCli = async (cmdOverride?: string, argsOverride?: string[]) => {
    setIsTerminalLoading(true);
    const command = cmdOverride || selectedCliCommand;
    let finalArgs: string[] = [];

    if (argsOverride) {
      finalArgs = argsOverride;
    } else {
      finalArgs = customCliArgs ? customCliArgs.split(" ").filter(Boolean) : [];
    }

    try {
      const response = await fetch("/api/rpc/cmd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: command, args: finalArgs }),
      });
      
      const resData = await response.json();
      setTerminalOutput(
        `$ bitcoin-cli -conf=/home/nodo/.fractal/bitcoin.conf -rpcwallet=wplace_node ${command} ${finalArgs.join(" ")}\n\n` +
        JSON.stringify(resData, null, 2)
      );
    } catch (err: any) {
      setTerminalOutput(`Error executing RPC call: ${err?.message || err}`);
    } finally {
      setIsTerminalLoading(false);
    }
  };

  // Reset Sandbox Address
  const handleRegenerateSessionAddress = () => {
    const chars = "abcdef0123456789";
    let randomStr = "";
    for (let i = 0; i < 58; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
    const finalAddr = "bc1p" + randomStr;
    localStorage.setItem("wplace_address", finalAddr);
    // Clear Google session details on full wipe too
    localStorage.removeItem("wplace_google_email");
    localStorage.removeItem("wplace_google_name");
    setAddress(finalAddr);
    alert(`💡 New Taproot Sandbox address established! Your credentials and painting logs have been refreshed: ${finalAddr}`);
  };

  // Google Sign-In & Logout Handlers
  const handleGoogleLoginSuccess = async (email: string, name: string, avatarUrl: string) => {
    try {
      const response = await fetch("/api/users/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          avatarUrl,
          currentAddress: address
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          const userProf = data.profile;
          setAddress(userProf.address);
          setProfile(userProf);
          localStorage.setItem("wplace_address", userProf.address);
          localStorage.setItem("wplace_google_email", email);
          localStorage.setItem("wplace_google_name", name);
          setTempUsername(userProf.username);
          setTempFlag(userProf.flag_emoji || "🇺🇸");
          setShowGooglePopup(false);
        }
      }
    } catch (err) {
      console.error("Google authentication integration failed:", err);
    }
  };

  const handleGoogleLogout = () => {
    localStorage.removeItem("wplace_google_email");
    localStorage.removeItem("wplace_google_name");
    triggerTone(329.63, "sine", 0.08);
    
    const chars = "abcdef0123456789";
    let randomStr = "";
    for (let i = 0; i < 58; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
    const finalAddr = "bc1p" + randomStr;
    localStorage.setItem("wplace_address", finalAddr);
    setAddress(finalAddr);
    
    setTimeout(() => {
      fetchUserProfile();
    }, 100);
  };

  // Generate fake high score nations leaderboard list (Mimicking wplace.live leaderboard metrics)
  const scoreboards = [
    { rank: 1, flag: "🇺🇸", country: "United States", user: "Satoshi_Art", pixels: 1450, color: "#e11d48" },
    { rank: 2, flag: "🇪🇸", country: "Spain", user: "Yeti_Patron", pixels: 980, color: "#9333ea" },
    { rank: 3, flag: "🇲🇽", country: "Mexico", user: "Pixel_Azteca", pixels: 820, color: "#10b981" },
    { rank: 4, flag: "🇧🇷", country: "Brazil", user: "Giga_Yeti", pixels: 690, color: "#eab308" },
    { rank: 5, flag: "🇯🇵", country: "Japan", user: "TokyoNeon", pixels: 512, color: "#3b82f6" },
    { rank: 6, flag: profile?.flag_emoji || "🇺🇸", country: "You", user: profile?.username || "Guest", pixels: profile?.total_pixels_owned || 0, color: "#a855f7" }
  ].sort((a,b) => b.pixels - a.pixels).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f8fafc] text-slate-800 font-sans flex flex-col overflow-hidden select-none">
      
      {/* 1. IMMERSIVE CANVAS CONTAINER (Spans the complete screen view!) */}
      <div className="absolute inset-0 w-full h-full z-0 flex flex-col justify-end">
        <CanvasBoard
          pixels={pixels}
          currentAddress={address}
          userProfile={profile}
          charges={charges}
          maxCharges={maxCharges}
          hasGlowBrush={hasGlowBrush}
          onPaintPixels={handlePaintSubmit}
          onTriggerStore={() => setActiveMenuOverlay(activeMenuOverlay === "store" ? null : "store")}
          onTriggerProfile={() => setShowProfileSelector(true)}
          activeMenuOverlay={activeMenuOverlay}
          onToggleMenuOverlay={(overlay) => setActiveMenuOverlay(activeMenuOverlay === overlay ? null : overlay)}
          onlineCount={onlineCount}
        />
      </div>

      {/* 4. MODULAR MENU OVERLAYS: Slide-in white card overlays (Right-aligned next to controls deck) */}
      {activeMenuOverlay && (
        <div className="absolute top-20 right-20 z-30 w-full max-w-sm max-h-[75vh] select-none pointer-events-auto animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between max-h-[75vh] overflow-y-auto scrollbar-none text-slate-800">
            
            {/* Slide heading */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3.5">
              <div className="flex items-center gap-2">
                {activeMenuOverlay === "dashboard" && <LayoutDashboard className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />}
                {activeMenuOverlay === "store" && <ShoppingBag className="w-4.5 h-4.5 text-purple-600" />}
                {activeMenuOverlay === "leaderboard" && <Trophy className="w-4.5 h-4.5 text-yellow-600" />}
                {activeMenuOverlay === "chat" && <MessageSquare className="w-4.5 h-4.5 text-purple-600" />}
                {activeMenuOverlay === "feed" && <Activity className="w-4.5 h-4.5 text-emerald-600" />}
                {activeMenuOverlay === "rules" && <BookOpen className="w-4.5 h-4.5 text-blue-600" />}
                {activeMenuOverlay === "developer_rpc" && <TerminalIcon className="w-4.5 h-4.5 text-indigo-600" />}

                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {activeMenuOverlay === "dashboard" ? "Painter Dashboard" : activeMenuOverlay.replace("_", " ")}
                </span>
              </div>
              
              <button
                onClick={() => setActiveMenuOverlay(null)}
                className="p-1 rounded-full bg-slate-50 hover:bg-slate-150 border border-slate-100 text-slate-455 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OVERLAY PANEL DASHBOARD: PLAYER METRICS, COINS & FAUCETS */}
            {activeMenuOverlay === "dashboard" && (
              <div className="space-y-4 text-slate-800 animate-fade-in">
                <p className="text-[11px] text-slate-500 leading-normal border-b border-slate-100 pb-2">
                  Welcome to your painter central hub. Monitor block transactions, request free coins, and upgrade your map capacity.
                </p>

                {/* Profile Card Summary */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50 border border-indigo-100/65 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {profile?.google_email ? (
                      <div className="relative shrink-0">
                        <img 
                          src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(profile.google_email)}`} 
                          alt="Google Avatar" 
                          className="w-10 h-10 rounded-full border border-indigo-250 shadow-2xs"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-slate-100 shadow-3xs">
                          <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl leading-none bg-indigo-100/50 w-10 h-10 rounded-full flex items-center justify-center shrink-0" role="img" aria-label="your flag">
                        {profile?.flag_emoji || "🇺🇸"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 leading-snug flex items-center gap-1.5 min-w-0">
                        <span className="truncate max-w-[120px]">{profile?.username || "Guest Painter"}</span>
                        {profile?.google_email ? (
                          <span className="text-[7.5px] bg-blue-105 text-blue-700 px-1 py-0.2 rounded uppercase font-extrabold tracking-tight shrink-0 flex items-center gap-0.5">
                            Google Verified
                          </span>
                        ) : (
                          <span className="text-[7.5px] bg-slate-150 text-slate-600 px-1 py-0.2 rounded uppercase font-extrabold tracking-tight shrink-0">
                            Offline Sandbox
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-450 block truncate max-w-[150px] mt-0.5">
                        {address}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveMenuOverlay(null);
                      setShowProfileSelector(true);
                    }}
                    className="py-1 px-2 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 rounded text-[10px] font-bold text-slate-505 transition-all text-center cursor-pointer shadow-2xs shrink-0 ml-1.5"
                  >
                    Manage Profile
                  </button>
                </div>

                {/* Energy capacity metrics */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      COOLDOWN ENERGY
                    </span>
                    <span className="text-indigo-600">{charges}/{maxCharges} px</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/35">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${(charges / maxCharges) * 100}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-455 font-sans leading-relaxed">
                    {charges < maxCharges ? (
                      <span className="text-slate-500 italic animate-pulse">⚡ Recharging backup generator (+1 energy/10s)...</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">✓ Reactor fully loaded! Ready for custom drawings.</span>
                    )}
                  </p>
                </div>

                {/* Premium Pixel Token Balance */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-3.5 text-white flex justify-between items-center shadow-md shadow-purple-600/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-200 block font-bold leading-none">Internal Draw Currency</span>
                    <strong className="text-xl font-black tracking-tight block mt-1">
                      {profile ? (profile.pixel_tokens_balance ?? 150) : 150} PX
                    </strong>
                    <span className="text-[9px] text-indigo-100/80 font-sans block mt-1">
                      Used for drawings & store items (1 PX = 1 pixel)
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-300 animate-pulse" />
                  </div>
                </div>

                {/* Real-time trading assets balance vault */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Your Trading Balances</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-2xs flex flex-col justify-between">
                      <span className="text-[9px] font-mono text-slate-400 font-bold block">Coins ($FB)</span>
                      <strong className="text-yellow-600 font-black text-sm tracking-tight block mt-0.5">
                        {profile ? profile.fb_balance.toFixed(2) : "0.00"} W
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-2xs flex flex-col justify-between">
                      <span className="text-[9px] font-mono text-slate-400 font-bold block">Yeti Clans (MY)</span>
                      <strong className="text-purple-600 font-black text-sm tracking-tight block mt-0.5 font-mono">
                        {profile ? (profile.mooneyetis_balance ?? profile.my_balance ?? 0).toLocaleString() : "0"} MY
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Token Swap Box */}
                <div className="border border-slate-200 bg-slate-50/50 p-2.5 rounded-xl space-y-2">
                  <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-bold block">Pixel Token Exchange (Buy PX)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200/80 p-2 rounded-lg flex flex-col justify-between">
                      <span className="text-[10px] font-black text-slate-700 block">0.5 FB ➔ 50 PX</span>
                      <button
                        onClick={() => triggerTokenSwap("FB", 0.5, 50)}
                        disabled={isSwapping}
                        className="mt-1.5 py-1 px-1.5 bg-yellow-50 hover:bg-yellow-105 text-yellow-850 text-[10px] rounded font-bold transition-all cursor-pointer text-center active:scale-95 border border-yellow-250/65"
                      >
                        {isSwapping ? "Saving..." : "Swap 0.5 FB"}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-2 rounded-lg flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white font-mono text-[7px] px-1 py-0.2 rounded-bl scale-90">Bonus</div>
                      <span className="text-[10px] font-black text-slate-700 block">1.0 FB ➔ 120 PX</span>
                      <button
                        onClick={() => triggerTokenSwap("FB", 1.0, 120)}
                        disabled={isSwapping}
                        className="mt-1.5 py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold transition-all cursor-pointer text-center active:scale-95 border border-emerald-250/65"
                      >
                        {isSwapping ? "Saving..." : "Swap 1.0 FB"}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-2 rounded-lg flex flex-col justify-between">
                      <span className="text-[10px] font-black text-slate-700 block">250 MY ➔ 50 PX</span>
                      <button
                        onClick={() => triggerTokenSwap("MOONYETIS", 250, 50)}
                        disabled={isSwapping}
                        className="mt-1.5 py-1 px-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] rounded font-bold transition-all cursor-pointer text-center active:scale-95 border border-purple-250/65"
                      >
                        {isSwapping ? "Saving..." : "Swap 250 MY"}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-2 rounded-lg flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-purple-500 text-white font-mono text-[7px] px-1 py-0.2 rounded-bl scale-90">Bonus</div>
                      <span className="text-[10px] font-black text-slate-700 block">500 MY ➔ 120 PX</span>
                      <button
                        onClick={() => triggerTokenSwap("MOONYETIS", 500, 120)}
                        disabled={isSwapping}
                        className="mt-1.5 py-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-805 text-[10px] rounded font-bold transition-all cursor-pointer text-center active:scale-95 border border-indigo-250/65"
                      >
                        {isSwapping ? "Saving..." : "Swap 500 MY"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Taproot Faucets (No configuration or metadata required!) */}
                <div className="p-3 bg-slate-50/60 border border-slate-250/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-bold">Dev Faucets</span>
                    <span className="text-[8px] bg-red-50 text-red-650 border border-red-105 rounded px-1 font-bold">Simulated assets</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => triggerFaucet("FB")}
                      disabled={faucetLoading !== null}
                      className="py-1 bg-yellow-50 hover:bg-yellow-105 text-yellow-750 border border-yellow-200 font-mono text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center shadow-2xs"
                    >
                      {faucetLoading === "FB" ? "Adding..." : "+5.0 Coins"}
                    </button>

                    <button
                      onClick={() => triggerFaucet("MOONYETIS")}
                      disabled={faucetLoading !== null}
                      className="py-1 bg-purple-50 hover:bg-purple-105 text-purple-750 border border-purple-200 font-mono text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center shadow-2xs"
                    >
                      {faucetLoading === "MOONYETIS" ? "Adding..." : "+2.5K Yeti"}
                    </button>

                    <button
                      onClick={() => triggerFaucet("PX")}
                      disabled={faucetLoading !== null}
                      className="py-1 bg-emerald-50 hover:bg-emerald-105 text-emerald-700 border border-emerald-200 font-mono text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center shadow-2xs"
                    >
                      {faucetLoading === "PX" ? "Adding..." : "+100 PX"}
                    </button>
                  </div>
                </div>

                {/* Quick actions info help */}
                <div className="text-[10px] text-slate-455 font-mono leading-relaxed bg-indigo-50/30 p-2 text-indigo-700 rounded-lg border border-indigo-100/40 flex items-center gap-1.5 justify-center">
                  <span>Current Painted Pixel count:</span>
                  <strong className="font-extrabold text-indigo-600 font-mono text-xs">
                    {profile?.total_pixels_owned || 0} px
                  </strong>
                </div>

              </div>
            )}

            {/* OVERLAY PANEL CHAT: COOPERATIVE PUBLIC CHATROOM */}
            {activeMenuOverlay === "chat" && (
              <div className="flex flex-col h-[480px] justify-between text-slate-800">
                <p className="text-[11px] text-slate-505 leading-normal pb-2 border-b border-slate-100">
                  Coordinate with other active players in the global sandboxed lobby to sketch flags or secure territory.
                </p>

                {/* Chat items scroll list */}
                <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1 max-h-[350px]">
                  {chats.length > 0 ? (
                    chats.map((msg) => (
                      <div 
                        key={msg.id} 
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2.5 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-sm leading-none">{msg.flag_emoji}</span>
                            <span className="font-bold text-purple-600 truncate max-w-[120px]">{msg.username}</span>
                            {msg.username === profile?.username && (
                              <span className="text-[8px] uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200/50 px-1 rounded">You</span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-750 leading-normal font-sans break-words pl-1.5 border-l-2 border-purple-300">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No active messages. Introduce yourself!
                    </div>
                  )}
                </div>

                {/* Post chat message form */}
                <form onSubmit={sendChatMessage} className="pt-2 border-t border-slate-100 flex gap-2">
                  <input
                    id="chat-box-input"
                    type="text"
                    maxLength={100}
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    placeholder="Type team plan..."
                    disabled={isSendingChat}
                    className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 font-sans"
                  />
                  <button
                    id="btn-chat-submit"
                    type="submit"
                    disabled={isSendingChat || !newChatText.trim()}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* OVERLAY PANEL A: STORE CATELOG */}
            {activeMenuOverlay === "store" && (
              <div className="space-y-4 text-slate-800 animate-fade-in pb-4">
                <p className="text-[11px] text-slate-500 leading-normal border-b border-slate-100 pb-2">
                  Exchange your coins or MoonYetis to buy Pixel Tokens (PX), then unlock high-fidelity boosters and energy upgrades!
                </p>

                {/* Wallet Balance Cards (Aesthetic dashboard chips) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-center">
                    <span className="text-[8px] font-mono uppercase text-slate-400 font-black block">Pixel Tokens</span>
                    <strong className="text-purple-600 text-sm font-black font-mono block mt-0.5">
                      {profile ? (profile.pixel_tokens_balance ?? 150) : 150} <span className="text-[9px]">PX</span>
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-center">
                    <span className="text-[8px] font-mono uppercase text-slate-400 font-black block">Fractal BTC</span>
                    <strong className="text-amber-600 text-sm font-black font-mono block mt-0.5 truncate" title={profile ? profile.fb_balance?.toString() : "2.5"}>
                      {profile ? (profile.fb_balance ?? 2.5).toFixed(2) : "2.50"} <span className="text-[9px]">FB</span>
                    </strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-center">
                    <span className="text-[8px] font-mono uppercase text-slate-400 font-black block">MoonYetis</span>
                    <strong className="text-indigo-600 text-sm font-black font-mono block mt-0.5 truncate">
                      {profile ? (profile.mooneyetis_balance ?? 1250) : 1250} <span className="text-[9px]">MY</span>
                    </strong>
                  </div>
                </div>

                {/* Swapper segment in the Store directly! */}
                {(() => {
                  const currentPayBalance = swapPayToken === "FB" 
                    ? (profile?.fb_balance ?? 2.5) 
                    : (profile?.mooneyetis_balance ?? 1250);

                  const parsedPayAmount = parseFloat(swapPayAmount);
                  const isAmountValid = !isNaN(parsedPayAmount) && parsedPayAmount > 0;

                  const swapReceiveAmount = (() => {
                    if (!isAmountValid) return 0;
                    if (swapPayToken === "FB") {
                      // 1 FB = 100 PX, but if payAmount >= 1.0, 1.0 FB = 120 PX (bulk bonus!)
                      return parsedPayAmount >= 1.0 ? Math.floor(parsedPayAmount * 120) : Math.floor(parsedPayAmount * 100);
                    } else {
                      // 250 MY = 50 PX (0.2x), 500 MY = 120 PX (0.24x)
                      return parsedPayAmount >= 500 ? Math.floor(parsedPayAmount * 0.24) : Math.floor(parsedPayAmount * 0.20);
                    }
                  })();

                  const activeRateText = swapPayToken === "FB"
                    ? `1 FB = ${parsedPayAmount >= 1.0 ? "120" : "100"} PX`
                    : `1 MY = ${parsedPayAmount >= 500 ? "0.24" : "0.20"} PX`;

                  const swapBtnDisabled = !address || isSwapping || !isAmountValid || parsedPayAmount > currentPayBalance;

                  return (
                    <div className="bg-[#12131a] text-slate-100 border border-slate-800 rounded-3xl p-4 space-y-3.5 relative overflow-hidden shadow-xl shadow-purple-950/20">
                      {/* Tabs bar */}
                      <div className="flex items-center justify-between border-b border-slate-850/80 pb-2">
                        <div className="flex gap-4">
                          <span className="text-xs font-sans font-black text-[#f5a623] border-b-2 border-[#f5a623] pb-1 cursor-pointer">
                            Swap
                          </span>
                        </div>
                        <div className="flex gap-2 text-slate-400">
                          <button 
                            onClick={() => {
                              setSwapPayAmount(swapPayToken === "FB" ? "0.5" : "250");
                              triggerTone(440, "sine", 0.05);
                            }}
                            className="p-1 hover:text-white rounded hover:bg-slate-800/50 transition-colors cursor-pointer"
                            title="Restaurar valores predeterminados"
                          >
                            <Plus className="w-3.5 h-3.5 rotate-45" />
                          </button>
                          <button className="p-1 hover:text-white rounded hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* BLOCK 1: You Pay */}
                      <div className="bg-[#1b1c24] border border-slate-800/60 rounded-2xl p-3.5 space-y-2 relative">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span className="font-medium">Tú Pagas (You Pay)</span>
                          <span className="font-mono text-slate-400">
                            Balance: <strong className="text-slate-200">{swapPayToken === "FB" ? currentPayBalance.toFixed(2) : currentPayBalance}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={swapPayAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                setSwapPayAmount(val);
                              }
                            }}
                            placeholder="0.0"
                            className="bg-transparent text-slate-100 text-2xl font-mono font-bold focus:outline-none w-1/2"
                          />

                          {/* Token Selector Button */}
                          <div className="relative shrink-0">
                            <div className="flex bg-[#23242f] hover:bg-[#2d2e3d] border border-slate-800 rounded-2xl p-1.5 px-3 items-center gap-2 cursor-pointer select-none transition-all"
                              onClick={() => {
                                const nextToken = swapPayToken === "FB" ? "MOONYETIS" : "FB";
                                setSwapPayToken(nextToken);
                                setSwapPayAmount(nextToken === "FB" ? "0.5" : "250");
                                triggerTone(329.63, "triangle", 0.06);
                              }}
                            >
                              {swapPayToken === "FB" ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-[9px] font-black text-white shrink-0 border border-amber-300/30 shadow-md">
                                    FB
                                  </div>
                                  <span className="text-xs font-black tracking-wide text-slate-100">Fractal BTC</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-base leading-none shrink-0" title="MoonYeti">🏔️</span>
                                  <span className="text-xs font-black tracking-wide text-slate-100">MoonYeti</span>
                                </>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DOWN ARROW */}
                      <div className="flex justify-center -my-6 relative z-10">
                        <button 
                          onClick={() => {
                            triggerTone(587.33, "triangle", 0.05);
                          }}
                          className="w-8 h-8 rounded-full bg-[#f5a623] hover:scale-105 active:scale-95 border-4 border-[#12131a] flex items-center justify-center text-[#12131a] shadow-lg transition-transform cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>

                      {/* BLOCK 2: You Receive */}
                      <div className="bg-[#1b1c24] border border-slate-800/60 rounded-2xl p-3.5 space-y-2 relative">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span className="font-medium">Tú Recibes (You Receive)</span>
                          <span className="font-mono text-slate-400">
                            Balance: <strong className="text-purple-300">{profile ? (profile.pixel_tokens_balance ?? 150) : 150} PX</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="text-slate-200 text-2xl font-mono font-bold select-all">
                            {swapReceiveAmount}
                          </div>

                          <div className="flex bg-[#23242f] border border-slate-800 rounded-2xl p-1.5 px-3 items-center gap-1.5 select-none shrink-0">
                            <Coins className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                            <span className="text-xs font-black tracking-wide text-slate-100">Pixel Tokens</span>
                          </div>
                        </div>
                      </div>

                      {/* EXCHANGE DETAILS */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 font-sans">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Tipo de cambio (Exchange rate):
                        </span>
                        <strong className="text-slate-250 font-mono tracking-wide">
                          {activeRateText}
                        </strong>
                      </div>

                      {/* Bulk Bonus Active Warning */}
                      {((swapPayToken === "FB" && parsedPayAmount >= 1.0) || 
                        (swapPayToken === "MOONYETIS" && parsedPayAmount >= 500)) && (
                        <div className="bg-emerald-950/40 text-emerald-300 text-[10px] font-sans border border-emerald-900/40 rounded-lg p-2.5 flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            ¡Bono de volumen activado! (+20% PX)
                          </span>
                          <span className="font-mono text-[9px] bg-emerald-900/80 px-2 py-0.5 rounded font-black">20% BONUS</span>
                        </div>
                      )}

                      {/* MAIN CTA BUTTON */}
                      <button
                        disabled={swapBtnDisabled}
                        onClick={() => {
                          if (isAmountValid) {
                            triggerTokenSwap(swapPayToken, parsedPayAmount, swapReceiveAmount);
                          }
                        }}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-slate-900 bg-gradient-to-r from-amber-400 to-[#f5a623] hover:from-amber-300 hover:to-orange-500 active:scale-[0.98] ${
                          swapBtnDisabled ? "opacity-40 cursor-not-allowed grayscale pointer-events-none" : ""
                        }`}
                      >
                        {isSwapping ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                            Procesando Intercambio...
                          </>
                        ) : parsedPayAmount > currentPayBalance ? (
                          "Saldo Insuficiente de " + swapPayToken
                        ) : !isAmountValid ? (
                          "Ingresa un monto válido"
                        ) : !address ? (
                          "Conectar Billetera de Pintor"
                        ) : (
                          `Intercambiar por ${swapReceiveAmount} PX`
                        )}
                      </button>
                    </div>
                  );
                })()}

                {/* Main Upgrades Grid */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase text-slate-400 tracking-widest block font-bold">Premium Upgrades</span>

                  {STORE_ITEMS.map((item) => {
                    // Check active state statuses for each upgrade!
                    let isEquipped = false;
                    let customizedLabel = "";
                    
                    if (item.id === "brush_auras" && hasGlowBrush) {
                      isEquipped = true;
                      customizedLabel = "VIP ACTIVE";
                    } else if (item.id === "max_cap_1" && maxCharges >= 100) {
                      isEquipped = true;
                      customizedLabel = "UPGRADED";
                    } else if (item.id === "max_cap_2" && maxCharges >= 200) {
                      isEquipped = true;
                      customizedLabel = "COLLOSAL ACTIVE";
                    }

                    // Special tag decorations
                    const price = item.cost_px;
                    const canAfford = (profile ? (profile.pixel_tokens_balance ?? 150) : 150) >= price;

                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-xl p-3 flex flex-col justify-between transition-all gap-2 relative ${
                          isEquipped 
                            ? "bg-slate-50/50 border-slate-250 opacity-90" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                              {item.id === "brush_auras" && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />}
                              {item.id === "charge_refill" && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-200" />}
                              {item.id === "max_cap_1" && <Cpu className="w-3.5 h-3.5 text-indigo-500" />}
                              {item.id === "max_cap_2" && <Layers className="w-3.5 h-3.5 text-purple-500" />}
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-455 leading-tight">{item.desc}</p>
                          </div>
                          {isEquipped ? (
                            <span className="text-[8px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md font-extrabold shrink-0 uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                              <Check className="w-2.5 h-2.5" />
                              {customizedLabel}
                            </span>
                          ) : item.reward === "refill" ? (
                            <span className="text-[8px] font-mono px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-bold shrink-0 uppercase tracking-wide">One-Time</span>
                          ) : (
                            <span className="text-[8px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-bold shrink-0 uppercase tracking-wide">Boost</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            COST: <strong className="text-purple-600 font-extrabold">{price} PX</strong>
                          </span>
                          
                          {isEquipped ? (
                            <button
                              disabled
                              className="py-1 px-3 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 cursor-not-allowed flex items-center gap-1"
                            >
                              Equipped
                              <Check className="w-3 h-3 text-emerald-500" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handlePurchaseItem(item);
                                triggerTone(587.33, "triangle", 0.1); // Beautiful positive sound node upon buying!
                              }}
                              disabled={!canAfford}
                              className={`py-1 px-3 rounded-lg text-[10px] font-extrabold text-white cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-sm ${
                                canAfford
                                  ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/15"
                                  : "bg-slate-350 hover:bg-slate-350 cursor-not-allowed opacity-60"
                              }`}
                            >
                              Unlock
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OVERLAY PANEL B: LEADERBOARD OF NATIONS/PLAYERS */}
            {activeMenuOverlay === "leaderboard" && (
              <div className="space-y-4 text-slate-800">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Scoreboard list of top collaborative painters, aggregated by username and national identity on the globe map.
                </p>

                <div className="space-y-2">
                  {scoreboards.map((user, index) => (
                    <div 
                      key={user.rank}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        user.user === "You"
                          ? "bg-purple-50/75 border-purple-200/80 shadow-sm"
                          : "bg-slate-50/50 border-slate-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[70%]">
                        <span className="font-mono text-xs font-bold text-slate-400">#{user.rank}</span>
                        <span className="text-lg leading-none">{user.flag}</span>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 truncate block">{user.user}</span>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">{user.country}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-indigo-600 block">
                          {user.pixels.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-500 block">pixels painted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OVERLAY PANEL C: REAL-TIME COLLAB FEEDS */}
            {activeMenuOverlay === "feed" && (
              <div className="space-y-4 flex flex-col justify-between h-full text-slate-800">
                <p className="text-[11px] text-slate-505 leading-normal">
                  Live audit logs of pixel paint activities submitted to the backend. Includes ledger transaction hashes.
                </p>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {recentFeeds.length > 0 ? (
                    recentFeeds.map((feed, idx) => (
                      <div 
                        key={`${feed.x}-${feed.y}-${idx}`}
                        className="bg-slate-50 border border-slate-200/75 rounded-xl p-2.5 flex items-center justify-between text-2xs font-mono transition-all hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 max-w-[65%]">
                          {feed.color === "transparent" ? (
                            <span className="w-3.5 h-3.5 rounded border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                              <X className="w-2.5 h-2.5 text-red-500" />
                            </span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-200 shrink-0" style={{ backgroundColor: feed.color }} />
                          )}
                          <div className="truncate">
                            <span className="text-slate-800 font-bold">[{feed.x}, {feed.y}]</span>
                            <span className="text-[10px] text-slate-450 block truncate">
                              by {feed.owner.substring(0, 10)}...
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-indigo-600 text-[10px] block">
                            {feed.color === "transparent" ? "ERASED" : "PAINT"}
                          </span>
                          <span className="text-[8px] text-slate-400 block">
                            {new Date(feed.timestamp).toTimeString().split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No paintings submitted yet. Build first!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OVERLAY PANEL D: INTEGRATED COOPERATION RULES */}
            {activeMenuOverlay === "rules" && (
              <div className="space-y-4 text-xs text-slate-800 font-sans">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Rules are essential to keep the multi-user collaborative map canvas clean, safe, and balanced:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      1. Territory Competition Is Allowed
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Painting over other users' artwork is a standard mechanical element of coordinates competition. Reclaim territory gracefully!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      2. Content Moderation Enforcements
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Hateful remarks, destructive spam, offensive symbols, or explicit pictures will be cleaned recursively. Custom erasers can be utilized to sweep grief.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      3. Cooldown Penalties (Charges)
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Each paint demands 1 Energy Capacity unit. Energy recharges every 10s up to a maximum limit of 50. Refuel or upgrade limits dynamically inside Store.
                    </p>
                  </div>
                </div>

                <div className="p-2 bg-indigo-50 text-indigo-600 font-mono text-[10px] text-center border border-indigo-100 rounded-lg">
                  Wplace system is autonomous.
                </div>
              </div>
            )}

            {/* OVERLAY PANEL E: PRIVATE DEV RPC TERMINAL SIMULATOR */}
            {activeMenuOverlay === "developer_rpc" && (
              <div className="space-y-4 text-slate-800">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Interact with the backend private JSON-RPC bitcoind emulator interface. Write queries or search local unspent outputs.
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Select Method:</span>
                    <select
                      value={selectedCliCommand}
                      onChange={(e) => {
                        setSelectedCliCommand(e.target.value);
                        setCustomCliArgs("");
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="getblockchaininfo">getblockchaininfo</option>
                      <option value="gettransaction">gettransaction &lt;txid&gt;</option>
                      <option value="listunspent">listunspent</option>
                    </select>
                  </div>

                  {selectedCliCommand === "gettransaction" && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-405 uppercase tracking-widest block">Transaction hash:</span>
                      <input
                        type="text"
                        placeholder="Paste tx hash..."
                        value={customCliArgs}
                        onChange={(e) => setCustomCliArgs(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-mono text-slate-700 focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleExecuteCli()}
                    disabled={isTerminalLoading}
                    className="w-full font-bold text-xs py-2 bg-indigo-600 hover:bg-indigo-505 rounded-lg text-white font-mono cursor-pointer transition-all shadow"
                  >
                    {isTerminalLoading ? "Executing rpc call..." : "bitcoin-cli SEND QUERY"}
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-slate-450 uppercase tracking-widest block">CLI SHELL SCREEN</span>
                  <pre className="bg-slate-900 p-2 text-emerald-400 border border-slate-950 font-mono text-[9px] h-[190px] overflow-auto whitespace-pre-wrap leading-tight rounded-xl select-all shadow-inner">
                    {terminalOutput}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. USER PROFILE CONFIG DETAILS OVERLAY PANEL (Circular popup settings modal) */}
      {showProfileSelector && (
        <div className="absolute inset-0 z-40 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 w-full max-w-md rounded-2xl p-5 shadow-2xl relative animate-fade-in text-xs space-y-4">
            
            {/* Modal Heading */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <h3 className="font-sans font-bold text-sm text-slate-900">Wplace Profile & Wallet Settings</h3>
              </div>
              <button
                onClick={() => setShowProfileSelector(false)}
                className="p-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-455 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile editor Form details */}
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">
                  1. Customize Username
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="e.g. Satoshi_Yeti"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 px-3.5 py-2.5 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">
                  2. Choose National Flag Identity
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 scrollbar-none">
                  {AVAILABLE_FLAGS.map((flag) => (
                    <button
                      key={flag.code}
                      type="button"
                      onClick={() => setTempFlag(flag.code)}
                      className={`py-1.5 rounded-lg border text-base flex flex-col items-center justify-center transition-all cursor-pointer ${
                        tempFlag === flag.code
                          ? "border-purple-600 bg-purple-50/60 text-purple-600 scale-105 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:scale-102 text-slate-705"
                      }`}
                      title={flag.name}
                    >
                      <span className="text-lg">{flag.code}</span>
                      <span className="text-[8px] font-mono text-slate-450 leading-none mt-1 truncate max-w-full px-1">{flag.name.substring(0, 5)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 font-bold text-white rounded-xl cursor-pointer shadow transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                {isUpdatingProfile ? (
                  "Syncing updates..."
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Save Changes & Flag
                  </>
                )}
              </button>
            </form>

            <div className="h-px bg-slate-100" />

            {/* Google Synchronization Integration segment */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest block font-semibold">
                3. Google Authentication
              </span>

              {profile?.google_email ? (
                <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(profile.google_email)}`} 
                        alt="Google Avatar" 
                        className="w-8 h-8 rounded-full border border-emerald-250 shadow-xs"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-150">
                        <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans font-bold text-slate-800 text-2xs truncate">
                        {profile.google_name || "Google User"}
                      </p>
                      <p className="font-mono text-[9px] text-slate-455 truncate">
                        {profile.google_email}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleGoogleLogout}
                    className="py-1 px-2 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-455 hover:text-red-600 rounded text-[9px] font-bold transition-all cursor-pointer"
                  >
                    Unlink Account
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <p className="text-[10px] text-slate-505 font-sans leading-normal text-slate-500">
                    Conecta tu cuenta de Google para respaldar tu progreso, tus tokens de píxeles y acceder a tableros especiales en la nube.
                  </p>
                  
                  <button
                    onClick={() => {
                      setShowProfileSelector(false);
                      setShowGooglePopup(true);
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-250 shadow-2xs hover:shadow-1xs text-slate-755 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-350"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Iniciar sesión con Google
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Faucet claim mechanics */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-semibold">
                  4. Sandbox Ledger Faucets
                </span>
                <span className="text-[10px] text-slate-505 font-mono italic">instant balance test</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-slate-200/60 text-center">
                  <span className="text-[10px] font-mono text-slate-450 block pb-1">W-Coins</span>
                  <button
                    onClick={() => triggerFaucet("FB")}
                    disabled={faucetLoading !== null}
                    className="w-full py-1.5 bg-yellow-50 hover:bg-yellow-101 border border-yellow-200 text-yellow-750 font-mono text-[10px] font-bold rounded hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer block"
                  >
                    {faucetLoading === "FB" ? "Adding..." : "Faucet (+5.0 W)"}
                  </button>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200/60 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block pb-1">MY-Tokens</span>
                  <button
                    onClick={() => triggerFaucet("MOONYETIS")}
                    disabled={faucetLoading !== null}
                    className="w-full py-1.5 bg-purple-50 hover:bg-purple-101 border border-purple-200 text-purple-750 font-mono text-[10px] font-bold rounded hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer block"
                  >
                    {faucetLoading === "MOONYETIS" ? "Adding..." : "Faucet (+2.5K MY)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced credential refresh */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <button
                type="button"
                onClick={handleRegenerateSessionAddress}
                className="text-purple-600 hover:text-purple-700 font-bold underline cursor-pointer"
                title="Wipe local address and generate a blank ledger credentials record"
              >
                Regenerate Sandbox Address
              </button>
              <div className="truncate text-right max-w-[60%] font-mono text-[9px] text-slate-400">
                {address}
              </div>
            </div>

          </div>
        </div>
      )}

      {showGooglePopup && (
        <GoogleSignInPopup
          onClose={() => setShowGooglePopup(false)}
          onSuccess={handleGoogleLoginSuccess}
          triggerTone={triggerTone}
        />
      )}

      {/* 6. COMNEX SYNC TICKER: Miniature footer panel overlay */}
      <footer className="absolute bottom-2 right-4 z-20 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-1 text-[9px] font-mono text-slate-500 flex items-center gap-3 border border-slate-200/80 pointer-events-auto shadow">
          <span>Height: <strong className="text-purple-600 font-bold">#{blocks[0]?.height || "104523"}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Pending State Mined: <strong className="text-yellow-600 font-bold">~30s</strong></span>
        </div>
      </footer>

    </div>
  );
}
