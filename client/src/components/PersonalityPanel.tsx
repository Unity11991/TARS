import React from 'react';
import { PersonalityConfig } from '../types/index';
import { Sliders, RotateCcw } from 'lucide-react';

interface PersonalityPanelProps {
  personality: PersonalityConfig;
  onChange: (updated: PersonalityConfig) => void;
  onReset: () => void;
}

export const PersonalityPanel: React.FC<PersonalityPanelProps> = ({
  personality,
  onChange,
  onReset,
}) => {
  const fields: Array<{ key: keyof PersonalityConfig; label: string; desc: string }> = [
    { key: 'humor', label: 'HUMOR', desc: 'Dry observations & witty situational remarks' },
    { key: 'honesty', label: 'HONESTY', desc: 'Brutally direct vs soft diplomacy' },
    { key: 'confidence', label: 'CONFIDENCE', desc: 'Certitude vs cautious qualification' },
    { key: 'formality', label: 'FORMALITY', desc: 'Academic precision vs casual cadence' },
    { key: 'sarcasm', label: 'SARCASM', desc: 'Deadpan ironic commentary' },
    { key: 'empathy', label: 'EMPATHY', desc: 'Supportive validation vs mechanical logic' },
    { key: 'verbosity', label: 'VERBOSITY', desc: 'Pithy concise sentences vs detailed context' },
  ];

  const handleSliderChange = (key: keyof PersonalityConfig, value: number) => {
    onChange({
      ...personality,
      [key]: value,
    });
  };

  return (
    <div className="cyber-panel p-4 rounded-lg space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-aura-border pb-3">
        <div className="flex items-center gap-2 text-aura-cyan font-bold tracking-wide">
          <Sliders size={16} />
          <span>PERSONALITY PARAMETERS (7-AXIS)</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] text-aura-muted hover:text-aura-cyan transition-colors"
          title="Reset to default exploration profile"
        >
          <RotateCcw size={12} />
          <span>RESET DEFAULT</span>
        </button>
      </div>

      <div className="space-y-3">
        {fields.map(({ key, label, desc }) => {
          const val = personality[key];
          return (
            <div key={String(key)} className="space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">{label}</span>
                <span className="font-mono text-aura-cyan font-bold">{val}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={val}
                onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-aura-muted">{desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
