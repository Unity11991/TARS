import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface FirstLaunchModalProps {
  onEnableMic: () => Promise<boolean>;
  onComplete: (useVoice: boolean) => void;
}

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({
  onEnableMic,
  onComplete,
}) => {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // Check if the current context is secure (HTTPS or localhost)
    const secure =
      window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    setIsSecure(secure);
    if (!secure) {
      setErrorMsg('HTTPS Connection Required for Voice Recognition. Browsers block microphone access over plain HTTP.');
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const ok = await onEnableMic();
      setLoading(false);
      if (ok) {
        setGranted(true);
      } else {
        setErrorMsg('Microphone access could not be initialized or permission was denied. You can continue with Text Mode.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Microphone error occurred. You can continue with Text Mode.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="reticle-panel max-w-md w-full p-6 rounded-sm space-y-5 text-center bg-[#080B10] border border-[#26313D] shadow-[0_0_50px_rgba(0,217,255,0.15)] font-mono">
        <div className="space-y-1.5">
          <div className="inline-block p-3 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] mb-1">
            <Mic size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.3em] text-[#E6EDF3]">T A R S</h1>
          <p className="text-[11px] text-[#00D9FF] tracking-widest uppercase font-semibold">
            "AN INTELLIGENCE FOR EXPLORATION."
          </p>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-[#0B0F15] border border-[#26313D] p-3.5 rounded-xs text-left space-y-2">
          <p className="text-[11px] text-[#7E8B98]">
            Welcome to <strong>TARS</strong> — a futuristic AI voice agent engineered for real-time natural speech interaction, streaming synthesis, instant barge-in, and 7-axis personality customization.
          </p>
          <div className="flex items-center gap-2 text-[#7E8B98] text-[10px] pt-1">
            <ShieldCheck size={14} className="text-[#00D9FF] shrink-0" />
            <span>Microphone access is processed locally for browser voice detection.</span>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 bg-[#1C0F12] border border-[#FF5C5C]/40 p-3 rounded-xs text-left text-[11px] text-[#FF5C5C]">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!granted ? (
          <div className="space-y-2.5">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#00D9FF] text-black font-bold py-2.5 rounded-xs hover:bg-[#7FA9C7] transition-all shadow-[0_0_20px_rgba(0,217,255,0.4)] disabled:opacity-50 text-xs tracking-wider uppercase cursor-pointer"
            >
              <Mic size={15} />
              <span>{loading ? 'INITIALIZING MICROPHONE...' : 'ENABLE MICROPHONE'}</span>
            </button>

            <button
              onClick={() => onComplete(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#0B0F15] border border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3] font-semibold py-2 rounded-xs transition-all text-[11px] tracking-wider uppercase cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>CONTINUE WITH TEXT INPUT ONLY</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold py-1">
              <CheckCircle2 size={16} />
              <span>SYSTEMS OPERATIONAL</span>
            </div>
            <button
              onClick={() => onComplete(true)}
              className="w-full bg-[#00D9FF] text-black font-bold py-2.5 rounded-xs hover:bg-[#7FA9C7] transition-all shadow-[0_0_20px_rgba(0,217,255,0.4)] text-xs tracking-wider uppercase cursor-pointer"
            >
              START MISSION CONVERSATION
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
