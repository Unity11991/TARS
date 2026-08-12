import React, { useState } from 'react';
import { MemoryItem } from '../types/index';
import { Database, Plus, Trash2, Tag } from 'lucide-react';

interface MemoryPanelProps {
  memories: MemoryItem[];
  onAdd: (key: string, value: string, category: MemoryItem['category']) => void;
  onDelete: (id: string) => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ memories, onAdd, onDelete }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [catInput, setCatInput] = useState<MemoryItem['category']>('preference');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim() && valInput.trim()) {
      onAdd(keyInput.trim(), valInput.trim(), catInput);
      setKeyInput('');
      setValInput('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="cyber-panel p-4 rounded-lg space-y-4 text-xs h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-aura-border pb-3">
        <div className="flex items-center gap-2 text-aura-cyan font-bold tracking-wide">
          <Database size={16} />
          <span>RECALLED MEMORIES ({memories.length})</span>
        </div>
        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="flex items-center gap-1 bg-aura-cyan/20 border border-aura-cyan/50 text-aura-cyan px-2.5 py-1 rounded hover:bg-aura-cyan/30 transition-all text-[11px]"
        >
          <Plus size={12} />
          <span>STORE FACT</span>
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleAdd} className="p-3 bg-aura-surface border border-aura-cyan/40 rounded space-y-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">MEMORY TITLE / KEY</label>
            <input
              type="text"
              placeholder="e.g. Concise Answers"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded px-2 py-1 text-xs text-white focus:border-aura-cyan"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">FACT / PREFERENCE CONTENT</label>
            <input
              type="text"
              placeholder="e.g. User prefers responses under 2 sentences."
              value={valInput}
              onChange={(e) => setValInput(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded px-2 py-1 text-xs text-white focus:border-aura-cyan"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">CATEGORY</label>
            <select
              value={catInput}
              onChange={(e) => setCatInput(e.target.value as any)}
              className="w-full bg-aura-bg border border-aura-border rounded px-2 py-1 text-xs text-white focus:border-aura-cyan"
            >
              <option value="preference">User Preference</option>
              <option value="fact">System Fact</option>
              <option value="instruction">Core Instruction</option>
              <option value="general">General Memory</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2.5 py-1 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-aura-cyan text-black font-semibold px-3 py-1 rounded hover:bg-cyan-300"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Memory Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {memories.map((m) => (
          <div
            key={m.id}
            className="group p-2.5 rounded bg-aura-card/60 border border-aura-border hover:border-aura-borderLight transition-all flex flex-col justify-between gap-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-aura-cyan font-semibold">
                <Tag size={12} />
                <span>{m.key}</span>
              </div>
              <button
                onClick={() => onDelete(m.id)}
                className="opacity-0 group-hover:opacity-100 text-aura-muted hover:text-rose-400 transition-opacity"
                title="Delete memory"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{m.value}</p>
            <div className="flex items-center justify-between text-[9px] text-aura-muted pt-1">
              <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-aura-surface border border-aura-border">
                {m.category}
              </span>
              <span>{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {memories.length === 0 && (
          <div className="text-center py-6 text-aura-muted text-[11px]">No recalled memories registered.</div>
        )}
      </div>
    </div>
  );
};
