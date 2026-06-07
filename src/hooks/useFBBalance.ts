import { useState, useEffect, useCallback } from "react";
import { getFBBalance } from "../lib/fb-balance";

export function useFBBalance(address: string | undefined) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fbBal = await getFBBalance(address);
      setBalance(fbBal);
    } catch (err: any) {
      setError(err?.message || "Failed to load FB balance");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refresh: fetchBalance };
}
