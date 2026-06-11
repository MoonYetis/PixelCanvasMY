import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Clock, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { requestFBPayment } from "../hooks/usePayment";

interface SubscriptionPlan {
  id: string;
  name: string;
  priceFB: number;
  maxCharges: number;
  desc: string;
}

interface ActiveSubscription {
  active: boolean;
  planId: string | null;
  expiresAt: number | null;
  txid: string | null;
}

interface SubscriptionsPanelProps {
  address: string;
  userProfile?: any;
  onSubscriptionSuccess?: () => void;
}

export default function SubscriptionsPanel({
  address,
  userProfile,
  onSubscriptionSuccess
}: SubscriptionsPanelProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    { id: "premium", name: "Premium Plan", priceFB: 0.1, maxCharges: 500, desc: "Aumenta la energía máxima de 50 a 500 cargas continuas" },
    { id: "pro", name: "Pro Painter Plan", priceFB: 0.2, maxCharges: 1000, desc: "Aumenta la energía máxima de 50 a 1000 cargas continuas" }
  ]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [status, setStatus] = useState<ActiveSubscription>({
    active: false,
    planId: null,
    expiresAt: null,
    txid: null
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Interaction / Subscribing state variables
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [paymentStage, setPaymentStage] = useState<"idle" | "signing" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch plans and subscription status
  const fetchPlansAndStatus = async () => {
    if (!address) return;
    setLoadingStatus(true);
    try {
      // 1. Fetch available plans
      const plansRes = await fetch("/api/subscriptions/plans");
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }

      // 2. Fetch current status
      const statusRes = await fetch(`/api/subscriptions/status/${address}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus({
          active: statusData.active,
          planId: statusData.planId,
          expiresAt: statusData.expiresAt,
          txid: statusData.txid
        });
      }
    } catch (err) {
      console.error("Error loading plans or sub status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchPlansAndStatus();
  }, [address]);

  // Countdown timer effect
  useEffect(() => {
    if (!status.active || !status.expiresAt) return;

    const interval = setInterval(() => {
      const difference = status.expiresAt! - Date.now();
      if (difference <= 0) {
        setTimeLeft("Subscription has expired");
        clearInterval(interval);
        setStatus(prev => ({ ...prev, active: false }));
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let formattedTime = "";
        if (days > 0) formattedTime += `${days}d `;
        formattedTime += `${hours.toString().padStart(2, "0")}h:${minutes.toString().padStart(2, "0")}m:${seconds.toString().padStart(2, "0")}s`;
        setTimeLeft(formattedTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status.active, status.expiresAt]);

  // Handle subscribe click
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!address) return;
    setSubscribingPlanId(plan.id);
    setPaymentStage("signing");
    setErrorMessage(null);

    try {
      // 1. Trigger the UniSat browser extension signature pay
      const txid = await requestFBPayment(
        plan.priceFB,
        address,
        userProfile?.username || "subscriber"
      );

      // 2. Transmit txid to backend to authorize the subscription updates securely
      setPaymentStage("verifying");
      const subResponse = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          planId: plan.id,
          txid
        })
      });

      if (!subResponse.ok) {
        const errData = await subResponse.json();
        throw new Error(errData.error || "Fallo en la validación con la red de Fractal Bitcoin.");
      }

      const resData = await subResponse.json();
      if (resData.success) {
        setPaymentStage("success");
        setStatus({
          active: true,
          planId: plan.id,
          expiresAt: resData.expiresAt,
          txid: txid
        });
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
      } else {
        throw new Error(resData.error || "Fallo en la suscripción.");
      }
    } catch (err: any) {
      console.error("Subscription flow error:", err);
      setErrorMessage(err?.message || "Ocurrió un error inesperado al procesar tu suscripción.");
      setPaymentStage("error");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!address || !window.confirm("¿Seguro que deseas cancelar tu suscripción activa? El beneficio vencerá al final del período.")) return;
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });
      if (res.ok) {
        alert("Suscripción cancelada correctamente. Caducará al finalizar el ciclo actual.");
        fetchPlansAndStatus();
      }
    } catch (err) {
      console.error("Cancel sub error:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 text-xs">
      
      {/* Header section with tooltip and link */}
      <div className="flex justify-between items-start border-b border-slate-150 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[13px]">
            <CreditCard className="w-4.5 h-4.5 text-amber-500" />
            <span>Planes de Suscripción</span>
            
            {/* Tooltip trigger */}
            <div className="relative inline-block ml-0.5">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-0.5 rounded-full hover:bg-slate-205 text-slate-400 hover:text-slate-650 cursor-pointer"
                title="Saber más sobre tiers"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              
              {showTooltip && (
                <div className="absolute left-0 top-6 z-40 bg-slate-900 text-white rounded-xl p-3 shadow-2xl border border-slate-800 w-64 text-2xs leading-relaxed animate-fade-in font-normal space-y-2 select-text">
                  <p className="font-semibold text-amber-400 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    How MoonYetis Tiers work
                  </p>
                  <p>
                    Holders de <strong>$MY Tokens</strong> en Fractal Bitcoin obtienen descuentos automáticos del 5% al 25% en la compra de Pixel Tokens (PX).
                  </p>
                  <p>
                    Las suscripciones con FB expanden de forma permanente tu <strong>Capacidad de Carga/Energía</strong> de dibujo (50 ➔ 500 o 1000) por 30 días, permitiendo pintar obras masivas sin esperas de recarga.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowTooltip(false)}
                    className="text-[10px] text-amber-400 font-bold block pt-1 hover:underline text-right w-full cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-455">
            Optimiza tu velocidad de dibujo desbloqueando más cargas máximas on-chain
          </p>
        </div>
        
        {/* Link to external landing page */}
        <a 
          href="https://moonyetis.com/subscriptions" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 mt-0.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 transition-all"
        >
          <span>More details</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loadingStatus ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-[10px]">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-505" />
          <span>Sincronizando estado con el nodo...</span>
        </div>
      ) : (
        <>
          {/* Active Subscription status card */}
          {status.active ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-250 font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Suscripción Activa
                  </span>
                  <strong className="text-slate-800 text-xs font-bold font-sans">
                    {plans.find(p => p.id === status.planId)?.name || "Plan Premium"}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-mono block">TIEMPO RESTANTE</span>
                  <span className="text-slate-800 font-bold font-mono text-xs flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {timeLeft || "Calculando..."}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-505 font-mono bg-white border border-emerald-100 rounded-lg p-2 flex flex-col gap-1 select-all break-all leading-tight">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-sans border-b border-slate-100 pb-1 mb-0.5">
                  <span>HASH REGISTRO TRANSACCIÓN</span>
                  <span>CONFIRMADO</span>
                </div>
                <span>{status.txid}</span>
              </div>

              <div className="flex justify-between items-center text-[9.5px] text-slate-500 pt-0.5">
                <span>Beneficio de energía expandida aplicado.</span>
                <button
                  onClick={handleCancelSubscription}
                  className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Cancelar renovación
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3 text-[10.5px] text-slate-600 flex gap-2">
              <Info className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                No tienes ninguna suscripción activa en este nodo. Adquiere un plan para expandir permanentemente tus cargas de dibujo y dibujar sin límite.
              </p>
            </div>
          )}

          {/* Checkout Steps Loader */}
          {paymentStage !== "idle" && paymentStage !== "success" && (
            <div className="bg-[#0f111a] border border-slate-850 text-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-xl animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500 font-bold" />
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                    {paymentStage === "signing" ? "Firmando Pago..." : "Verificando Transacción..."}
                  </h4>
                  <p className="text-[9.5px] text-slate-400 font-sans">
                    {paymentStage === "signing" 
                      ? "Confirma el pago en tu extensión UniSat de Fractal Bitcoin." 
                      : "Sincronizando con el nodo Fractal Bitcoin... Espere 1-3 segundos."}
                  </p>
                </div>
              </div>

              {errorMessage && paymentStage === "error" && (
                <div className="text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg p-2.5 text-[10px] font-mono leading-relaxed flex gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {paymentStage === "error" && (
                <button
                  onClick={() => setPaymentStage("idle")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-lg text-[10px] transform active:scale-95 transition-all text-center"
                >
                  Regresar a los planes
                </button>
              )}
            </div>
          )}

          {/* Plans selection Grid */}
          {(paymentStage === "idle" || paymentStage === "error" || paymentStage === "success") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {plans.map((plan) => {
                const isSelected = status.active && status.planId === plan.id;
                
                return (
                  <div
                    key={plan.id}
                    className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all gap-3 relative ${
                      isSelected
                        ? "bg-emerald-50/20 border-emerald-450 ring-1 ring-emerald-400"
                        : "bg-white border-slate-205 hover:border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[7.5px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase scale-90 animate-pulse font-mono shrink-0">
                        Active
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Zap className={`w-4 h-4 ${isSelected ? "text-emerald-500 animate-bounce" : "text-amber-500"}`} />
                        <h4 className="font-extrabold text-xs text-slate-800">
                          {plan.name}
                        </h4>
                      </div>
                      <p className="text-[9.5px] text-slate-455 leading-relaxed">{plan.desc}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-between items-center mt-0.5 font-sans">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-mono scale-95 uppercase">SUSCRIPCIÓN MENSUAL</span>
                        <strong className="text-slate-800 font-mono text-xs font-black">
                          {plan.priceFB} FB <span className="font-sans font-normal text-[9px] text-slate-400">/ mes</span>
                        </strong>
                      </div>

                      {isSelected ? (
                        <button
                          disabled
                          className="py-1 px-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-[9.5px] font-bold flex items-center gap-0.5"
                        >
                          <span>Equipped</span>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={paymentStage === "signing" || paymentStage === "verifying"}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-[9.5px] font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-0.5 font-sans disabled:opacity-55 shrink-0"
                        >
                          <span>Pay FB</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
