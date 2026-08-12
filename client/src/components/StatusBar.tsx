import React from 'react';
import { Sliders, MessageSquare, Database, Wrench, Settings, Activity } from 'lucide-react';

interface StatusBarProps {
  online: boolean;
  model: string;
  hasApiKey: boolean;
  activeTab: 'personality' | 'conversations' | 'memory' | 'tools' | 'settings' | null;
  onToggleTab: (tab: 'personality' | 'conversations' | 'memory' | 'tools' | 'settings') => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  online,
  model,
  hasApiKey,
  activeTab,
  onToggleTab,
}) => {
  return (
    <header className="w-full bg-aura-card border-b border-aura-border px-4 py-2.5 flex items-center justify-between text-xs select-none">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-aura-cyan shadow-[0_0_8px_#00f0ff] rounded-sm" />
          <span className="font-bold text-sm tracking-widest text-aura-text">TARS</span>
          <span className="text-[10px] text-aura-muted hidden sm:inline">| RECON AI v1.0</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-aura-border bg-aura-surface text-[10px]">
          <span
            className={`w-2 h-2 rounded-full ${
              online ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
            }`}
          />
          <span className="uppercase font-semibold text-slate-300">
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 text-[10px] text-aura-muted">
          <Activity size={12} className="text-aura-cyan" />
          <span>MODEL: {model}</span>
          {!hasApiKey && <span className="text-aura-amber ml-1">(Simulation Mode)</span>}
        </div>
      </div>

      {/* Control Drawer Toggle Bar */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleTab('personality')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] ${
            activeTab === 'personality'
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan'
              : 'bg-aura-surface border-aura-border text-slate-300 hover:border-aura-borderLight'
          }`}
          title="Personality Sliders"
        >
          <Sliders size={13} />
          <span className="hidden sm:inline">PERSONALITY</span>
        </button>

        <button
          onClick={() => onToggleTab('conversations')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] ${
            activeTab === 'conversations'
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan'
              : 'bg-aura-surface border-aura-border text-slate-300 hover:border-aura-borderLight'
          }`}
          title="Mission Logs"
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">LOGS</span>
        </button>

        <button
          onClick={() => onToggleTab('memory')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] ${
            activeTab === 'memory'
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan'
              : 'bg-aura-surface border-aura-border text-slate-300 hover:border-aura-borderLight'
          }`}
          title="Memory Database"
        >
          <Database size={13} />
          <span className="hidden sm:inline">MEMORY</span>
        </button>

        <button
          onClick={() => onToggleTab('tools')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] ${
            activeTab === 'tools'
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan'
              : 'bg-aura-surface border-aura-border text-slate-300 hover:border-aura-borderLight'
          }`}
          title="Tools Engine"
        >
          <Wrench size={13} />
          <span className="hidden sm:inline">TOOLS</span>
        </button>

        <button
          onClick={() => onToggleTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] ${
            activeTab === 'settings'
              ? 'bg-aura-cyan/20 border-aura-cyan text-aura-cyan'
              : 'bg-aura-surface border-aura-border text-slate-300 hover:border-aura-borderLight'
          }`}
          title="Audio & System Settings"
        >
          <Settings size={13} />
          <span className="hidden sm:inline">SETTINGS</span>
        </button>
      </div>
    </header>
  );
};
