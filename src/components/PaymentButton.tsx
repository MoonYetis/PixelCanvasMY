import React from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  priceFB: number;
  pixelsCount: number;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  priceFB,
  pixelsCount
}) => {
  return (
    <button
      id="btn-confirm-payment-fb"
      onClick={disabled || isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      className={`w-full font-sans cursor-pointer py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg ${
        disabled || isLoading
          ? "bg-slate-800 text-slate-500 border border-slate-700/55 cursor-not-allowed opacity-60"
          : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-b-2 border-orange-700 hover:scale-[1.01] hover:shadow-orange-950/20 active:scale-[0.99]"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white" />
          <span>Confirmando Firma...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 shrink-0 text-white" />
          <span>Confirmar Pago {priceFB.toFixed(3)} FB</span>
        </>
      )}
    </button>
  );
};
