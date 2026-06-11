import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PixelData, UserProfile, PaintTransaction, BlockchainBlock } from "./src/types";

// Setup storage directories
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILE_PIXELS = path.join(DATA_DIR, "pixels.json");
const FILE_USERS = path.join(DATA_DIR, "users.json");
const FILE_TXS = path.join(DATA_DIR, "transactions.json");
const FILE_CHAT = path.join(DATA_DIR, "chat.json");

// Helper utilities to load and save data
function loadJSON<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultValue;
}

function saveJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error saving ${filePath}:`, e);
  }
}

// Generate a deterministic Taproot address for Google email login IDs
function deriveAddressFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(16).padEnd(8, "c");
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, "");
  let fullHash = "g" + positiveHash + "f" + cleanEmail.padEnd(50, "y");
  fullHash = fullHash.substring(0, 58);
  return "bc1p" + fullHash;
}

// Check if address is a valid Taproot (bc1p) or SegWit/Legacy (bc1q) on Fractal Bitcoin
function isValidAddress(address: string | undefined): boolean {
  if (!address) return false;
  return address.startsWith("bc1p") || address.startsWith("bc1q");
}

// Fetch user's real moonyetis BRC-20 token balance with exponential backoff retry logic (max 3 times)
async function fetchMyBalanceWithRetry(address: string, retries = 3, delay = 500): Promise<number> {
  const token = process.env.UNISAT_API_TOKEN;
  if (!token) {
    throw new Error("UNISAT_API_TOKEN environment variable is required");
  }
  const url = `https://open-api-fractal.unisat.io/v1/indexer/address/${address}/brc20/summary`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (response.status === 403) {
        console.warn(`[Unisat API] 403 Forbidden for address: ${address}. Falling back to 0 silently.`);
        return 0;
      }

      if (!response.ok) {
        throw new Error(`Unisat OpenAPI error status: ${response.status}`);
      }

      const resJson = await response.json() as any;
      if (resJson && resJson.code === 0 && Array.isArray(resJson.data)) {
        // Look for the "moonyetis" BRC-20 ticker case-insensitively
        const found = resJson.data.find(
          (item: any) => item && typeof item.ticker === "string" && item.ticker.toLowerCase() === "moonyetis"
        );
        if (found) {
          const balanceStr = found.overallBalance || found.availableBalance || "0";
          const parsed = parseFloat(balanceStr);
          return isNaN(parsed) ? 0 : parsed;
        }
      }
      return 0; // Not holding MoonYetis, fallback safely
    } catch (error: any) {
      console.warn(`[Unisat API] Attempt ${attempt} failed for ${address}:`, error?.message || error);
      if (attempt === retries) {
        throw error; // Maximum attempts reached, fail upward to let caller handle gracefully
      }
      // Wait with exponential backoff delay
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  return 0;
}

