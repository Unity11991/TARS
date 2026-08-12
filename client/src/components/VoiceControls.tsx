import React from 'react';
import { AgentState } from '../types/index';
import { Mic, MicOff, Square, Radio } from 'lucide-react';

interface VoiceControlsProps {
  state: AgentState;
  isMuted: boolean;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  isMuted,
  onToggleMic,
  onToggleMute,
  onInterrupt,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';

  return (
    <div className="flex flex-col items-center justify-center gap-3 my-3 w-full">
      {/* Primary Voice Action Bar */}
      <div className="flex items-center gap-4">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`p-3 rounded-full border transition-all ${
            isMuted
              ? 'bg-aura-rose/20 border-aura-rose text-aura-rose'
              : 'bg-aura-surface border-aura-border text-slate-400 hover:text-white hover:border-aura-borderLight'
          }`}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Primary Mic Button */}
        <button
          onClick={onToggleMic}
          disabled={isMuted}
          className={`relative p-5 rounded-full border transition-all duration-300 flex items-center justify-center ${
            isListening
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan shadow-[0_0_25px_rgba(0,240,255,0.4)] scale-105'
              : isSpeaking
              ? 'bg-aura-surface border-aura-cyan/40 text-aura-cyan'
              : 'bg-aura-card border-aura-border text-slate-300 hover:border-aura-cyan hover:text-aura-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          }`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full border border-aura-cyan animate-ping opacity-50" />
          )}
          <Radio size={24} className={isListening ? 'animate-pulse' : ''} />
        </button>

        {/* Interrupt / Stop Button */}
        <button
          onClick={onInterrupt}
          disabled={state === 'idle'}
          title="Interrupt TARS (ESC)"
          className={`p-3 rounded-full border transition-all ${
            isSpeaking || isProcessing
              ? 'bg-aura-amber/20 border-aura-amber text-aura-amber animate-pulse hover:bg-aura-amber/30'
              : 'bg-aura-surface border-aura-border text-slate-500 opacity-50 cursor-not-allowed'
          }`}
        >
          <Square size={18} />
        </button>
      </div>

      {/* State Status Banner */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
        <span
          className={`w-2 h-2 rounded-full ${
            isListening
              ? 'bg-aura-cyan shadow-[0_0_8px_#00f0ff] animate-ping'
              : isSpeaking
              ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
              : isProcessing
              ? 'bg-aura-amber shadow-[0_0_8px_#f59e0b] animate-spin'
              : 'bg-slate-600'
          }`}
        />
        <span>STATUS: {state}</span>
      </div>

      {/* Keyboard Shortcuts Prompt */}
      <div className="flex items-center gap-4 text-[10px] text-aura-muted">
        <span><kbd className="px-1.5 py-0.5 bg-aura-surface border border-aura-border rounded text-slate-300 font-mono">SPACE</kbd> Push to talk</span>
        <span>•</span>
        <span><kbd className="px-1.5 py-0.5 bg-aura-surface border border-aura-border rounded text-slate-300 font-mono">ESC</kbd> Interrupt speech</span>
      </div>
    </div>
  );
};
