import React, { useEffect, useRef } from 'react';
import { Message, ToolExecutionSummary } from '../types/index';
import { User, Cpu, Wrench } from 'lucide-react';

interface LiveTranscriptProps {
  messages: Message[];
  interimTranscript: string;
  activeTool?: { name: string; args: any };
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  messages,
  interimTranscript,
  activeTool,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, interimTranscript, activeTool]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto px-4 py-3 space-y-4 max-h-[340px] cyber-panel rounded-lg"
    >
      {messages.length === 0 && !interimTranscript && (
        <div className="flex flex-col items-center justify-center h-48 text-center text-aura-muted text-xs tracking-wide">
          <p className="mb-2">/// TARS TELEMETRY STREAM INITIALIZED ///</p>
          <p>Speak naturally into your microphone or type a query below.</p>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 text-xs leading-relaxed ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`p-1.5 rounded flex items-center justify-center shrink-0 ${
                isUser
                  ? 'bg-aura-surface text-aura-cyan border border-aura-border'
                  : 'bg-aura-cyan/10 text-aura-cyan border border-aura-cyan/30'
              }`}
            >
              {isUser ? <User size={14} /> : <Cpu size={14} />}
            </div>

            <div
              className={`max-w-[80%] p-3 rounded-md border ${
                isUser
                  ? 'bg-aura-surface/80 border-aura-border text-slate-200 text-right'
                  : 'bg-aura-card/90 border-aura-border text-aura-text'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px] tracking-wider uppercase">
                <span>{isUser ? 'YOU' : 'TARS'}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Tool Execution Logs */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-aura-border/60 text-[10px] text-aura-amber space-y-1">
                  {msg.toolCalls.map((t: ToolExecutionSummary, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 font-mono">
                      <Wrench size={11} />
                      <span>Executed Tool: [{t.name}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Active Tool Execution Indicator */}
      {activeTool && (
        <div className="flex items-center gap-2 p-2 rounded bg-aura-amber/10 border border-aura-amber/30 text-aura-amber text-xs">
          <Wrench size={14} className="animate-spin" />
          <span>Executing system tool: {activeTool.name}({JSON.stringify(activeTool.args)})...</span>
        </div>
      )}

      {/* Live Interim User Speech */}
      {interimTranscript && (
        <div className="flex items-start gap-3 flex-row-reverse text-xs leading-relaxed opacity-90 animate-pulse">
          <div className="p-1.5 rounded bg-aura-surface text-aura-cyan border border-aura-border">
            <User size={14} />
          </div>
          <div className="max-w-[80%] p-3 rounded-md border border-aura-cyan/40 bg-aura-cyan/10 text-aura-cyan text-right">
            <div className="text-[10px] tracking-wider uppercase mb-1">LISTENING...</div>
            <p className="italic">"{interimTranscript}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
