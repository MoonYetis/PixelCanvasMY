import React, { useState } from "react";
import { Sparkles, Coins, AlertCircle, HelpCircle } from "lucide-react";
import { useFBBalance } from "../hooks/useFBBalance";
import { usePayment } from "../hooks/usePayment";
import { useConfirmation } from "../hooks/useConfirmation";
import { PaymentButton } from "./PaymentButton";
import { PaymentStatus } from "./PaymentStatus";

interface CheckoutPanelProps {
  address: string | undefined;
  profile: any;
  onPaymentSuccess: () => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  address,
  profile,
  onPaymentSuccess
}) => {
  const { balance: fbBalance, isLoading: isBalanceLoading, refresh: refreshBalance } = useFBBalance(address);
  const { status: confStatus, confirmations, error: confError, waitForConfirmation, reset: resetConfirmation } = useConfirmation();

  // Complete payment hook logic integration
  const {
    stage,
    pixelsCount,
    setPixelsCount,
    calculation,
    txid,
    errorType,
    errorMsg,
    executePayment,
    resetPayment
  } = usePayment(
    address,
    profile,
    fbBalance,
    () => {
      // Success callback
      refreshBalance();
      onPaymentSuccess();
    },
    waitForConfirmation,
    resetConfirmation
  );

  const [inputVal, setInputVal] = useState<string>("500");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setPixelsCount(parsed);
    }
  };

  const applyPreset = (presetValue: number) => {
    setPixelsCount(presetValue);
    setInputVal(presetValue.toString());
  };

  const isInsufficient = fbBalance < calculation.finalPriceFB;
  const isInputInvalid = isNaN(pixelsCount) || pixelsCount < 100 || pixelsCount > 100000;
  const btnDisabled = !address || isInputInvalid || isInsufficient || stage === "requesting_signature" || stage === "polling_onchain";

  return (
    <div id="checkout-panel-root" className="space-y-4">
      {/* Visual checkout wizard interface */}
      <div className="bg-[#0f111a] text-slate-100 border border-slate-800 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
        {/* Decorative background ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Title and Badge */}
        <div className="relative z-10 flex border-b border-slate-800/80 pb-3.5 justify-between items-center">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">
              💳 Checkout de Pixels (Pago en FB)
            </h3>
          </div>
          <span className="text-[10px] bg-amber-950/45 border border-amber-600/40 text-amber-400 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            On-Chain Beta
          </span>
        </div>

        {/* Tier status indicator card */}
        <div className="relative z-10 bg-indigo-950/20 border border-indigo-900/35 p-3 rounded-2xl text-[11px] flex justify-between items-center">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-wider">Tu Holdings Tier</span>
            <span className="font-bold text-indigo-300">
              🏆 {calculation.userTier || "Artista Básico"}
            </span>
          </div>
          <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-0.75 rounded-lg text-[10px]">
            {calculation.discountPercentage > 0 
              ? `${calculation.discountPercentage}% Descuento Activo!` 
              : "0% Descuento (Hold $MY)"}
          </span>
        </div>

        {/* Input quantity */}
        <div className="relative z-10 space-y-1.5">
          <div className="flex justify-between items-center font-sans">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Cantidad de Pixels a comprar (PX)
            </label>
            <span className="text-[9.5px] text-slate-500 font-mono">Límite: 100 - 100K</span>
          </div>

          <div className="flex gap-2">
            <input
              id="checkout-pixels-input"
              type="number"
              min={100}
              max={100000}
              value={inputVal}
              onChange={handleInputChange}
              disabled={stage === "requesting_signature" || stage === "polling_onchain"}
              className="flex-1 bg-[#151622] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-black font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              placeholder="e.g. 500"
            />
            {/* Presets chips */}
            <div className="flex gap-1 items-center">
              {[200, 500, 1000, 5000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => applyPreset(num)}
                  disabled={stage === "requesting_signature" || stage === "polling_onchain"}
                  className={`px-2.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    pixelsCount === num
                      ? "bg-slate-100 text-slate-900 border-white shadow-sm"
                      : "bg-[#151622] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {num.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {isInputInvalid && (
            <div className="text-rose-400 text-[10px] flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Por favor ingresa un número de píxeles entre 100 y 100,000.</span>
            </div>
          )}
        </div>

        {/* Breakdown Receipts */}
        <div className="relative z-10 border border-slate-800/80 bg-[#12131e]/50 rounded-2xl p-3.5 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Precio base por unidad:</span>
            <span>0.001 FB / px</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Subtotal:</span>
            <span>{calculation.subtotalFB.toFixed(3)} FB</span>
          </div>
          {calculation.discountPercentage > 0 && (
            <div className="flex justify-between text-emerald-400 text-[11px]">
              <span>Descuento ({calculation.discountPercentage}%):</span>
              <span>-{(calculation.subtotalFB * (calculation.discountPercentage / 100)).toFixed(3)} FB</span>
            </div>
          )}
          <div className="h-px bg-slate-800/80 my-2" />
          <div className="flex justify-between items-center text-slate-150 font-black">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">TOTAL A PAGAR:</span>
            <span className="text-sm text-amber-500 font-mono font-black">
              {calculation.finalPriceFB.toFixed(3)} FB
            </span>
          </div>
          <div className="text-[9px] text-right text-slate-500 font-mono block">
            ({calculation.finalPriceSatoshis.toLocaleString()} Satoshis)
          </div>
        </div>

        {/* User Balance Wallet Verification */}
        <div className="relative z-10 flex justify-between items-center p-3 rounded-2xl bg-[#141624] border border-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs">💰 Tu balance FB:</span>
            {isBalanceLoading ? (
              <span className="text-[10px] text-slate-500 animate-pulse font-mono">Consultando...</span>
            ) : (
              <span className={`text-xs font-black font-mono transition-colors ${isInsufficient ? "text-rose-400" : "text-emerald-450"}`}>
                {fbBalance.toFixed(4)} FB
              </span>
            )}
          </div>
          {!isBalanceLoading && (
            <span className={`text-[10px] rounded-md px-1.5 py-0.5 font-bold ${isInsufficient ? "bg-rose-950/20 text-rose-400 border border-rose-950/40" : "bg-emerald-950/20 text-emerald-400 border border-emerald-950/40"}`}>
              {isInsufficient ? "⚠️ Saldo Insuficiente" : "✅ Saldo Suficiente"}
            </span>
          )}
        </div>

        {/* Action Button */}
        {stage !== "requesting_signature" && stage !== "polling_onchain" && (
          <div className="relative z-10">
            <PaymentButton
              onClick={() => executePayment()}
              disabled={btnDisabled}
              isLoading={stage === "requesting_signature"}
              priceFB={calculation.finalPriceFB}
              pixelsCount={pixelsCount}
            />
          </div>
        )}

        {/* Display live transaction/polling wizard updates */}
        <PaymentStatus
          stage={stage}
          confirmations={confirmations}
          txid={txid}
          errorMsg={errorMsg}
          errorType={errorType}
          onRetry={() => executePayment()}
          onCancel={resetPayment}
        />
      </div>

      {/* Info Tips for Developer Testers */}
      {!address && (
        <div className="bg-amber-950/10 border border-amber-900/30 rounded-2xl p-3 text-[10.5px] text-amber-500 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Billetera no conectada:</strong> Conecta tu dirección Fractal (bc1p / bc1q) en la parte superior para habilitar el checkout y los beneficios exclusivos de holding.
          </p>
        </div>
      )}
    </div>
  );
};
