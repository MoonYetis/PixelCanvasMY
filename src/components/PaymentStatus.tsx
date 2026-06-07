import React from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface PaymentStatusProps {
  stage: "idle" | "calculating" | "requesting_signature" | "polling_onchain" | "success" | "error";
  confirmations: number;
  txid: string | null;
  errorMsg: string | null;
  errorType: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  stage,
  confirmations,
  txid,
  errorMsg,
  errorType,
  onRetry,
  onCancel
}) => {
  if (stage === "idle") return null;

  return (
    <div className="bg-[#0b0c14] border border-slate-800/80 rounded-2xl p-4.5 space-y-4 shadow-xl">
      {stage === "requesting_signature" && (
        <div className="flex flex-col items-center text-center py-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
            <div className="relative p-3.5 bg-amber-950/30 border border-amber-600/40 text-amber-500 rounded-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-305 font-sans">Awaiting Wallet Signature</h4>
            <p className="text-[11px] text-slate-400 max-w-[280px] leading-normal font-sans">
              Abre tu UniSat Wallet y aprueba la solicitud de pago de FB para procesar tu compra.
            </p>
          </div>
        </div>
      )}

      {stage === "polling_onchain" && (
        <div className="flex flex-col items-center text-center py-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-purple-500/15 animate-pulse" />
            <div className="relative p-3.5 bg-purple-950/25 border border-purple-800/40 text-purple-400 rounded-full">
              <Clock className="w-6 h-6 animate-bounce" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-purple-300 font-sans">Verifying transaction...</h4>
            <p className="text-[11px] text-slate-300 max-w-[280px] leading-normal font-sans">
              Transmisión exitosa. Esperando que la transacción sea incluida en un bloque de Fractal Bitcoin.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[10px] bg-purple-950/45 px-2.5 py-0.5 border border-purple-800/45 rounded-full text-purple-200 font-mono flex items-center gap-1.5 shadow-inner">
                <RefreshCw className="w-3 h-3 animate-spin text-purple-400 shrink-0" />
                Confirmaciones: <strong className="text-amber-400 font-bold">{confirmations}</strong> / 1
              </span>
            </div>
            {txid && (
              <div className="pt-2">
                <span className="text-[8px] font-mono text-slate-500 block">TRANSACTION HASH:</span>
                <span className="text-[9px] font-mono bg-slate-950 px-2 py-1 rounded inline-block text-purple-400 max-w-[260px] truncate select-all select-all border border-slate-900">
                  {txid}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === "success" && (
        <div className="flex flex-col items-center text-center py-4 space-y-3 animate-fade-in">
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-full shadow-lg shadow-emerald-950/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-emerald-400 font-sans flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              ¡Pago Confirmado Exitosamente!
            </h4>
            <p className="text-[11px] text-slate-400 max-w-[300px] leading-normal font-sans">
              Los Pixel Tokens (PX) se han acreditado de forma on-chain en tu cuenta de pintor. ¡Ya puedes pintar en el lienzo MoonYetis!
            </p>
          </div>
          {txid && (
            <div className="text-[9px] font-mono text-slate-500 pt-1">
              Enlace de exploración:{" "}
              <a
                href={`https://fractal.unisat.io/tx/${txid}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline inline-block truncate max-w-[120px] align-bottom ml-1"
              >
                {txid.substring(0, 16)}...
              </a>
            </div>
          )}
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center text-center py-3 space-y-3 animate-fade-in">
          <div className="p-3 bg-rose-950/30 border border-rose-500/25 text-rose-500 rounded-full">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-[280px]">
            <h4 className="text-sm font-bold text-rose-400 font-sans">Error de Transacción</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed font-sans">{errorMsg}</p>
            {errorType === "INSUFFICIENT_BALANCE" && (
              <span className="text-[9px] text-amber-500 block font-mono">Tip: Solicita FB de prueba en el simu-faucet de abajo.</span>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2 w-full">
            <button
              onClick={onRetry}
              className="flex-1 cursor-pointer bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 border border-purple-800/60 rounded-xl py-2 text-xs font-bold text-white shadow-md shadow-indigo-950/30 transition-all font-sans"
            >
              Reintentar Firma
            </button>
            <button
              onClick={onCancel}
              className="flex-1 cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-350 transition-all font-sans"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
