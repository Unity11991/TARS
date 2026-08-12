import React, { useState } from 'react';
import { Mic, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FirstLaunchModalProps {
  onEnableMic: () => Promise<boolean>;
  onComplete: () => void;
}

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({
  onEnableMic,
  onComplete,
}) => {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    const ok = await onEnableMic();
    setLoading(false);
    if (ok) {
      setGranted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="cyber-panel max-w-md w-full p-6 rounded-lg space-y-6 text-center shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        <div className="space-y-2">
          <div className="inline-block p-3 rounded-full bg-aura-cyan/10 border border-aura-cyan/30 text-aura-cyan mb-2">
            <Mic size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-aura-text">TARS</h1>
          <p className="text-xs text-aura-cyan tracking-wider uppercase font-semibold">
            "An intelligence for exploration."
          </p>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-aura-surface/60 border border-aura-border p-4 rounded text-left space-y-2">
          <p>
            Welcome to <strong>TARS</strong> — a futuristic real-time AI voice assistant engineered for natural spoken interaction, streaming speech synthesis, instant barge-in interruption, and 7-axis personality customization.
          </p>
          <div className="flex items-center gap-2 text-aura-muted text-[11px] pt-1">
            <ShieldCheck size={14} className="text-aura-cyan shrink-0" />
            <span>Microphone access is processed locally for voice activity detection and browser STT.</span>
          </div>
        </div>

        {!granted ? (
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-aura-cyan text-black font-bold py-3 rounded-md hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 text-xs tracking-wider uppercase"
            >
              <Mic size={16} />
              <span>{loading ? 'INITIALIZING MICROPHONE...' : 'ENABLE MICROPHONE'}</span>
            </button>
            <p className="text-[10px] text-aura-muted">
              Microphone permission is required for real-time voice conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold py-1">
              <CheckCircle2 size={16} />
              <span>SYSTEMS OPERATIONAL</span>
            </div>
            <button
              onClick={onComplete}
              className="w-full bg-aura-cyan text-black font-bold py-3 rounded-md hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xs tracking-wider uppercase"
            >
              START MISSION CONVERSATION
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
