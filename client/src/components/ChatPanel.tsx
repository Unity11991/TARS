import React, { useEffect, useRef, useState } from 'react';
import { Message, AgentState } from '../types/index';
import { Wrench, Send, Mic, ArrowDown } from 'lucide-react';
import { SoundEngine } from '../features/audio/SoundEngine';

interface ChatPanelProps {
  messages: Message[];
  interimTranscript: string;
  activeTool?: { name: string; args: any };
  textInput: string;
  onTextInputChange: (val: string) => void;
  onTextSubmit: (e: React.FormEvent) => void;
  onClearHistory?: () => void;
  onToggleMic?: () => void;
  onSelectPrompt?: (prompt: string) => void;
  agentState: AgentState;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  interimTranscript,
  activeTool,
  textInput,
  onTextInputChange,
  onTextSubmit,
  onClearHistory,
  onToggleMic,
  agentState,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, interimTranscript, activeTool]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setShowScrollBottom(!isAtBottom);
  };

  return (
    <div className="reticle-panel rounded-sm flex flex-col w-full h-[300px] sm:h-[340px] lg:h-full lg:max-h-[380px] bg-[#080B10] border border-[#26313D] shadow-2xl overflow-hidden text-xs font-mono select-none">
      
      {/* Scrollable Messages Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto p-3 space-y-3 relative min-h-0"
      >
        {messages.length === 0 && !interimTranscript && (
          <div className="flex flex-col items-center justify-center h-32 text-center text-[#7E8B98] space-y-1 select-none">
            <p className="text-[10px] font-bold text-[#E6EDF3] tracking-widest uppercase">
              /// SYSTEM LOGS INITIALIZED ///
            </p>
            <p className="text-[10px] text-[#7E8B98]">
              Awaiting user directive or voice interaction.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div
              key={msg.id}
              className="bg-[#0B0F15] border border-[#26313D] p-3 rounded-sm space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] tracking-widest text-[#7E8B98] font-mono">
                <span className={isUser ? 'text-[#7FA9C7] font-bold' : 'text-[#39D98A] font-bold'}>
                  {isUser ? 'YOU' : 'TARS'}
                </span>
                <span>{timeStr}</span>
              </div>

              <p className="text-[#E6EDF3] whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                {msg.content}
              </p>

              {/* Tool Execution Tags */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="pt-1.5 border-t border-[#26313D] text-[10px] text-[#F2B84B] space-y-1 font-mono">
                  {msg.toolCalls.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Wrench size={10} />
                      <span>EXECUTED TOOL: [{t.name}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Active Tool Execution Indicator */}
        {activeTool && (
          <div className="flex items-center gap-2 p-2 rounded-sm bg-[#0B0F15] border border-[#F2B84B]/40 text-[#F2B84B] text-xs font-mono">
            <Wrench size={12} className="animate-spin shrink-0" />
            <span>Executing system tool: {activeTool.name}...</span>
          </div>
        )}

        {/* Live Interim User Speech */}
        {interimTranscript && (
          <div className="bg-[#0B0F15] border border-[#00D9FF]/40 p-3 rounded-sm space-y-1 animate-pulse">
            <div className="flex items-center justify-between text-[10px] tracking-widest text-[#00D9FF] font-mono">
              <span>YOU (LISTENING...)</span>
            </div>
            <p className="text-[#00D9FF] italic font-mono text-[11px]">
              "{interimTranscript}"
            </p>
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Jump Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-14 right-4 z-20 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#00D9FF] text-black font-bold text-[9px] shadow-lg hover:bg-white transition-all font-mono"
        >
          <ArrowDown size={10} />
          <span>LATEST</span>
        </button>
      )}

      {/* Technical Message Input Form */}
      <form
        onSubmit={(e) => {
          SoundEngine.getInstance().playBeepSound();
          onTextSubmit(e);
        }}
        className="flex items-center gap-1.5 p-2 bg-[#05070A] border-t border-[#26313D] shrink-0"
      >
        <input
          type="text"
          placeholder="TYPE YOUR MESSAGE..."
          value={textInput}
          onChange={(e) => onTextInputChange(e.target.value)}
          className="flex-1 bg-[#0B0F15] border border-[#26313D] rounded-sm px-3 py-1.5 text-xs text-[#E6EDF3] placeholder:text-[#7E8B98] focus:outline-none focus:border-[#7FA9C7] font-mono tracking-wider transition-all"
        />

        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2 rounded-sm border transition-all ${
              agentState === 'listening'
                ? 'bg-[#39D98A]/20 border-[#39D98A] text-[#39D98A]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:text-[#E6EDF3] hover:border-[#7FA9C7]'
            }`}
            title="Toggle Microphone"
          >
            <Mic size={14} />
          </button>
        )}

        <button
          type="submit"
          disabled={!textInput.trim()}
          className="px-3 py-2 rounded-sm bg-[#0B0F15] border border-[#26313D] text-[#E6EDF3] hover:border-[#00D9FF] hover:text-[#00D9FF] transition-all disabled:opacity-30 disabled:hover:border-[#26313D] disabled:hover:text-[#E6EDF3] shrink-0"
          title="Send Directive"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
