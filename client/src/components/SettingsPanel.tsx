import React, { useEffect, useState } from 'react';
import { VoiceConfig } from '../types/index';
import { Settings, Volume2, Mic, Sliders, Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  config: VoiceConfig;
  onChange: (updated: Partial<VoiceConfig>) => void;
  onClearHistory: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onChange,
  onClearHistory,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return (
    <div className="cyber-panel p-4 rounded-lg space-y-4 text-xs h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-aura-border pb-3">
        <div className="flex items-center gap-2 text-aura-cyan font-bold tracking-wide">
          <Settings size={16} />
          <span>AUDIO & VOICE CONFIGURATION</span>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Volume2 size={14} className="text-aura-cyan" />
          <span>SPEECH SYNTHESIS VOICE</span>
        </label>
        <select
          value={config.voiceURI}
          onChange={(e) => onChange({ voiceURI: e.target.value })}
          className="w-full bg-aura-surface border border-aura-border rounded px-2.5 py-1.5 text-xs text-white focus:border-aura-cyan"
        >
          <option value="">Default System Voice</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Speech Rate */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-slate-300">
          <span>SPEECH RATE</span>
          <span className="font-mono text-aura-cyan">{config.rate}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={config.rate}
          onChange={(e) => onChange({ rate: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Speech Pitch */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-slate-300">
          <span>PITCH MODULATION</span>
          <span className="font-mono text-aura-cyan">{config.pitch}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={config.pitch}
          onChange={(e) => onChange({ pitch: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Speech Volume */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-slate-300">
          <span>OUTPUT VOLUME</span>
          <span className="font-mono text-aura-cyan">{Math.round(config.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1.0}
          step={0.05}
          value={config.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Mic Sensitivity / Barge-in Threshold */}
      <div className="space-y-1 border-t border-aura-border pt-3">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1">
            <Mic size={14} className="text-aura-cyan" />
            <span>BARGE-IN MIC SENSITIVITY</span>
          </span>
          <span className="font-mono text-aura-cyan">{config.micSensitivity}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={90}
          value={config.micSensitivity}
          onChange={(e) => onChange({ micSensitivity: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-[10px] text-aura-muted">
          Threshold volume required to interrupt AURA speech synthesis.
        </p>
      </div>

      {/* Text Chat Fallback Mode Toggle */}
      <div className="flex items-center justify-between border-t border-aura-border pt-3">
        <div>
          <span className="font-semibold block text-slate-200">FALLBACK TEXT MODE</span>
          <span className="text-[10px] text-aura-muted">Enable text input box alongside mic</span>
        </div>
        <input
          type="checkbox"
          checked={config.fallbackTextMode}
          onChange={(e) => onChange({ fallbackTextMode: e.target.checked })}
          className="w-4 h-4 accent-aura-cyan cursor-pointer"
        />
      </div>

      {/* Clear History Trigger */}
      <div className="border-t border-aura-border pt-3">
        <button
          onClick={onClearHistory}
          className="w-full flex items-center justify-center gap-2 bg-rose-950/40 border border-rose-800 text-rose-300 py-2 rounded hover:bg-rose-900/50 transition-colors"
        >
          <Trash2 size={14} />
          <span>CLEAR CURRENT MISSION LOG</span>
        </button>
      </div>
    </div>
  );
};
