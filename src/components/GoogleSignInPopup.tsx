import React, { useState } from "react";
import { X, UserPlus, Mail, AlertTriangle, ShieldCheck } from "lucide-react";

interface GoogleSignInPopupProps {
  onClose: () => void;
  onSuccess: (email: string, name: string, avatarUrl: string) => void;
  triggerTone?: (freq: number, type: OscillatorType, duration: number) => void;
}

export default function GoogleSignInPopup({
  onClose,
  onSuccess,
  triggerTone,
}: GoogleSignInPopupProps) {
  const [selectedState, setSelectedState] = useState<"choose" | "custom" | "loading">("choose");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const playChime = (type: "click" | "success" | "error") => {
    if (!triggerTone) return;
    if (type === "click") triggerTone(350, "sine", 0.05);
    if (type === "success") {
      triggerTone(523.25, "sine", 0.08); // C5
      setTimeout(() => triggerTone(659.25, "sine", 0.10), 80); // E5
      setTimeout(() => triggerTone(783.99, "sine", 0.15), 180); // G5
    }
    if (type === "error") {
      triggerTone(220, "sawtooth", 0.15);
    }
  };

  const handleSelectAccount = (email: string, name: string) => {
    playChime("click");
    setSelectedState("loading");
    
    // Aesthetic Google simulation delay
    setTimeout(() => {
      playChime("success");
      onSuccess(email, name, `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`);
    }, 1800);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes("@")) {
      playChime("error");
      setErrorMsg("Por favor, ingresa una cuenta de correo de Google válida.");
      return;
    }
    setErrorMsg("");
    playChime("click");
    setSelectedState("loading");

    const resolvedName = customName.trim() || customEmail.split("@")[0];

    setTimeout(() => {
      playChime("success");
      onSuccess(
        customEmail.toLowerCase().trim(),
        resolvedName,
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(customEmail)}`
      );
    }, 2000);
  };

  return (
    <div id="google-auth-overlay" className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white text-slate-800 w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-slate-200 animate-scale-up tracking-normal">
        
        {/* Banner with Google Colors strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] flex" />

        {/* Modal Inner content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            {/* Elegant Google logo */}
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-sans font-bold text-slate-800 text-[14px] tracking-tight">Google Accounts</span>
            </div>
            
            {selectedState !== "loading" && (
              <button
                onClick={() => {
                  playChime("click");
                  onClose();
                }}
                className="p-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* STATE A: Choose Account */}
          {selectedState === "choose" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-sans font-bold text-base text-slate-900">Iniciar sesión con Google</h3>
                <p className="text-[11px] text-slate-500 font-sans">para continuar a <span className="font-semibold text-slate-700">Wplace Paint Panel</span></p>
              </div>

              {/* Accounts list selector */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                
                {/* 1. Specialized option matching user email in metadata! */}
                <button
                  type="button"
                  onClick={() => handleSelectAccount("osman.marin.info@gmail.com", "Osman Marín")}
                  className="w-full text-left p-3 rounded-2xl border border-slate-150 hover:border-blue-400 hover:bg-slate-50/50 flex items-center justify-between transition-all cursor-pointer group hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-105 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-[13px] uppercase group-hover:scale-105 transition-transform shrink-0">
                      OM
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans font-bold text-slate-850 text-xs truncate leading-normal">Osman Marín</p>
                      <p className="font-mono text-[9.5px] text-slate-455 truncate">osman.marin.info@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 py-0.2 shrink-0">
                    Propietario
                  </span>
                </button>

                {/* 2. Standard simulated account */}
                <button
                  type="button"
                  onClick={() => handleSelectAccount("satoshi.painter@gmail.com", "Satoshi_Artist")}
                  className="w-full text-left p-3 rounded-2xl border border-slate-150 hover:border-blue-400 hover:bg-slate-50/50 flex items-center gap-3 transition-all cursor-pointer group hover:shadow-xs"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-105 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600 text-[13px] uppercase group-hover:scale-105 transition-transform shrink-0">
                    SP
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-bold text-slate-850 text-xs truncate leading-normal">Satoshi_Artist</p>
                    <p className="font-mono text-[9.5px] text-slate-455 truncate">satoshi.painter@gmail.com</p>
                  </div>
                </button>

                {/* 3. Button to choose custom credential email */}
                <button
                  type="button"
                  onClick={() => {
                    playChime("click");
                    setSelectedState("custom");
                  }}
                  className="w-full text-left p-3 rounded-2xl border border-dashed border-slate-250 hover:border-solid hover:border-slate-350 hover:bg-slate-50 flex items-center gap-3 transition-all cursor-pointer font-sans"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-sans font-bold text-slate-700 text-xs">Usar otra cuenta</p>
                    <p className="text-[9.5px] text-slate-400">Ingresar una dirección de correo personalizada</p>
                  </div>
                </button>
              </div>

              {/* Secure Info Footnote */}
              <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-455 font-sans leading-normal flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Para continuar, Google compartirá tu nombre, correo y avatar con <strong>Wplace</strong>. Conexión segura sandbox.
                </span>
              </div>
            </div>
          )}

          {/* STATE B: Custom email form entry */}
          {selectedState === "custom" && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-sm text-slate-800">Usa tu cuenta de Google</h3>
                <p className="text-[10px] text-slate-500 font-sans">Registra tu correo para guardar tu progreso de pintura de forma permanente.</p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-150 rounded-xl text-[10px] text-red-700 flex items-start gap-1.5 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Correo Electrónico (Google Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="nombre@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 pl-9 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Nombre Completo / Apodo (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder="ej. Alan Turing"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playChime("click");
                    setSelectedState("choose");
                    setErrorMsg("");
                  }}
                  className="w-1/3 py-2 border border-slate-200 hover:border-slate-350 rounded-xl text-slate-600 font-bold text-xs cursor-pointer transition-all active:scale-95 text-center block"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition-all active:scale-98 text-center block"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}

          {/* STATE C: Loading Sign-In status */}
          {selectedState === "loading" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
              {/* Google stylized material spinner */}
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#4285F4] border-r-[#34A853] border-b-[#FBBC05] border-l-[#EA4335] animate-spin" />
              </div>
              
              <div className="space-y-1 animate-pulse">
                <p className="font-sans font-bold text-sm text-slate-800">Conectando con Google...</p>
                <p className="text-[10px] text-slate-400">Verificando credenciales de pintura seguras</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer info line */}
        <div className="bg-slate-50 border-t border-slate-150 p-3.5 px-6 text-[9px] text-slate-400 font-mono flex items-center justify-between">
          <span>Google One-Tap Integration</span>
          <span>Wplace Ledger</span>
        </div>
        
      </div>
    </div>
  );
}
