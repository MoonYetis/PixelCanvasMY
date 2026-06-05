export interface PixelData {
  x: number;
  y: number;
  color: string;
  owner: string; // bc1p... Address
  ownerUsername?: string; // Painter username
  pricePaid: number; // FB, Moonyetis or PX
  currency: 'FB' | 'MOONYETIS' | 'PX';
  timestamp: number;
}

export interface UserProfile {
  username: string;
  address: string; // bc1p... taprootaddress
  fb_balance: number;
  mooneyetis_balance: number;
  pixel_tokens_balance: number;
  total_pixels_owned: number;
  created_at: number;
  flag_emoji?: string;
  google_email?: string;
  google_name?: string;
  avatar_url?: string;
}

export interface PaintTransaction {
  txid: string;
  address: string;
  pixels: { x: number; y: number; color: string }[];
  totalCost: number;
  currency: 'FB' | 'MOONYETIS' | 'PX';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  confirmedAtBlock?: number;
}

export interface BlockchainBlock {
  height: number;
  hash: string;
  time: number;
  tx_count: number;
  difficulty: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  flag_emoji: string;
  text: string;
  timestamp: number;
}
