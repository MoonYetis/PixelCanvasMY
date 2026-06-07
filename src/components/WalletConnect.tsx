import React, { useState, useEffect, FormEvent } from "react";
import { UserProfile } from "../types";
import { Wallet, Info, Coins, Sparkles, Send } from "lucide-react";

interface WalletConnectProps {
  currentAddress: string;
  userProfile: UserProfile | null;
  onAddressChange: (address: string) => void;
  onRefreshProfile: () => void;
}

export default function WalletConnect({
  currentAddress,
  userProfile,
  onAddressChange,
  onRefreshProfile,
}: WalletConnectProps) {
  const [inputAddress, setInputAddress] = useState("");
  const [unisatAvailable, setUnisatAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState<string | null>(null);

  // Check if UniSat is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win.unisat) {
        setUnisatAvailable(true);
      }
    }
  }, []);

  // Connect real UniSat if available
  const connectUniSat = async () => {
    setIsLoading(true);
    try {
      const win = window as any;
      if (win.unisat) {
        // Request accounts
        const accounts = await win.unisat.requestAccounts();
        if (accounts && accounts.length > 0) {
          // Check for taproot or segwit address
          const taprootAddr = accounts.find((acc: string) => acc.startsWith("bc1p") || acc.startsWith("bc1q"));
          if (taprootAddr) {
            onAddressChange(taprootAddr);
          } else {
            // fallback to first account but show warning
            onAddressChange(accounts[0]);
          }
        }
      }
    } catch (err) {
      console.error("UniSat Connection Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomTaproot = () => {
    const chars = "abcdef0123456789";
    let randomStr = "";
    for (let i = 0; i < 58; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }
    const finalAddr = "bc1p" + randomStr;
    onAddressChange(finalAddr);
    setInputAddress(finalAddr);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputAddress.startsWith("bc1p") && !inputAddress.startsWith("bc1q")) {
      alert("Error: Only Taproot (bc1p...) and Segwit (bc1q...) addresses are supported on Fractal Bitcoin.");
      return;
    }
    onAddressChange(inputAddress.trim());
  };

  const triggerFaucet = async (tokenType: "FB" | "MOONYETIS") => {
    if (!currentAddress) return;
    setFaucetLoading(tokenType);
    try {
      const response = await fetch("/api/wallet/sim-faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: currentAddress, type: tokenType }),
      });
      if (response.ok) {
        onRefreshProfile();
      }
    } catch (err) {
      console.error("Faucet error:", err);
    } finally {
      setFaucetLoading(null);
    }
  };

  return (
    <div id="wallet-connect-card" className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Coins className="w-24 h-24 text-purple-500" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-display font-semibold text-lg">Fractal Wallet</h2>
            <p className="text-xs text-gray-400 font-mono">Mainnet Network (0x2024)</p>
          </div>
        </div>
        {!currentAddress ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/50">
            Disconnected
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
            Connected
          </span>
        )}
      </div>

      {!currentAddress ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Connect your Fractal address to buy and place pixels. The canvas supports standard Taproot (<code className="text-purple-400 font-mono">bc1p...</code>) and Segwit (<code className="text-purple-400 font-mono">bc1q...</code>) addresses.
          </p>

          <div className="flex flex-col gap-2">
            {unisatAvailable ? (
              <button
                id="btn-connect-unisat"
                onClick={connectUniSat}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? "Connecting..." : "Connect UniSat Wallet"}
              </button>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-950/50 p-2 rounded border border-gray-800/40 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 shrink-0" />
                <span>UniSat Chrome Extension not detected inside iframe. Using Sandbox Wallet Simulator.</span>
              </div>
            )}

            <button
              id="btn-gen-taproot"
              onClick={generateRandomTaproot}
              className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              Generate Sandbox Wallet (Taproot)
            </button>
          </div>

          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-gray-800/50">
            <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
              Or Paste an Existing Fractal Address (bc1p/bc1q)
            </label>
            <div className="flex gap-2">
              <input
                id="addr-input"
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="bc1pxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
              <button
                id="btn-custom-addr-submit"
                type="submit"
                className="px-3 rounded-lg bg-gray-800 hover:bg-gray-750 text-purple-400 border border-gray-700 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
                title="Use custom address"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-950 rounded-lg border border-gray-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase font-mono tracking-wider">Taproot Connection</span>
              <button
                id="btn-wallet-disconnect"
                onClick={() => onAddressChange("")}
                className="text-2xs text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
            <p className="text-xs font-mono text-purple-300 break-all select-all selection:bg-purple-900 selection:text-white">
              {currentAddress}
            </p>
          </div>

          {userProfile && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-gray-950/70 border border-gray-800/30 rounded-lg p-2.5">
                <span className="text-2xs text-gray-400 font-mono block mb-0.5">FB Balance</span>
                <span className="text-sm font-mono font-bold text-yellow-400">
                  {userProfile.fb_balance.toFixed(4)} FB
                </span>
                <button
                  id="faucet-fb-btn"
                  onClick={() => triggerFaucet("FB")}
                  disabled={faucetLoading !== null}
                  className="mt-1.5 w-full py-1 text-2xs rounded bg-yellow-950/55 hover:bg-yellow-900/60 border border-yellow-800/40 text-yellow-500 font-mono transition-colors font-semibold py-0.5 flex items-center justify-center cursor-pointer"
                >
                  {faucetLoading === "FB" ? "Claims..." : "Claim +5 FB Faucet"}
                </button>
              </div>

              <div className="bg-gray-950/70 border border-gray-800/30 rounded-lg p-2.5">
                <span className="text-2xs text-gray-400 font-mono block mb-0.5">MoonYetis Token</span>
                <span className="text-sm font-mono font-bold text-purple-400">
                  {userProfile.mooneyetis_balance.toLocaleString()} MY
                </span>
                <button
                  id="faucet-my-btn"
                  onClick={() => triggerFaucet("MOONYETIS")}
                  disabled={faucetLoading !== null}
                  className="mt-1.5 w-full py-1 text-2xs rounded bg-purple-950/55 hover:bg-purple-900/60 border border-purple-800/40 text-purple-400 font-mono transition-colors font-semibold py-0.5 flex items-center justify-center cursor-pointer"
                >
                  {faucetLoading === "MOONYETIS" ? "Claims..." : "Claim +2.5K MY"}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-2xs text-gray-500 font-mono px-1">
            <span>Username: <strong className="text-gray-300">{userProfile?.username}</strong></span>
            <span>Pixels Built: <strong className="text-purple-400">{userProfile?.total_pixels_owned} px</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