// Fetch user's real FB available balance with exponential backoff retry logic (max 3 times)
async function fetchFbBalanceWithRetry(address: string, retries = 3, delay = 500): Promise<number> {
  const token = process.env.UNISAT_API_TOKEN;
  if (!token) {
    throw new Error("UNISAT_API_TOKEN environment variable is required");
  }
  const url = `https://open-api-fractal.unisat.io/v1/indexer/address/${address}/available-balance`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (response.status === 403) {
        console.warn(`[Unisat FB API] 403 Forbidden for address: ${address}. Falling back to 0 silently.`);
        return 0;
      }

      if (!response.ok) {
        throw new Error(`Unisat OpenAPI error status: ${response.status}`);
      }

      const resJson = await response.json() as any;
      if (resJson && resJson.code === 0 && resJson.data) {
        const confirmedSatoshi = resJson.data.confirmedSatoshi || resJson.data.availableBalance || 0;
        const parsed = parseFloat(confirmedSatoshi);
        return isNaN(parsed) ? 0 : parsed / 100000000;
      }
      return 0;
    } catch (error: any) {
      console.warn(`[Unisat FB API] Attempt ${attempt} failed for ${address}:`, error?.message || error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  return 0;
}

// Determine server-side authoritative tiers and discount benefits based on MY balance
function getUserTierAndDiscount(myBalance: number) {
  if (myBalance >= 500000000) {
    return { tier: "Cosmonaut", discountPercent: 25, badge: "💎 Cosmonaut VIP" };
  } else if (myBalance >= 100000000) {
    return { tier: "Astronaut", discountPercent: 20, badge: "🚀 Astronaut Premium" };
  } else if (myBalance >= 50000000) {
    return { tier: "Pioneer", discountPercent: 15, badge: "🎖️ Pioneer" };
  } else if (myBalance >= 10000000) {
    return { tier: "Voyager", discountPercent: 10, badge: "🛸 Voyager" };
  } else if (myBalance >= 1000000) {
    return { tier: "Explorer", discountPercent: 5, badge: "🏕️ Explorer" };
  }
  return { tier: "Básico", discountPercent: 0, badge: "🎨 Artista Básico" };
}

// In-Memory state loaded from / saved to disk
let pixelsRecord: Record<string, PixelData> = loadJSON(FILE_PIXELS, {});
let usersRecord: Record<string, UserProfile> = loadJSON(FILE_USERS, {});
let txList: PaintTransaction[] = loadJSON(FILE_TXS, []);

let chatList: any[] = loadJSON(FILE_CHAT, []);
if (chatList.length === 0) {
  chatList = [
    { id: "c1", username: "Satoshi_Art", flag_emoji: "🇺🇸", text: "Welcome to Wplace Pixel Canvas! Lets build some cool global landmarks!", timestamp: Date.now() - 3600000 },
    { id: "c2", username: "Yeti_Patron", flag_emoji: "🇪🇸", text: "Hola guys! I'm starting a massive pixel heart at [310, 150]. Assist me please!", timestamp: Date.now() - 1800000 },
    { id: "c3", username: "Pixel_Azteca", flag_emoji: "🇲🇽", text: "Vaporwave grid layout at [500, 500] is absolutely stellar!", timestamp: Date.now() - 900000 }
  ];
  saveJSON(FILE_CHAT, chatList);
}

// Insert some Initial Pixels depicting a MoonYeti and logo if empty
if (Object.keys(pixelsRecord).length === 0) {
  // Let's draw standard "YETI" text in the center-ish area (e.g. x: 500, y: 500)
  const colors = {
    w: "#ffffff", // white
    b: "#000000", // black
    y: "#fbbf24", // yellow
    g: "#9ca3af", // gray
    u: "#3b82f6", // blue
    p: "#a855f7"  // purple
  };

  const template = [
    "....wwwwwwww....",
    "...wwuuuuuuww...",
    "..wwuuwuuwwuuww.",
    ".wwuwwuuuuuwwuww",
    ".wwuuuuuuuuuuuww",
    "wwuupppppppppuww",
    "wwupppyyypppyuww",
    "wwuppyyyyyppyuww",
    "wwuppybbybppyuww",
    "wwuppyyyyyppyuww",
    ".wwupyyyyyypuww.",
    ".wwuppppppppuww.",
    "..wwuuuuuuuuww..",
    "...wwwwwwwwww...",
    "....ww....ww...."
  ];

  const startX = 492;
  const startY = 492;
  const adminAddress = "bc1pyetiowner999x999y999z999a999b999c999d999e999f";

  template.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const char = row[dx];
      if (char !== ".") {
        const color = colors[char as keyof typeof colors] || "#ffffff";
        const x = startX + dx;
        const y = startY + dy;
        pixelsRecord[`${x},${y}`] = {
          x,
          y,
          color,
          owner: adminAddress,
          ownerUsername: "Satoshi_Art",
          pricePaid: 0.05,
          currency: "FB",
          timestamp: Date.now() - 3600000 // 1 hour ago
        };
      }
    }
  });

  // Also write "MOONYETIS" in pixel coordinates
  // let's create simple grid letters for "YETI"
  const word = [
    // Y
    [485, 470], [485, 471], [489, 470], [489, 471],
    [486, 472], [488, 472], [487, 473], [487, 474], [487, 475],
    // E
    [493, 470], [494, 470], [495, 470], [493, 471], [493, 472], [494, 472], [493, 473], [493, 474], [494, 474], [495, 474],
    // T
    [499, 470], [500, 470], [501, 470], [500, 471], [500, 472], [500, 473], [500, 474],
    // I
    [505, 470], [506, 470], [507, 470], [506, 471], [506, 472], [506, 473], [506, 474], [505, 474], [507, 474]
  ];

  word.forEach(([x, y]) => {
    pixelsRecord[`${x},${y}`] = {
      x,
      y,
      color: "#a855f7",
      owner: adminAddress,
      ownerUsername: "Yeti_Patron",
      pricePaid: 0.1,
      currency: "MOONYETIS",
      timestamp: Date.now() - 1200000
    };
  });

  saveJSON(FILE_PIXELS, pixelsRecord);
}

// Generate admin user profile
if (Object.keys(usersRecord).length === 0) {
  const adminAddr = "bc1pyetiowner999x999y999z999a999b999c999d999e999f";
  usersRecord[adminAddr] = {
    username: "yeti_creator",
    address: adminAddr,
    fb_balance: 50.0,
    mooneyetis_balance: 500000,
    pixel_tokens_balance: 10000,
    total_pixels_owned: 121,
    created_at: Date.now()
  };
  saveJSON(FILE_USERS, usersRecord);
}

// Simulated active blocks on Fractal Bitcoin
let currentBlockHeight = 104523;
const blocksRecord: BlockchainBlock[] = [
  { height: 104523, hash: "00000000001bc2024d99e94b9f0293a8e982d61ab89d38fda5980e9a7e21a20d", time: Date.now() - 15000, tx_count: 14, difficulty: 4305820 },
  { height: 104522, hash: "000000000021c258d9a4b3f89073100df990cb89c7d00ba3f281e8fbcda993b1", time: Date.now() - 45000, tx_count: 8, difficulty: 4304910 },
  { height: 104521, hash: "000000000004ff93ca8e918bc2a8db9071ff023aef51ea89a6bcbcda3b940db9", time: Date.now() - 75000, tx_count: 22, difficulty: 4302180 }
];

// Block simulation interval (creates a Fractal Block every 30 seconds!)
setInterval(() => {
  currentBlockHeight += 1;
  const newHash = "0000000000" + Math.random().toString(16).substring(2, 12) + "bc2024" + Math.random().toString(16).substring(2, 14);
  const blockTxCount = Math.floor(Math.random() * 20) + 2;
  
  const newBlock: BlockchainBlock = {
    height: currentBlockHeight,
    hash: newHash,
    time: Date.now(),
    tx_count: blockTxCount,
    difficulty: 4305820 + Math.floor(Math.random() * 1000) - 500
  };

  blocksRecord.unshift(newBlock);
  if (blocksRecord.length > 30) {
    blocksRecord.pop();
  }

  // Auto-confirm pending simulated transactions on new block
  let changes = false;
  txList.forEach(tx => {
    if (tx.status === "pending") {
      tx.status = "confirmed";
      tx.confirmations = 1;
      tx.confirmedAtBlock = currentBlockHeight;
      changes = true;

      // Commit the paint modifications in canvas persistence on block confirmation!
      tx.pixels.forEach(p => {
        const userProf = usersRecord[tx.address];
        pixelsRecord[`${p.x},${p.y}`] = {
          x: p.x,
          y: p.y,
          color: p.color,
          owner: tx.address,
          ownerUsername: userProf ? userProf.username : `Painter-${tx.address.substring(4, 9)}`,
          pricePaid: tx.totalCost / tx.pixels.length,
          currency: tx.currency,
          timestamp: Date.now()
        };
      });

      // Update total pixel count for user
      if (usersRecord[tx.address]) {
        usersRecord[tx.address].total_pixels_owned += tx.pixels.length;
      }
    } else if (tx.status === "confirmed" && tx.confirmedAtBlock) {
      tx.confirmations = currentBlockHeight - tx.confirmedAtBlock + 1;
      changes = true;
    }
  });

  if (changes) {
    saveJSON(FILE_TXS, txList);
    saveJSON(FILE_PIXELS, pixelsRecord);
    saveJSON(FILE_USERS, usersRecord);
  }
}, 30000);

