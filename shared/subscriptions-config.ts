export interface SubscriptionPlan {
  id: string;
  name: string;
  durationHours: number;
  chargesMax: number;
  chargeCooldownSec: number;
  colors: number;
  imageCredits: number;
  costFb: number;
  description: string;
}

export interface Tier {
  id: string;
  name: string;
  badge: string;
  minBalance: number;
  discountPercent: number;
  perks: string;
  nextTierMin: number | null;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    durationHours: 0,
    chargesMax: 50,
    chargeCooldownSec: 15,
    colors: 8,
    imageCredits: 0,
    costFb: 0,
    description: "Acceso básico gratis con recarga estándar.",
  },
  {
    id: "pro_24h",
    name: "Pro 24h",
    durationHours: 24,
    chargesMax: 300,
    chargeCooldownSec: 10,
    colors: 24,
    imageCredits: 0,
    costFb: 1,
    description: "Acceso profesional completo durante 24 horas.",
  },
  {
    id: "pro_7d",
    name: "Pro 7d",
    durationHours: 168,
    chargesMax: 500,
    chargeCooldownSec: 10,
    colors: 24,
    imageCredits: 0,
    costFb: 7,
    description: "Acceso profesional completo durante 7 días.",
  },
  {
    id: "pro_30d",
    name: "Pro 30d",
    durationHours: 720,
    chargesMax: 1000,
    chargeCooldownSec: 10,
    colors: 24,
    imageCredits: 0,
    costFb: 30,
    description: "Acceso profesional completo durante 30 días.",
  },
  {
    id: "image_24h",
    name: "Image+ 24h",
    durationHours: 24,
    chargesMax: 500,
    chargeCooldownSec: 10,
    colors: 8,
    imageCredits: 1,
    costFb: 6,
    description: "Sube una imagen de hasta 64x64 px al lienzo en 24 horas.",
  },
  {
    id: "pro_image_7d",
    name: "Pro+Image 7d",
    durationHours: 168,
    chargesMax: 1000,
    chargeCooldownSec: 10,
    colors: 24,
    imageCredits: 1,
    costFb: 12,
    description: "Combo Pro 7d + 1 crédito de imagen. La mejor relación precio/valor.",
  },
];

export const TIERS: Tier[] = [
  {
    id: "basico",
    name: "Básico",
    badge: "🎨",
    minBalance: 0,
    discountPercent: 0,
    perks: "Acceso estándar libre al lienzo colaborativo",
    nextTierMin: 1_000_000,
  },
  {
    id: "explorer",
    name: "Explorer",
    badge: "🏕️",
    minBalance: 1_000_000,
    discountPercent: 5,
    perks: "Badge básico, Canal privado de Discord, 5% descuento FB",
    nextTierMin: 10_000_000,
  },
  {
    id: "voyager",
    name: "Voyager",
    badge: "🛸",
    minBalance: 10_000_000,
    discountPercent: 10,
    perks: "Early access features, +50 píxeles por día, 10% descuento FB",
    nextTierMin: 50_000_000,
  },
  {
    id: "pioneer",
    name: "Pioneer",
    badge: "🎖️",
    minBalance: 50_000_000,
    discountPercent: 15,
    perks: "Lienzo privado 10x10, Votaciones de gobernanza, 15% descuento FB",
    nextTierMin: 100_000_000,
  },
  {
    id: "astronaut",
    name: "Astronaut",
    badge: "🚀",
    minBalance: 100_000_000,
    discountPercent: 20,
    perks: "Acceso a eventos privados, 20% descuento FB",
    nextTierMin: 500_000_000,
  },
  {
    id: "cosmonaut",
    name: "Cosmonaut",
    badge: "💎",
    minBalance: 500_000_000,
    discountPercent: 25,
    perks: "Mentorías 1:1, 25% descuento FB, NFT exclusivo",
    nextTierMin: null,
  },
];

/**
 * Devuelve el tier correspondiente a un balance dado de $MY.
 * Recorre los tiers de mayor a menor; el primero cuyo minBalance <= balance gana.
 */
export function tierForBalance(myBalance: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (myBalance >= TIERS[i].minBalance) {
      return TIERS[i];
    }
  }
  return TIERS[0]; // fallback a Básico
}

/**
 * Devuelve el plan de suscripción por id.
 */
export function planById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
