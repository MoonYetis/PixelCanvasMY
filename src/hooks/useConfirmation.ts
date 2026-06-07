import { useState, useCallback, useRef } from "react";

export function useConfirmation() {
  const [status, setStatus] = useState<"idle" | "polling" | "confirmed" | "timeout" | "failed">("idle");
  const [confirmations, setConfirmations] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const waitForConfirmation = useCallback(
    async (txid: string, address: string, pixelsCount: number, onConfirmed?: () => void) => {
      stopPolling();
      setStatus("polling");
      setConfirmations(0);
      setError(null);

      let attempts = 0;
      const maxAttempts = 30; // 90 seconds timeout max

      const poll = async () => {
        attempts++;
        try {
          const res = await fetch("/api/wallet/verify-and-credit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txid, address, pixelsCount })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Verification server error");
          }

          const data = await res.json();
          setConfirmations(data.confirmations || 0);

          if (data.status === "confirmed" || data.confirmations >= 1) {
            setStatus("confirmed");
            stopPolling();
            if (onConfirmed) onConfirmed();
          } else if (data.status === "failed") {
            setStatus("failed");
            setError("Transaction reported as failed on the blockchain.");
            stopPolling();
          }
        } catch (err: any) {
          console.error("Error polling for confirmation:", err);
          // Don't stop on single error, retry (resilient on networks errors)
          if (attempts >= maxAttempts) {
            setStatus("timeout");
            setError("Polling timeout reached before confirmation on block.");
            stopPolling();
          }
        }

        if (attempts >= maxAttempts && status === "polling") {
          setStatus("timeout");
          setError("Network confirmation timeout: Please check block explorer later.");
          stopPolling();
        }
      };

      // Run first poll instantly
      poll();
      // Set interval 3 seconds
      pollIntervalRef.current = setInterval(poll, 3000);
    },
    [stopPolling, status]
  );

  return { status, confirmations, error, waitForConfirmation, reset: () => { setStatus("idle"); setError(null); setConfirmations(0); stopPolling(); } };
}