// Active chat room simulator simulating random gamers worldwide
const SIMULATED_USERS = [
  { username: "Satoshi_Artist", flag_emoji: "🇺🇸" },
  { username: "Nakamoto_Placer", flag_emoji: "🇯🇵" },
  { username: "El_Placero", flag_emoji: "🇪🇸" },
  { username: "Yeti_Clan_Leader", flag_emoji: "🇨🇦" },
  { username: "Crypto_Maniac", flag_emoji: "🇬🇧" },
  { username: "DeFi_Valkyrie", flag_emoji: "🇩🇪" },
  { username: "Gamer_Boy_99", flag_emoji: "🇧🇷" },
  { username: "PixelWave", flag_emoji: "🇫🇷" },
  { username: "AuraPainter", flag_emoji: "🇮🇹" }
];

const SIMULATED_MESSAGES = [
  "Working on the top border of the map. Please don't overwrite the orange lines!",
  "Just claimed the MY token faucet, ready to draw!",
  "Can someone help me clear the black pixels at [780, 680] near Australia?",
  "Spanish flag is looking ultra sharp guys! Vamos! 🇪🇸",
  "Is anyone building a space rocket at [450, 480]?",
  "Love the direct responsive feel of this canvas, clicks are so snappy!",
  "Let's write 'WPLACE' in green letters around the void center coord!",
  "Where is the highest pixel concentration right now? Check the Heatmap mode!",
  "Gotta claim some extra FB from the wallet, running low on charges.",
  "Check out the live feed feed! Someone is painting a beautiful starry pattern.",
  "Let's defend the Arctic snowman model at [400, 80]!",
  "Vaporwave grid mode is so trippy and stylish."
];

setInterval(() => {
  const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
  const text = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
  const newMsg = {
    id: "sim-" + Math.random().toString(36).substring(2, 9),
    username: user.username,
    flag_emoji: user.flag_emoji,
    text: text,
    timestamp: Date.now()
  };
  chatList.push(newMsg);
  if (chatList.length > 100) {
    chatList.shift();
  }
  saveJSON(FILE_CHAT, chatList);
}, 22000); // add one every 22 secs


