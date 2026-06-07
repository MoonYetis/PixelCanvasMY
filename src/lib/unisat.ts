/**
 * Unisat Client Utilities for Fractal Bitcoin
 */

export interface UnisatWindow extends Window {
  unisat?: {
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getNetwork: () => Promise<string>;
    switchNetwork: (network: string) => Promise<void>;
    getPublicKey: () => Promise<string>;
    sendBitcoin: (toAddress: string, satoshis: number, options?: { feeRate: number }) => Promise<string>;
    requestPayment: (options: { address: string; amount: number; memo?: string }) => Promise<string>;
    signMessage: (message: string, type?: string) => Promise<string>;
  };
}

export function getUnisat(): any {
  if (typeof window !== "undefined") {
    return (window as UnisatWindow).unisat;
  }
  return undefined;
}

export function isUnisatInstalled(): boolean {
  return typeof window !== "undefined" && !!(window as UnisatWindow).unisat;
}

/**
 * Checks if the address matches Fractal Bitcoin formats (bc1p... or bc1q...)
 */
export function isValidFractalAddress(address: string): boolean {
  if (!address) return false;
  const clean = address.trim();
  return clean.startsWith("bc1p") || clean.startsWith("bc1q");
}
