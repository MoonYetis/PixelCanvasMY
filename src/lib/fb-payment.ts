import { getUnisat } from "./unisat";

export const FB_TO_SATOSHIS = 100000000;
export const PIXEL_PRICE_FB = 0.001; // each pixel
export const MIN_PIXELS_PURCHASE = 100;
export const MAX_PIXELS_PURCHASE = 100000;

export interface PurchaseCalculation {
  pixelsRequested: number;
  subtotalFB: number;
  userTier: string | null;
  discountPercentage: number;
  finalPriceFB: number;
  finalPriceSatoshis: number;
}

export function calculatePurchase(
  pixelsCount: number,
  userMyBalance: number,
  userTierInfo: { name: string; discountPercent: number } | null
): PurchaseCalculation {
  const subtotalFB = pixelsCount * PIXEL_PRICE_FB;
  const discount = userTierInfo ? userTierInfo.discountPercent / 100 : 0;
  const discountAmountFB = subtotalFB * discount;
  const finalPriceFB = subtotalFB - discountAmountFB;
  
  return {
    pixelsRequested: pixelsCount,
    subtotalFB,
    userTier: userTierInfo?.name || null,
    discountPercentage: discount * 105 ? Math.round(discount * 100) : 0, // ensure clean integer percentage
    finalPriceFB,
    finalPriceSatoshis: Math.ceil(finalPriceFB * FB_TO_SATOSHIS)
  };
}

export async function requestFBPayment(
  amountFB: number,
  userAddress: string,
  userId: string
): Promise<string> {
  // Platform Fractal Address controlled by MoonYetis
  const platformAddress = "bc1pmoonyetispaintingcanvasplatformfractaladdr2026";
  const unisat = getUnisat();

  if (unisat && typeof unisat.requestPayment === "function") {
    try {
      // Amount is usually supplied as number of Bitcoins/Fractal Bitcoins
      const txid = await unisat.requestPayment({
        address: platformAddress,
        amount: amountFB,
        memo: `moonyetis_user_${userId}`
      });
      if (!txid) {
        throw new Error("USER_REJECTED");
      }
      return txid;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("User rejected") || errMsg.includes("rejected") || err?.code === 4001) {
        throw new Error("USER_REJECTED");
      }
      throw new Error("NETWORK_ERROR");
    }
  } else {
    // Simulated fallback when Unisat is not present (iframe sandbox or clean desktop flow local testing)
    console.warn("Unisat extension requestPayment not available, starting simulated transaction...");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate signing delay
    const hex = "0123456789abcdef";
    let mockTxid = "mock";
    for (let i = 0; i < 60; i++) {
      mockTxid += hex[Math.floor(Math.random() * 16)];
    }
    return mockTxid;
  }
}