// Instantiate app
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API - Get Canvas state (non-blank painted coordinates)
  app.get("/api/canvas", (req, res) => {
    res.json(pixelsRecord);
  });

  // API - Get last pixel painting feeds (Audit log)
  app.get("/api/feed", (req, res) => {
    const feeds = Object.values(pixelsRecord)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40);
    res.json(feeds);
  });

  // API - Get Real-time Chat entries
  app.get("/api/chat", (req, res) => {
    res.json(chatList);
  });

  // API - Post Chat entry
  app.post("/api/chat", (req, res) => {
    const { address, text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message content cannot be blank." });
    }
    
    // Resolve user profile or default
    const user = address ? usersRecord[address] : null;
    const username = user ? user.username : `Guest-${Math.random().toString(36).substring(2, 6)}`;
    const flag_emoji = user?.flag_emoji || "🏴‍☠️";

    const newMsg = {
      id: "msg-" + Math.random().toString(36).substring(2, 12),
      username,
      flag_emoji,
      text: text.trim().substring(0, 100),
      timestamp: Date.now()
    };

    chatList.push(newMsg);
    if (chatList.length > 105) {
      chatList.shift();
    }
    saveJSON(FILE_CHAT, chatList);
    res.json({ success: true, chat: chatList });
  });

  // API - Register or login with Google
  app.post("/api/users/google-login", (req, res) => {
    const { email, name, avatarUrl, currentAddress } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Google email is required." });
    }

    // Determine target wallet address:
    // 1. If currently connected to a valid wallet address, link Google account to that address!
    // 2. Otherwise/fallback: use deterministic address derived from client Google email.
    let targetAddress = currentAddress;
    if (!targetAddress || !isValidAddress(targetAddress)) {
      // Find if there is an existing user record with this google_email first!
      const existingUser = Object.values(usersRecord).find(
        (u) => u.google_email?.toLowerCase() === email.toLowerCase()
      );
      if (existingUser) {
        targetAddress = existingUser.address;
      } else {
        targetAddress = deriveAddressFromEmail(email);
      }
    }

    if (!usersRecord[targetAddress]) {
      usersRecord[targetAddress] = {
        username: name ? name.substring(0, 20) : `Painter-${targetAddress.substring(4, 9)}`,
        address: targetAddress,
        fb_balance: 5.5,
        mooneyetis_balance: 2500,
        pixel_tokens_balance: 150,
        total_pixels_owned: 0,
        flag_emoji: "🇺🇸",
        created_at: Date.now(),
        google_email: email,
        google_name: name,
        avatar_url: avatarUrl,
      };
      saveJSON(FILE_USERS, usersRecord);
    }

    res.json({ success: true, profile: usersRecord[targetAddress] });
  });

  // API - Fetch or create user profile based on connected Fractal address (bc1p... or bc1q...)
  app.get("/api/users/profile/:address", async (req, res) => {
    const address = req.params.address;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Only Taproot (bc1p...) and SegWit (bc1q...) addresses are supported on Fractal Bitcoin." });
    }
 
    // Try to load real BRC-20 token balance from UniSat Fractal Indexer dynamically
    let realMyBalance = -1;
    try {
      realMyBalance = await fetchMyBalanceWithRetry(address, 3, 500);
      console.log(`[UniSat Integration] Successfully fetched $MY balance of ${realMyBalance} for address: ${address}`);
    } catch (err: any) {
      console.warn(`[UniSat Integration] Bypassed or failed lookup for ${address}, keeping existing simulated balance. Error:`, err?.message || err);
    }

    // Try to load real FB available-balance dynamically from UniSat Fractal Indexer
    let realFbBalance = -1;
    try {
      realFbBalance = await fetchFbBalanceWithRetry(address, 3, 500);
      console.log(`[UniSat Integration] Successfully fetched FB balance of ${realFbBalance} for address: ${address}`);
    } catch (err: any) {
      console.warn(`[UniSat Integration] Bypassed or failed FB lookup for ${address}, keeping existing simulated balance. Error:`, err?.message || err);
    }
 
    if (!usersRecord[address]) {
      usersRecord[address] = {
        username: `Painter-${address.substring(4, 9)}`,
        address: address,
        fb_balance: realFbBalance >= 0 ? realFbBalance : 5.0, // Use real balance, otherwise fallback to standard sim
        mooneyetis_balance: realMyBalance >= 0 ? realMyBalance : 1250, // Use real balance, otherwise fallback to standard sim
        pixel_tokens_balance: 200, 
        total_pixels_owned: 0,
        flag_emoji: "🇺🇸", 
        created_at: Date.now()
      };
      saveJSON(FILE_USERS, usersRecord);
    } else {
      // If we got real balances from UniSat API, update our backend profile record authoritatively!
      if (realMyBalance >= 0) {
        usersRecord[address].mooneyetis_balance = realMyBalance;
      }
      if (realFbBalance >= 0) {
        usersRecord[address].fb_balance = realFbBalance;
      }
      
      // Dynamic auto-topup for existing user testers so they don't get blocked by low starting balances
      if (usersRecord[address].pixel_tokens_balance === undefined || usersRecord[address].pixel_tokens_balance < 20) {
        usersRecord[address].pixel_tokens_balance = 200;
      }
      if (usersRecord[address].fb_balance === undefined || (usersRecord[address].fb_balance < 1.0 && realFbBalance < 0)) {
        usersRecord[address].fb_balance = 5.0;
      }
      if (usersRecord[address].mooneyetis_balance === undefined) {
        usersRecord[address].mooneyetis_balance = realMyBalance >= 0 ? realMyBalance : 1250;
      }
      saveJSON(FILE_USERS, usersRecord);
    }

    // Evaluate subscription parameters and max_charges overrides dynamically on return
    const userObj = usersRecord[address];
    if (userObj.subscription && userObj.subscription.expiresAt) {
      if (userObj.subscription.expiresAt > Date.now()) {
        const plan = SUBS_PLANS.find(p => p.id === userObj.subscription.planId);
        if (plan) {
          userObj.max_charges = plan.maxCharges;
        }
      } else {
        if (userObj.max_charges === 500 || userObj.max_charges === 1000) {
          delete userObj.max_charges;
        }
      }
    }

    res.json(usersRecord[address]);
  });

  // API - Update profile username and flag emoji
  app.post("/api/users/update", (req, res) => {
    const { address, username, flagEmoji } = req.body;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Invalid Fractal wallet address." });
    }
    if (!usersRecord[address]) {
      return res.status(404).json({ error: "User profile not established." });
    }
    if (username && username.trim().length > 0) {
      usersRecord[address].username = username.trim().substring(0, 20);
    }
    if (flagEmoji) {
      usersRecord[address].flag_emoji = flagEmoji;
    }
    saveJSON(FILE_USERS, usersRecord);
    res.json({ success: true, profile: usersRecord[address] });
  });

  // API - Sim Faucet to allow instant test tokens
  app.post("/api/wallet/sim-faucet", (req, res) => {
    const { address, type } = req.body;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Invalid Fractal wallet address." });
    }

    if (!usersRecord[address]) {
      usersRecord[address] = {
        username: `Yeti-${address.substring(4, 9)}`,
        address: address,
        fb_balance: 0,
        mooneyetis_balance: 0,
        pixel_tokens_balance: 150,
        total_pixels_owned: 0,
        created_at: Date.now()
      };
    }

    if (type === "FB") {
      usersRecord[address].fb_balance += 5.0;
    } else if (type === "MOONYETIS") {
      usersRecord[address].mooneyetis_balance += 2500;
    } else if (type === "PX") {
      if (usersRecord[address].pixel_tokens_balance === undefined) {
        usersRecord[address].pixel_tokens_balance = 0;
      }
      usersRecord[address].pixel_tokens_balance += 100; // Gift 100 PX on PX faucet request!
    }

    saveJSON(FILE_USERS, usersRecord);
    res.json({ success: true, profile: usersRecord[address] });
  });

  // API - Exchange $FB or MOONYETIS into Pixel Tokens (PX) with advanced authoritative tier rules
  app.post("/api/wallet/exchange", (req, res) => {
    const { address, fromCurrency, fromAmount } = req.body;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Invalid Fractal wallet address." });
    }
    const user = usersRecord[address];
    if (!user) {
      return res.status(404).json({ error: "User profile not established." });
    }

    const parsedAmount = parseFloat(fromAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Por favor ingresa un monto válido mayor a 0." });
    }

    // Server-side authoritative exchange calculation
    let calculatedPx = 0;
    let rateApplied = 0;
    let tierLabel = "Básico";

    if (fromCurrency === "FB") {
      // Calculate tier and discount percentage based on real or simulated $MY holdings
      const { tier, discountPercent, badge } = getUserTierAndDiscount(user.mooneyetis_balance || 0);
      const finalFbNeeded = parsedAmount * (1 - discountPercent / 100);

      if (user.fb_balance < finalFbNeeded) {
        return res.status(400).json({ error: `Saldo insuficiente de $FB. Con tu Tier ${tier} (${discountPercent}% de descuento), requieres ${finalFbNeeded.toFixed(4)} FB, pero tienes ${user.fb_balance.toFixed(4)} FB.` });
      }

      user.fb_balance -= finalFbNeeded;

      if (parsedAmount < 0.5) {
        rateApplied = 100;
        tierLabel = "Básico";
      } else if (parsedAmount >= 0.5 && parsedAmount < 1.0) {
        rateApplied = 110;
        tierLabel = "Estándar (+10% Bonus)";
      } else if (parsedAmount >= 1.0 && parsedAmount < 5.0) {
        rateApplied = 125;
        tierLabel = "Premium Bulk (+25% Bonus)";
      } else {
        rateApplied = 150;
        tierLabel = "Whale Bulk (+50% Bonus)";
      }
      calculatedPx = Math.floor(parsedAmount * rateApplied);

      if (user.pixel_tokens_balance === undefined) {
        user.pixel_tokens_balance = 0;
      }
      user.pixel_tokens_balance += calculatedPx;

      saveJSON(FILE_USERS, usersRecord);

      const discountMsg = discountPercent > 0 
        ? `\n\n🎁 ¡Beneficio de Tier ${tier} activado!\nSe aplicó un ${discountPercent}% de descuento. Pagaste solo ${finalFbNeeded.toFixed(4)} FB en vez de ${parsedAmount} FB.`
        : `\n\n💡 Tip: Acumula tokens $MY en tu wallet para obtener descuentos de hasta un 25% en tus compras de FB.`;

      return res.json({ 
        success: true, 
        profile: user, 
        message: `¡Intercambio procesado con éxito!\n\nHas obtenido ${calculatedPx} Pixel Tokens (PX) con la tasa de ${tierLabel} (${rateApplied} PX por unidad).${discountMsg}` 
      });

    } else if (fromCurrency === "MOONYETIS") {
      if (user.mooneyetis_balance < parsedAmount) {
        return res.status(400).json({ error: `Saldo insuficiente de MoonYetis (MY). Requieres ${parsedAmount} MY, tienes ${user.mooneyetis_balance} MY` });
      }
      user.mooneyetis_balance -= parsedAmount;

      if (parsedAmount < 250) {
        rateApplied = 0.20;
        tierLabel = "Básico";
      } else if (parsedAmount >= 250 && parsedAmount < 500) {
        rateApplied = 0.22;
        tierLabel = "Estándar (+10% Bonus)";
      } else if (parsedAmount >= 500 && parsedAmount < 2000) {
        rateApplied = 0.25;
        tierLabel = "Premium Bulk (+25% Bonus)";
      } else {
        rateApplied = 0.30;
        tierLabel = "Whale Bulk (+50% Bonus)";
      }
      calculatedPx = Math.floor(parsedAmount * rateApplied);

      if (user.pixel_tokens_balance === undefined) {
        user.pixel_tokens_balance = 0;
      }
      user.pixel_tokens_balance += calculatedPx;

      saveJSON(FILE_USERS, usersRecord);
      return res.json({ 
        success: true, 
        profile: user, 
        message: `¡Intercambio procesado con éxito!\n\nHas canjeado ${parsedAmount} MOONYETIS por ${calculatedPx} Pixel Tokens (PX) con la tasa de ${tierLabel} (${rateApplied} PX por unidad).` 
      });

    } else {
      return res.status(400).json({ error: "Invalid source currency." });
    }
  });

  // API - Get Fractal Bitcoin (FB) available balance dynamically via Unisat proxy (Secures secret Bearer Token)
  app.get("/api/wallet/fb-balance/:address", async (req, res) => {
    const address = req.params.address;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Invalid address." });
    }

    try {
      const balance = await fetchFbBalanceWithRetry(address, 3, 500);
      
      // Update in local records if user exists
      if (usersRecord[address]) {
        usersRecord[address].fb_balance = balance;
        saveJSON(FILE_USERS, usersRecord);
      }
      return res.json({ success: true, balance });
    } catch (err: any) {
      console.warn(`[FB Balance Fetch Error] Falling back to database for ${address}`);
      const user = usersRecord[address];
      return res.json({ 
        success: true, 
        balance: user ? (user.fb_balance ?? 5.0) : 5.0,
        simulated: true 
      });
    }
  });

  // Keep track of credited transaction IDs on this server session to prevent double spending
  const creditedTxids = new Set<string>();

  // API - Real-time verifying payments & on-chain confirmations polling
  app.post("/api/wallet/verify-and-credit", async (req, res) => {
    const { txid, address, pixelsCount } = req.body;
    if (!txid || !address || !pixelsCount) {
      return res.status(400).json({ error: "Faltan parámetros de transacción: txid, address o pixelsCount es requerido." });
    }

    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Dirección de billetera Fractal inválida." });
    }

    const user = usersRecord[address];
    if (!user) {
      return res.status(404).json({ error: "Perfil de pintor no configurado." });
    }

    const count = parseInt(pixelsCount, 10);
    if (isNaN(count) || count < 100 || count > 100000) {
      return res.status(400).json({ error: "Cantidad de pixels inválida para acreditar." });
    }

    // CHECK DOUBLE SPEND
    if (creditedTxids.has(txid)) {
      return res.json({ success: true, status: "confirmed", confirmations: 1, message: "Esta transacción ya fue acreditada previamente." });
    }

    // 1. Check if simulated transaction
    if (txid.startsWith("mock")) {
      creditedTxids.add(txid);
      
      if (user.pixel_tokens_balance === undefined) {
        user.pixel_tokens_balance = 0;
      }
      user.pixel_tokens_balance += count;

      // Register painting swap transactions history trace
      const mockPaintTx: PaintTransaction = {
        txid,
        address,
        pixels: [], // empty for storefront bulk purchase
        totalCost: count * 0.001, // approximate base cost
        currency: "FB",
        timestamp: Date.now(),
        status: "confirmed",
        confirmations: 1
      };

      txList.unshift(mockPaintTx);
      if (txList.length > 50) {
        txList.pop();
      }

      saveJSON(FILE_USERS, usersRecord);
      saveJSON(FILE_TXS, txList);

      return res.json({
        success: true,
        status: "confirmed",
        confirmations: 1,
        message: `¡Acreditación de prueba exitosa! Se han agregado +${count} Pixels.`
      });
    }

    // 2. Real on-chain lookup via Unisat Indexer API
    try {
      const url = `https://open-api-fractal.unisat.io/v1/indexer/tx/${txid}`;
      const token = process.env.UNISAT_API_TOKEN;
      if (!token) {
        throw new Error("UNISAT_API_TOKEN environment variable is required");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        // If tx is broadcasted but not yet visible on open-api indexer (highly expected in Bitcoin networks first few seconds)
        console.log(`[UniSat On-Chain Polling] Transaction ${txid} not indexed yet. Status: ${response.status}`);
        return res.json({
          success: true,
          status: "pending",
          confirmations: 0,
          message: "Transmisión en curso. Esperando que se incluya en un bloque."
        });
      }

      const resJson = await response.json() as any;
      if (resJson && resJson.code === 0 && resJson.data) {
        const confirmations = resJson.data.confirmations || 0;
        
        if (confirmations >= 1) {
          creditedTxids.add(txid);

          if (user.pixel_tokens_balance === undefined) {
            user.pixel_tokens_balance = 0;
          }
          user.pixel_tokens_balance += count;

          // Register transaction history trace
          const realPaintTx: PaintTransaction = {
            txid,
            address,
            pixels: [],
            totalCost: count * 0.001,
            currency: "FB",
            timestamp: Date.now(),
            status: "confirmed",
            confirmations
          };

          txList.unshift(realPaintTx);
          if (txList.length > 50) {
            txList.pop();
          }

          saveJSON(FILE_USERS, usersRecord);
          saveJSON(FILE_TXS, txList);

          return res.json({
            success: true,
            status: "confirmed",
            confirmations,
            message: `¡Pago on-chain confirmado con éxito! +${count} Pixels acreditados.`
          });
        } else {
          return res.json({
            success: true,
            status: "pending",
            confirmations,
            message: "Transacción detectada en mempool. Esperando confirmación de red."
          });
        }
      }

      return res.json({
        success: true,
        status: "pending",
        confirmations: 0,
        message: "Procesando en la red de Fractal Bitcoin."
      });

    } catch (err: any) {
      console.error("[Verify and Credit Real Error]:", err);
      return res.status(500).json({ error: "Error en verificación onchain: " + err.message });
    }
  });

  // API - Deduct Pixel Tokens on upgrade item purchase
  app.post("/api/wallet/buy-item", (req, res) => {
    const { address, itemId, costPx } = req.body;
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Invalid Fractal wallet address." });
    }
    const user = usersRecord[address];
    if (!user) {
      return res.status(404).json({ error: "User profile not established." });
    }

    if (user.pixel_tokens_balance === undefined) {
      user.pixel_tokens_balance = 150;
    }

    if (user.pixel_tokens_balance < costPx) {
      return res.status(400).json({ error: `Insufficient Pixel Tokens. Needs: ${costPx} PX, Has: ${user.pixel_tokens_balance} PX.` });
    }
    user.pixel_tokens_balance -= costPx;

    saveJSON(FILE_USERS, usersRecord);
    res.json({ success: true, profile: user, message: `Successfully unlocked item ${itemId}!` });
  });

  // API - Submit pixel block paint action
  app.post("/api/pixels/paint", (req, res) => {
    const { address, pixels, currency } = req.body; // pixels: {x, y, color}[]

    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Fractal wallet address (bc1p/bc1q) is required." });
    }
    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return res.status(400).json({ error: "No pixels specified." });
    }

    // Cost to paint is exactly 1 Pixel Token (PX) per pixel!
    const cost = pixels.length * 1; 

    const user = usersRecord[address];
    if (!user) {
      return res.status(404).json({ error: "User profile not established." });
    }

    if (user.pixel_tokens_balance === undefined) {
      user.pixel_tokens_balance = 150; // Fallback initialization
    }

    if (user.pixel_tokens_balance < cost) {
      return res.status(400).json({ error: `Insufficient Pixel Tokens (PX). Cost: ${cost} PX. Balance: ${user.pixel_tokens_balance} PX. Go to Painter Dashboard to buy or swap some!` });
    }
    user.pixel_tokens_balance -= cost;

    // Design: Create a pending payment broadcast transaction which confirms on next block (30 sec interval)
    const txid = "tx" + Math.random().toString(36).substring(2, 15) + "px2026" + Math.random().toString(36).substring(2, 10);
    const newTx: PaintTransaction = {
      txid,
      address,
      pixels,
      totalCost: cost,
      currency: "PX",
      timestamp: Date.now(),
      status: "pending",
      confirmations: 0
    };

    txList.unshift(newTx);
    if (txList.length > 50) {
      txList.pop();
    }

    saveJSON(FILE_TXS, txList);
    saveJSON(FILE_USERS, usersRecord);

    res.json({
      success: true,
      transaction: newTx,
      message: "Transaction broadcast. Will confirm on next Fractal block (approx. 30 seconds)."
    });
  });

  // API - Get transactions list
  app.get("/api/transactions", (req, res) => {
    res.json(txList);
  });

  // API - Get blocks list
  app.get("/api/blocks", (req, res) => {
    res.json(blocksRecord);
  });

  // API - Simulated official BRC-20 Indexer balances
  app.get("/api/brc20/balances", (req, res) => {
    const { address, tick } = req.query;
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Address query parameter is required." });
    }
    const safeTick = (tick as string || "mooneyetis").toLowerCase();

    const user = usersRecord[address];
    const balance = user ? user.mooneyetis_balance : 0;

    res.json({
      tick: safeTick,
      address,
      balance: balance.toString(),
      available: balance.toString(),
      transferable: "0",
      decimals: 18,
      indexer_status: "synchronized"
    });
  });

    // Dynamic on-chain validation with node JSON-RPC getrawtransaction API
  const SUBS_PLANS = [
    { id: "premium", name: "Premium Plan", priceFB: 0.1, maxCharges: 500, desc: "Aumenta la energía de 50 a 500 cargas continuas durante 30 días" },
    { id: "pro", name: "Pro Painter Plan", priceFB: 0.2, maxCharges: 1000, desc: "Aumenta la energía de 50 a 1000 cargas continuas durante 30 días" }
  ];

  // Node RPC tracking & circuit breaker state
  let nodeConsecutiveFailures = 0;
  let nodeLastFailureTime = 0;

  function handleNodeSuccess() {
    nodeConsecutiveFailures = 0;
  }

  function handleNodeFailure() {
    nodeConsecutiveFailures++;
    nodeLastFailureTime = Date.now();
  }

  function isNodeCircuitBroken(): boolean {
    if (nodeConsecutiveFailures >= 5) {
      const elapsed = Date.now() - nodeLastFailureTime;
      if (elapsed < 60000) {
        return true; // Circuit is broken (503 Service Unavailable)
      } else {
        // 1 minute has passed, reset failure counter to allow a test request
        nodeConsecutiveFailures = 0;
        return false;
      }
    }
    return false;
  }

  function getFractalAuth(): { url: string; auth64: string } {
    const url = process.env.FRACTAL_RPC_URL;
    const user = process.env.FRACTAL_RPC_USER;
    const password = process.env.FRACTAL_RPC_PASSWORD;

    if (!url) {
      throw new Error("FRACTAL_RPC_URL environment variable is required");
    }
    if (!user || !password) {
      throw new Error("FRACTAL_RPC_USER and FRACTAL_RPC_PASSWORD environment variables are required");
    }

    const auth64 = Buffer.from(`${user}:${password}`).toString("base64");
    return { url, auth64 };
  }

  async function validateTxOnChain(txid: string, expectedPriceFB: number): Promise<boolean> {
    if (isNodeCircuitBroken()) {
      const error = new Error("Node circuit broken");
      (error as any).status = 503;
      throw error;
    }

    let NODE_URL: string;
    let auth64: string;
    try {
      const authInfo = getFractalAuth();
      NODE_URL = authInfo.url;
      auth64 = authInfo.auth64;
    } catch (err: any) {
      console.error("[Node RPC Setup] Error fetching node credentials:", err?.message || err);
      throw err;
    }
    
    try {
      console.log(`[Subscription Validator] Connecting to Fractal Node getrawtransaction for ${txid}`);
      const res = await fetch(NODE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth64}`
        },
        body: JSON.stringify({
          jsonrpc: "1.0",
          id: "fractalsubs",
          method: "getrawtransaction",
          params: [txid, true]
        })
      });
      
      if (!res.ok) {
        console.warn(`[Node RPC Validation] RPC node returned non-OK status: ${res.status}`);
        handleNodeFailure();
        throw new Error(`Node RPC error status: ${res.status}`);
      }
      
      const data: any = await res.json();
      handleNodeSuccess();
      
      if (data.error) {
        console.warn(`[Node RPC Validation] RPC node error (tx potentially invalid):`, data.error);
        return false;
      }
      
      const tx = data.result;
      if (!tx || !tx.vout) {
        console.warn(`[Node RPC Validation] RPC node returned invalid transaction object:`, tx);
        return false;
      }
      
      const expectedSatoshis = Math.round(expectedPriceFB * 100000000);
      const minSatoshis = expectedSatoshis * 0.98;
      
      let paysPlatform = false;
      const platformAddress = "bc1pmoonyetispaintingcanvasplatformfractaladdr2026";
      
      for (const out of tx.vout) {
        if (out.scriptPubKey && out.scriptPubKey.address === platformAddress) {
          const valueSat = Math.round((out.value || 0) * 100000000);
          if (valueSat >= minSatoshis) {
            paysPlatform = true;
            break;
          }
        }
      }
      
      if (!paysPlatform) {
        for (const out of tx.vout) {
          if (out.scriptPubKey && Array.isArray(out.scriptPubKey.addresses)) {
            if (out.scriptPubKey.addresses.includes(platformAddress)) {
              const valueSat = Math.round((out.value || 0) * 100000000);
              if (valueSat >= minSatoshis) {
                paysPlatform = true;
                break;
              }
            }
          }
        }
      }
      
      return paysPlatform;
    } catch (err: any) {
      if (err.status !== 503) {
        console.warn(`[Node RPC Validation] Exception querying node for tx ID ${txid}:`, err?.message || err);
        handleNodeFailure();
      }
      throw err;
    }
  }

  // SUB ENDPOINT 1: Get subscription plans
  app.get("/api/subscriptions/plans", (req, res) => {
    res.json(SUBS_PLANS);
  });

  // SUB ENDPOINT 2: Get subscription status
  app.get("/api/subscriptions/status/:address", (req, res) => {
    const address = req.params.address;
    const user = usersRecord[address];
    if (!user) {
      return res.json({ active: false, planId: null, expiresAt: null, txid: null });
    }
    if (user.subscription && user.subscription.expiresAt > Date.now()) {
      return res.json({
        active: true,
        planId: user.subscription.planId,
        expiresAt: user.subscription.expiresAt,
        txid: user.subscription.txid
      });
    }
    return res.json({ active: false, planId: null, expiresAt: null, txid: null });
  });

  // SUB ENDPOINT 3: Post subscribe transaction validation
  app.post("/api/subscriptions/subscribe", async (req, res) => {
    const { address, planId, txid } = req.body;
    if (!address || !planId || !txid) {
       return res.status(400).json({ error: "address, planId and txid are required." });
    }
    const plan = SUBS_PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: "Invalid planId selector." });
    }

    try {
      console.log(`[Subscription Service] Validating subscription for ${address} via getrawtransaction on txid: ${txid}`);
      let onchainValid = false;
      try {
        onchainValid = await validateTxOnChain(txid, plan.priceFB);
      } catch (err: any) {
        if (err.status === 503 || err.message === "Node circuit broken") {
          return res.status(503).json({ error: "Service unavailable: Node circuit breaker active. Retry later." });
        }
        console.warn(`[Subscription Service] Node RPC error:`, err?.message || err);
        return res.status(400).json({ error: "node unavailable, retry later" });
      }

      if (!onchainValid) {
        return res.status(400).json({ error: "Transacción no válida o no pagó al destinatario/monto correcto." });
      }

      if (!usersRecord[address]) {
        usersRecord[address] = {
          username: `Painter-${address.substring(4, 9)}`,
          address,
          fb_balance: 5.0,
          mooneyetis_balance: 1250,
          pixel_tokens_balance: 200,
          total_pixels_owned: 0,
          flag_emoji: "🇺🇸",
          created_at: Date.now()
        };
      }

      const durationMs = 30 * 24 * 3600 * 1000; 
      const expiresAt = Date.now() + durationMs;

      usersRecord[address].subscription = {
        planId,
        expiresAt,
        txid,
        subscribedAt: Date.now()
      };

      usersRecord[address].max_charges = plan.maxCharges;
      usersRecord[address].charges = plan.maxCharges;

      saveJSON(FILE_USERS, usersRecord);
      return res.json({ success: true, expiresAt, maxCharges: plan.maxCharges });
    } catch (err: any) {
      console.error("[Subscription Service] Subscribe error:", err);
      return res.status(500).json({ error: err?.message || "Internal subscription error." });
    }
  });

  // SUB ENDPOINT 4: Cancel auto renewal
  app.post("/api/subscriptions/cancel", (req, res) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required." });
    }
    const user = usersRecord[address];
    if (user && user.subscription) {
      // Unsubscribe by setting expiresAt to now + 1 day
      user.subscription.expiresAt = Math.min(user.subscription.expiresAt, Date.now() + 24 * 3600 * 1000);
      saveJSON(FILE_USERS, usersRecord);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "No active subscription found to cancel." });
  });

  // API - bitcoin-cli Node Execution Command Terminal (Section 3 Node specs)
  app.post("/api/rpc/cmd", (req, res) => {
    const { cmd, args } = req.body;
    if (!cmd) {
      return res.status(400).json({ error: "Command was not supplied." });
    }

    // Standardize commands
    const commandName = cmd.trim();
    const argList = args || [];

    switch (commandName) {
      case "getblockchaininfo": {
        const latestBlock = blocksRecord[0];
        return res.json({
          chain: "main",
          blocks: latestBlock.height,
          headers: latestBlock.height,
          bestblockhash: latestBlock.hash,
          difficulty: latestBlock.difficulty,
          mediantime: latestBlock.time,
          verificationprogress: 0.9999998,
          initialblockdownload: false,
          chainwork: "0000000000000000000000000000000000000000000003aa9fa58bb59bb4df23"
        });
      }

      case "gettransaction": {
        const queryTxid = argList[0];
        if (!queryTxid) {
          return res.status(400).json({ error: "gettransaction requires a <txid> argument." });
        }
        const transaction = txList.find(t => t.txid === queryTxid);
        if (!transaction) {
          return res.status(404).json({ error: `Transaction ${queryTxid} not found on wallet fractal_main.` });
        }
        return res.json({
          amount: parseFloat((transaction.currency === "FB" ? -transaction.totalCost : 0).toFixed(8)),
          confirmations: transaction.confirmations,
          blockhash: transaction.status === "confirmed" ? blocksRecord[0].hash : undefined,
          blockheight: transaction.confirmedAtBlock,
          txid: transaction.txid,
          time: Math.floor(transaction.timestamp / 1000),
          timereceived: Math.floor(transaction.timestamp / 1000),
          bip125_replaceable: "no",
          details: [
            {
              address: transaction.address,
              category: "send",
              amount: parseFloat((transaction.currency === "FB" ? -transaction.totalCost : 0).toFixed(8)),
              label: "",
              vout: 0,
              fee: -0.000185
            }
          ],
          hex: "02000000000101daec70fdf5..."
        });
      }

      case "listunspent": {
        const results = Object.values(usersRecord).map(u => ({
          txid: "utxo" + Math.random().toString(36).substring(2, 10) + "fb001",
          vout: Math.floor(Math.random() * 3),
          address: u.address,
          label: u.username,
          scriptPubKey: "5120" + Math.random().toString(16).substring(2, 66),
          amount: parseFloat((u.fb_balance).toFixed(8)),
          confirmations: Math.floor(Math.random() * 400) + 2,
          spendable: true,
          solvable: true,
          desc: "rawtr(bc1p...)",
          safe: true
        }));
        return res.json(results);
      }

      default: {
        return res.status(400).json({
          error: `Unknown command '${commandName}'. Supported endpoints are: getblockchaininfo, gettransaction, listunspent.`
        });
      }
    }
  });

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
