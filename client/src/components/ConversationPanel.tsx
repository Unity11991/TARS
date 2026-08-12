import React, { useState } from 'react';
import { Conversation } from '../types/index';
import { MessageSquare, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';

interface ConversationPanelProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="cyber-panel p-4 rounded-lg space-y-4 text-xs h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-aura-border pb-3">
        <div className="flex items-center gap-2 text-aura-cyan font-bold tracking-wide">
          <MessageSquare size={16} />
          <span>MISSION LOGS</span>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1 bg-aura-cyan/20 border border-aura-cyan/50 text-aura-cyan px-2.5 py-1 rounded hover:bg-aura-cyan/30 transition-all text-[11px]"
        >
          <Plus size={12} />
          <span>NEW MISSION</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-2.5 text-aura-muted" />
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-aura-surface border border-aura-border rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-aura-cyan"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          const isEditing = c.id === editingId;

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex items-center justify-between p-2.5 rounded cursor-pointer border transition-all ${
                isActive
                  ? 'bg-aura-surface border-aura-cyan text-aura-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'bg-aura-card/60 border-aura-border text-slate-300 hover:border-aura-borderLight hover:bg-aura-surface/40'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 bg-aura-bg border border-aura-cyan px-2 py-1 text-xs text-white rounded focus:outline-none"
                    autoFocus
                  />
                  <button onClick={(e) => saveEdit(c.id, e)} className="text-emerald-400 p-1">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-rose-400 p-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-semibold">{c.title}</span>
                    <span className="text-[10px] text-aura-muted">
                      {new Date(c.updatedAt).toLocaleDateString()} • {c.messages.length} msgs
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => startEdit(c, e)}
                      className="p-1 hover:text-aura-cyan transition-colors"
                      title="Rename mission log"
                    >
                      <Edit2 size={13} />
                    </button>
                    {conversations.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c.id);
                        }}
                        className="p-1 hover:text-rose-400 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-6 text-aura-muted text-[11px]">No mission logs found.</div>
        )}
      </div>
    </div>
  );
};
