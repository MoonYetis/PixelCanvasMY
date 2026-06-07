import { useState, useCallback } from "react";
import { calculatePurchase } from "../lib/fb-payment";

export type PaymentStage = "idle" | "calculating" | "requesting_signature" | "polling_onchain" | "success" | "error";

/**
 * requestFBPayment logic using window.unisat.requestPayment with robust error handling for user rejection, network issues, and timeouts.
 */
export async function requestFBPayment(
  amountFB: number,
  userAddress: string,
  userId: string,
  timeoutMs = 60000 // 60 seconds timeout
): Promise<string> {
  const platformAddress = "bc1pmoonyetispaintingcanvasplatformfractaladdr2026";
  const unisat = typeof window !== "undefined" ? (window as any).unisat : undefined;

  if (unisat && typeof unisat.requestPayment === "function") {
    // Implement timeout logic via Promise.race
    const paymentPromise = unisat.requestPayment({
      address: platformAddress,
      amount: amountFB,
      memo: `moonyetis_user_${userId}`
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
    });

    try {
      const txid = await Promise.race([paymentPromise, timeoutPromise]);
      if (!txid) {
        throw new Error("USER_REJECTED");
      }
      return txid;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("User rejected") ||
        errMsg.includes("rejected") ||
        errMsg.includes("USER_REJECTED") ||
        err?.code === 4001
      ) {
        throw new Error("USER_REJECTED");
      } else if (errMsg.includes("TIMEOUT")) {
        throw new Error("TIMEOUT");
      }
      throw new Error(`NETWORK_ERROR: ${errMsg}`);
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

export function usePayment(
  address: string | undefined,
  profile: any,
  fbBalance: number,
  onSuccess: () => void,
  waitForConfirmation: (txid: string, address: string, pixelsCount: number, onConfirmed: () => void) => void,
  resetConfirmation: () => void
) {
  const [stage, setStage] = useState<PaymentStage>("idle");
  const [pixelsCount, setPixelsCount] = useState<number>(500);
  const [txid, setTxid] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"INSUFFICIENT_BALANCE" | "USER_REJECTED" | "NETWORK_ERROR" | "TIMEOUT" | "UNKNOWN" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive benefits tier for discount calculation
  const getTierInfo = () => {
    if (!profile) return { name: "Básico", discountPercent: 0 };
    const myBalance = profile.mooneyetis_balance || 0;
    
    if (myBalance >= 500000000) {
      return { name: "Cosmonaut", discountPercent: 25 };
    } else if (myBalance >= 100000000) {
      return { name: "Astronaut", discountPercent: 20 };
    } else if (myBalance >= 50000000) {
      return { name: "Pioneer", discountPercent: 15 };
    } else if (myBalance >= 10000000) {
      return { name: "Voyager", discountPercent: 10 };
    } else if (myBalance >= 1000000) {
      return { name: "Explorer", discountPercent: 5 };
    }
    return { name: "Básico", discountPercent: 0 };
  };

  const tierInfo = getTierInfo();
  const calculation = calculatePurchase(pixelsCount, profile?.mooneyetis_balance || 0, tierInfo);

  const resetPayment = useCallback(() => {
    setStage("idle");
    setTxid(null);
    setErrorType(null);
    setErrorMsg(null);
    resetConfirmation();
  }, [resetConfirmation]);

  const handlePaymentError = useCallback((err: any) => {
    const errorStr = err?.message || String(err);
    console.error("Payment flow error:", errorStr);

    if (errorStr.includes("USER_REJECTED")) {
      setErrorType("USER_REJECTED");
      setErrorMsg("La transacción fue cancelada y firmada de forma negativa por el usuario.");
    } else if (errorStr.includes("INSUFFICIENT_BALANCE")) {
      setErrorType("INSUFFICIENT_BALANCE");
      setErrorMsg("Tu balance de FB es insuficiente para cubrir la compra con tu descuento actual.");
    } else if (errorStr.includes("NETWORK_ERROR")) {
      setErrorType("NETWORK_ERROR");
      setErrorMsg("Error de conexión al red de Fractal Bitcoin. Por favor, reintenta.");
    } else if (errorStr.includes("TIMEOUT")) {
      setErrorType("TIMEOUT");
      setErrorMsg("La red demoró demasiado en confirmar la transacción. Reporta con soporte técnico.");
    } else {
      setErrorType("UNKNOWN");
      setErrorMsg(errorStr || "Ocurrió un error inesperado al procesar tu pago.");
    }
    setStage("error");
  }, []);

  // Execution flow with exponential backoff on retry
  const executePayment = useCallback(async (retryCount = 0) => {
    if (!address) {
      handlePaymentError(new Error("Billetera no conectada"));
      return;
    }

    // Input checking
    if (pixelsCount < 100 || pixelsCount > 100000) {
      handlePaymentError(new Error("Cantidad de pixels debe ser entre 100 y 100,000."));
      return;
    }

    // Confirm real user balance
    if (fbBalance < calculation.finalPriceFB) {
      handlePaymentError(new Error("INSUFFICIENT_BALANCE"));
      return;
    }

    setStage("requesting_signature");
    setErrorType(null);
    setErrorMsg(null);

    try {
      // Prompt wallet signature
      const hashTx = await requestFBPayment(
        calculation.finalPriceFB,
        address,
        profile.username || "guest"
      );

      setTxid(hashTx);
      setStage("polling_onchain");

      // Polling network verification status
      waitForConfirmation(hashTx, address, pixelsCount, () => {
        setStage("success");
        onSuccess();
      });
    } catch (err: any) {
      // Retry logic on temporary connection failures (excluding deliberate user cancellations)
      const isNetworkError = err?.message?.includes("NETWORK_ERROR");
      if (isNetworkError && retryCount < 2) {
        const nextCount = retryCount + 1;
        const delay = Math.pow(2, nextCount) * 1000; // Exponential delay 2s, 4s...
        console.warn(`[Retry Payment] Network connection failed. Retrying in ${delay / 1000}s (Attempt ${nextCount}/2)...`);
        await new Promise((res) => setTimeout(res, delay));
        executePayment(nextCount);
      } else {
        handlePaymentError(err);
      }
    }
  }, [address, pixelsCount, fbBalance, calculation.finalPriceFB, profile, waitForConfirmation, onSuccess, handlePaymentError]);

  return {
    stage,
    pixelsCount,
    setPixelsCount,
    calculation,
    txid,
    errorType,
    errorMsg,
    executePayment,
    resetPayment
  };
}
