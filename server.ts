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
        pixelsRecord[`${p.x},${p.y}`] = {
          x: p.x,
          y: p.y,
          color: p.color,
          owner: tx.address,
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
  app.use(express.json());

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
    if (chatList.length > 100) {
      chatList.shift();
    }
    saveJSON(FILE_CHAT, chatList);
    res.json({ success: true, chat: chatList });
  });

  // API - Fetch or create user profile based on Taproot address (bc1p...)
  app.get("/api/users/profile/:address", (req, res) => {
    const address = req.params.address;
    if (!address.startsWith("bc1p")) {
      return res.status(400).json({ error: "Only Taproot (bc1p...) addresses are supported on Fractal Bitcoin." });
    }

    if (!usersRecord[address]) {
      usersRecord[address] = {
        username: `Painter-${address.substring(4, 9)}`,
        address: address,
        fb_balance: 5.5, // 5.5 FB starter balance for instant fun
        mooneyetis_balance: 2500, // 2500 moon yetis tokens
        total_pixels_owned: 0,
        flag_emoji: "🇺🇸", // default flag
        created_at: Date.now()
      };
      saveJSON(FILE_USERS, usersRecord);
    }
    res.json(usersRecord[address]);
  });

  // API - Update profile username and flag emoji
  app.post("/api/users/update", (req, res) => {
    const { address, username, flagEmoji } = req.body;
    if (!address || !address.startsWith("bc1p")) {
      return res.status(400).json({ error: "Invalid Taproot address." });
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
    if (!address || !address.startsWith("bc1p")) {
      return res.status(400).json({ error: "Invalid Taproot address." });
    }

    if (!usersRecord[address]) {
      usersRecord[address] = {
        username: `Yeti-${address.substring(4, 9)}`,
        address: address,
        fb_balance: 0,
        mooneyetis_balance: 0,
        total_pixels_owned: 0,
        created_at: Date.now()
      };
    }

    if (type === "FB") {
      usersRecord[address].fb_balance += 5.0;
    } else {
      usersRecord[address].mooneyetis_balance += 2500;
    }

    saveJSON(FILE_USERS, usersRecord);
    res.json({ success: true, profile: usersRecord[address] });
  });

  // API - Submit pixel block paint action
  app.post("/api/pixels/paint", (req, res) => {
    const { address, pixels, currency } = req.body; // pixels: {x, y, color}[]

    if (!address || !address.startsWith("bc1p")) {
      return res.status(400).json({ error: "Taproot bc1p address is required." });
    }
    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return res.status(400).json({ error: "No pixels specified." });
    }

    const pricePerPixel = currency === "MOONYETIS" ? 50 : 0.01; // 50 MoonYetis vs 0.01 FB (Discounted option)
    const cost = pixels.length * pricePerPixel;

    const user = usersRecord[address];
    if (!user) {
      return res.status(404).json({ error: "User profile not established." });
    }

    if (currency === "MOONYETIS") {
      if (user.mooneyetis_balance < cost) {
        return res.status(400).json({ error: `Insufficient MoonYetis. Cost: ${cost} MOONYETIS. Balance: ${user.mooneyetis_balance}` });
      }
      user.mooneyetis_balance -= cost;
    } else {
      if (user.fb_balance < cost) {
        return res.status(400).json({ error: `Insufficient Fractal Bitcoin (FB). Cost: ${cost} FB. Balance: ${user.fb_balance}` });
      }
      user.fb_balance -= cost;
    }

    // Design: Create a pending payment broadcast transaction which confirms on next block (30 sec interval)
    const txid = "tx" + Math.random().toString(36).substring(2, 15) + "fb2024" + Math.random().toString(36).substring(2, 10);
    const newTx: PaintTransaction = {
      txid,
      address,
      pixels,
      totalCost: cost,
      currency,
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
