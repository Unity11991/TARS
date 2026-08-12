import React, { useEffect, useState, useRef } from 'react';
import {
  AgentState,
  Conversation,
  Message,
  MemoryItem,
  PersonalityConfig,
  VoiceConfig,
  DEFAULT_PERSONALITY,
  DEFAULT_VOICE_CONFIG,
} from '../types/index';
import { VoiceEngine } from '../features/voice/VoiceEngine';
import {
  fetchHealth,
  fetchConversations,
  createConversation as apiCreateConv,
  renameConversation as apiRenameConv,
  deleteConversation as apiDeleteConv,
  fetchMemories,
  addMemory as apiAddMemory,
  deleteMemory as apiDeleteMemory,
  streamChatResponse,
} from '../services/api';
import { SoundEngine } from '../features/audio/SoundEngine';
import { AgentVisualizer } from './AgentVisualizer';
import { ChatPanel } from './ChatPanel';
import { PersonalityPanel } from './PersonalityPanel';
import { ConversationPanel } from './ConversationPanel';
import { MemoryPanel } from './MemoryPanel';
import { ToolPanel } from './ToolPanel';
import { SettingsPanel } from './SettingsPanel';
import { FirstLaunchModal } from './FirstLaunchModal';
import { Sliders, MessageSquare, Database, Wrench, Settings, Square, Radio, Volume2, VolumeX } from 'lucide-react';

interface SystemLogEntry {
  time: string;
  text: string;
}

export const AgentCore: React.FC = () => {
  const [showFirstLaunch, setShowFirstLaunch] = useState(true);
  const [online, setOnline] = useState(true);
  const [modelName, setModelName] = useState('llama-3.1-8b-instant');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [micAmplitude, setMicAmplitude] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [personality, setPersonality] = useState<PersonalityConfig>(DEFAULT_PERSONALITY);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-default');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeTool, setActiveTool] = useState<{ name: string; args: any } | undefined>();

  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<
    'personality' | 'conversations' | 'memory' | 'tools' | 'settings' | null
  >(null);

  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([
    { time: '15:02:11', text: 'SYSTEM BOOT' },
    { time: '15:02:12', text: 'POWER CORE ONLINE' },
    { time: '15:02:14', text: 'SENSORS ONLINE' },
    { time: '15:02:16', text: 'NETWORK STABLE' },
    { time: '15:02:18', text: 'VOICE SYSTEM ONLINE' },
    { time: '15:02:20', text: 'ALL SYSTEMS NOMINAL' },
  ]);

  const voiceEngineRef = useRef<VoiceEngine | null>(null);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs((prev) => [...prev.slice(-12), { time, text }]);
  };

  // Clock Loop
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Backend Data & Voice Engine
  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setOnline(true);
        setModelName(h.model);
        setHasApiKey(h.hasApiKey);
        addLog(`CONNECTED TO BACKEND MODEL [${h.model}]`);
      })
      .catch(() => {
        setOnline(false);
        addLog('BACKEND OFFLINE - RUNNING SIMULATION');
      });

    fetchConversations().then((cs) => {
      setConversations(cs);
      if (cs.length > 0) setActiveConvId(cs[0].id);
    });

    fetchMemories().then(setMemories);

    // Instantiate Voice Engine
    const engine = new VoiceEngine({
      onStateChange: (st) => {
        setAgentState(st);
        if (st === 'listening') {
          addLog('STATE: LISTENING');
          SoundEngine.getInstance().playChirpSound();
        } else if (st === 'speaking') {
          addLog('STATE: SPEAKING');
          SoundEngine.getInstance().playMessageSound();
        } else if (st === 'processing') {
          addLog('STATE: PROCESSING');
          SoundEngine.getInstance().playProcessingHum();
        } else if (st === 'error') {
          SoundEngine.getInstance().playErrorSound();
        }
      },
      onInterimTranscript: (txt) => setInterimTranscript(txt),
      onFinalTranscript: (txt) => handleUserSubmission(txt),
      onMicAmplitude: (amp) => setMicAmplitude(amp),
      onError: (err) => {
        console.warn('[Voice Engine Notice]', err);
        addLog(`VOICE ENGINE: ${err}`);
      },
    });

    voiceEngineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  // Sync Voice Config changes to VoiceEngine
  useEffect(() => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.updateConfig(voiceConfig);
    }
  }, [voiceConfig]);

  // Keyboard Shortcuts (SPACE to toggle mic, ESC to interrupt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (voiceEngineRef.current) {
          if (agentState === 'listening') {
            voiceEngineRef.current.stopListening();
          } else {
            voiceEngineRef.current.startListening();
          }
        }
      } else if (e.code === 'Escape') {
        if (voiceEngineRef.current) {
          voiceEngineRef.current.interrupt();
          addLog('COMMUNICATION INTERRUPTED');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agentState]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv ? activeConv.messages : [];
  const latestMessage = messages.length > 0 ? messages[messages.length - 1].content : undefined;

  // Main LLM Streaming Handler
  const handleUserSubmission = async (userText: string) => {
    if (!userText.trim()) return;

    setInterimTranscript('');
    setAgentState('processing');
    addLog(`USER DIRECTIVE: "${userText.slice(0, 24)}${userText.length > 24 ? '...' : ''}"`);

    const newMsg: Message = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    const assistantMsgId = `msg-a-${Date.now()}`;
    let accumulatedContent = '';

    try {
      if (voiceEngineRef.current) {
        voiceEngineRef.current.setStreaming(true);
      }

      await streamChatResponse({
        conversationId: activeConvId,
        userContent: userText,
        personality,
        history: messages,
        onEvent: (evt) => {
          if (evt.type === 'token' && evt.content) {
            accumulatedContent += evt.content;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeConvId) {
                  const existingMsgs = c.messages.filter((m: Message) => m.id !== assistantMsgId);
                  return {
                    ...c,
                    messages: [
                      ...existingMsgs,
                      {
                        id: assistantMsgId,
                        role: 'assistant',
                        content: accumulatedContent,
                        timestamp: Date.now(),
                      },
                    ],
                  };
                }
                return c;
              })
            );
          } else if (evt.type === 'sentence' && evt.content) {
            if (voiceEngineRef.current) {
              voiceEngineRef.current.enqueueSentence(evt.content);
            }
          } else if (evt.type === 'tool_start') {
            setActiveTool({ name: evt.toolName || 'tool', args: evt.toolArgs });
            addLog(`EXECUTING TOOL: ${evt.toolName}`);
          } else if (evt.type === 'tool_end') {
            setActiveTool(undefined);
            addLog(`TOOL COMPLETE: ${evt.toolName}`);
          } else if (evt.type === 'done' || evt.type === 'error') {
            if (voiceEngineRef.current) {
              voiceEngineRef.current.setStreaming(false);
            }
          }
        },
      });
      if (voiceEngineRef.current) {
        voiceEngineRef.current.setStreaming(false);
      }
    } catch (err: any) {
      console.error('[Chat Error]', err);
      if (voiceEngineRef.current) {
        voiceEngineRef.current.setStreaming(false);
      }
      setAgentState('error');
      addLog(`SYSTEM FAULT: ${err.message || 'LLM REQUEST FAILED'}`);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserSubmission(textInput.trim());
      setTextInput('');
    }
  };

  const handleEndCommunication = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.interrupt();
      voiceEngineRef.current.stopListening();
    }
    setAgentState('idle');
    addLog('SESSION TERMINATED - IDLE');
  };

  // Conversation Actions
  const handleNewConversation = async () => {
    const newC = await apiCreateConv('New Exploration Log');
    setConversations((prev) => [newC, ...prev]);
    setActiveConvId(newC.id);
    addLog('NEW MISSION LOG CREATED');
  };

  const handleRenameConv = async (id: string, title: string) => {
    const updated = await apiRenameConv(id, title);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleDeleteConv = async (id: string) => {
    await apiDeleteConv(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id && conversations.length > 1) {
      setActiveConvId(conversations.find((c) => c.id !== id)!.id);
    }
  };

  // Memory Actions
  const handleAddMemory = async (key: string, value: string, category: MemoryItem['category']) => {
    const item = await apiAddMemory(key, value, category);
    setMemories((prev: MemoryItem[]) => [...prev, item]);
    addLog(`MEMORY UPDATED: [${key}]`);
  };

  const handleDeleteMemory = async (id: string) => {
    await apiDeleteMemory(id);
    setMemories((prev: MemoryItem[]) => prev.filter((m: MemoryItem) => m.id !== id));
  };

  const toggleAudioMute = () => {
    const muted = SoundEngine.getInstance().toggleMute();
    setIsAudioMuted(muted);
    addLog(`AUDIO EFFECTS: ${muted ? 'MUTED' : 'ACTIVE'}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen scifi-grid-bg crt-vignette text-[#E6EDF3] font-mono overflow-hidden select-none relative">
      {showFirstLaunch && (
        <FirstLaunchModal
          onEnableMic={async () => {
            SoundEngine.getInstance().playBootSound();
            if (voiceEngineRef.current) {
              return await voiceEngineRef.current.initMicrophone();
            }
            return false;
          }}
          onComplete={() => {
            setShowFirstLaunch(false);
            SoundEngine.getInstance().playBootSound();
            if (voiceEngineRef.current) {
              voiceEngineRef.current.startListening();
            }
          }}
        />
      )}

      {/* TOP NAVIGATION HEADER */}
      <header className="w-full bg-[#080B10]/90 backdrop-blur-xs border-b border-[#26313D] px-5 py-2.5 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#00D9FF] shadow-[0_0_8px_#00D9FF] rounded-xs" />
          <span className="font-bold text-sm tracking-[0.3em] text-[#E6EDF3]">TARS</span>
          <span className="text-[10px] text-[#7E8B98] tracking-widest hidden sm:inline">
            | INTERSTELLAR AI ASSISTANT
          </span>
        </div>

        {/* Technical Drawer Buttons & Sound Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={toggleAudioMute}
            className={`p-1.5 rounded-xs border text-[10px] font-mono transition-all ${
              isAudioMuted
                ? 'bg-[#150B0F] border-[#FF5C5C]/50 text-[#FF5C5C]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#00D9FF] hover:border-[#00D9FF]'
            }`}
            title={isAudioMuted ? 'Unmute Sci-Fi UI Audio' : 'Mute Sci-Fi UI Audio'}
          >
            {isAudioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            onClick={() => {
              SoundEngine.getInstance().playBeepSound();
              setActiveTab(activeTab === 'personality' ? null : 'personality');
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border text-[10px] font-mono tracking-wider transition-all ${
              activeTab === 'personality'
                ? 'bg-[#111724] border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3]'
            }`}
            title="Personality Configuration"
          >
            <Sliders size={12} />
            <span className="hidden md:inline">PERSONALITY</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.getInstance().playBeepSound();
              setActiveTab(activeTab === 'memory' ? null : 'memory');
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border text-[10px] font-mono tracking-wider transition-all ${
              activeTab === 'memory'
                ? 'bg-[#111724] border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3]'
            }`}
            title="Long-Term Memory"
          >
            <Database size={12} />
            <span className="hidden md:inline">MEMORY</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.getInstance().playBeepSound();
              setActiveTab(activeTab === 'tools' ? null : 'tools');
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border text-[10px] font-mono tracking-wider transition-all ${
              activeTab === 'tools'
                ? 'bg-[#111724] border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3]'
            }`}
            title="Autonomous Capabilities & Tools"
          >
            <Wrench size={12} />
            <span className="hidden md:inline">TOOLS</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.getInstance().playBeepSound();
              setActiveTab(activeTab === 'conversations' ? null : 'conversations');
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border text-[10px] font-mono tracking-wider transition-all ${
              activeTab === 'conversations'
                ? 'bg-[#111724] border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3]'
            }`}
            title="Mission Exploration Logs"
          >
            <MessageSquare size={12} />
            <span className="hidden md:inline">MISSION LOGS</span>
          </button>

          <button
            onClick={() => {
              SoundEngine.getInstance().playBeepSound();
              setActiveTab(activeTab === 'settings' ? null : 'settings');
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border text-[10px] font-mono tracking-wider transition-all ${
              activeTab === 'settings'
                ? 'bg-[#111724] border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#0B0F15] border-[#26313D] text-[#7E8B98] hover:border-[#7FA9C7] hover:text-[#E6EDF3]'
            }`}
            title="System Settings"
          >
            <Settings size={12} />
            <span className="hidden md:inline">SETTINGS</span>
          </button>
        </div>
      </header>

      {/* MAIN COCKPIT SPACECRAFT LAYOUT (3-COLUMN TELEMETRY GRID WITH RESPONSIVE STACKING) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-3 sm:p-5 gap-4 lg:gap-5 max-w-[1600px] w-full mx-auto">
        
        {/* CENTER COLUMN: Central Monolith Visualizer & Chat Panel (PRIORITIZED FIRST ON MOBILE) */}
        <div className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-start lg:justify-between min-w-0 space-y-2.5 sm:space-y-3 w-full">
          
          {/* Central TARS Monolith AI Module */}
          <AgentVisualizer
            state={agentState}
            micAmplitude={micAmplitude}
            latestText={latestMessage || interimTranscript}
          />

          {/* Conversation Stream & Message Input */}
          <div className="w-full flex-1 h-[300px] sm:h-auto shrink-0">
            <ChatPanel
              messages={messages}
              interimTranscript={interimTranscript}
              activeTool={activeTool}
              textInput={textInput}
              onTextInputChange={setTextInput}
              onTextSubmit={handleTextSubmit}
              onClearHistory={() => handleDeleteConv(activeConvId)}
              onToggleMic={() => {
                if (voiceEngineRef.current) {
                  if (agentState === 'listening') voiceEngineRef.current.stopListening();
                  else voiceEngineRef.current.startListening();
                }
              }}
              agentState={agentState}
            />
          </div>
        </div>

        {/* LEFT COLUMN: System Status, Capabilities, Directives, Listening Control */}
        <div className="order-2 lg:order-1 w-full lg:w-72 shrink-0 flex flex-col justify-between space-y-4 text-xs text-[#7E8B98]">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:flex lg:flex-col gap-3 lg:space-y-4 flex-1 min-h-0">
            
            {/* SYSTEM STATUS PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2.5">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                SYSTEM STATUS
              </h2>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span>POWER CORE</span>
                    <span className="text-[#E6EDF3] font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#0B0F15] h-1.5 rounded-xs overflow-hidden border border-[#26313D]">
                    <div className="bg-[#7FA9C7] h-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span>MOBILITY</span>
                    <span className="text-[#E6EDF3] font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#0B0F15] h-1.5 rounded-xs overflow-hidden border border-[#26313D]">
                    <div className="bg-[#7FA9C7] h-full w-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>NETWORK</span>
                  <span className="text-[#39D98A] font-bold">STABLE</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>SENSORS</span>
                  <span className="text-[#39D98A] font-bold">ONLINE</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>VISUAL SYSTEMS</span>
                  <span className="text-[#39D98A] font-bold">ONLINE</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>AUDIO SYSTEMS</span>
                  <span className="text-[#39D98A] font-bold">ONLINE</span>
                </div>
              </div>
            </div>

            {/* CAPABILITIES PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                CAPABILITIES
              </h2>

              <ul className="space-y-1.5 text-[10px] text-[#7E8B98] font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>SPACE NAVIGATION</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>DATA ANALYSIS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>PROBLEM SOLVING</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>LOGIC COMPUTATION</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>SYSTEM DIAGNOSTICS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#7FA9C7] bg-[#7FA9C7]/20" />
                  <span>VOICE INTERACTION</span>
                </li>
              </ul>
            </div>

            {/* CORE DIRECTIVES PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                CORE DIRECTIVES
              </h2>

              <ul className="space-y-1.5 text-[10px] text-[#7E8B98] font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-[#7FA9C7] font-bold">01</span>
                  <span>ENSURE MISSION SUCCESS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#7FA9C7] font-bold">02</span>
                  <span>PROTECT CREW</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#7FA9C7] font-bold">03</span>
                  <span>PRESERVE RESOURCES</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#7FA9C7] font-bold">04</span>
                  <span>MAINTAIN SYSTEMS</span>
                </li>
              </ul>
            </div>
          </div>

          {/* BOTTOM LEFT LISTENING CONTROL WIDGET */}
          <div className="reticle-panel p-3 rounded-sm space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
              <span className="text-[#E6EDF3]">
                /// {agentState === 'listening' ? 'LISTENING' : 'STANDBY'}
              </span>
              <div className="flex items-center gap-1 text-[#00D9FF]">
                <span className="w-1 h-1 rounded-full bg-[#00D9FF] animate-ping" />
                <span className="w-1 h-1 rounded-full bg-[#00D9FF]" />
              </div>
            </div>

            {/* Mini Waveform Visualization */}
            <div className="flex items-end justify-between h-5 px-1 gap-1 py-0.5 border-t border-b border-[#26313D]">
              {[30, 70, 40, 90, 60, 85, 35, 75, 50, 95, 40, 80].map((h, idx) => {
                const activeAmp = agentState === 'listening' ? micAmplitude : 12;
                const heightPercent = Math.min(100, Math.max(15, (h * activeAmp) / 50));
                return (
                  <div
                    key={idx}
                    className="w-1 bg-[#7FA9C7] transition-all duration-75"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>

            <button
              onClick={() => {
                if (voiceEngineRef.current) {
                  if (agentState === 'listening') voiceEngineRef.current.stopListening();
                  else voiceEngineRef.current.startListening();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#0B0F15] border border-[#26313D] hover:border-[#00D9FF] text-[#E6EDF3] text-[10px] font-mono tracking-widest uppercase transition-all"
            >
              <Radio size={12} className={agentState === 'listening' ? 'text-[#39D98A] animate-pulse' : 'text-[#7E8B98]'} />
              <span>{agentState === 'listening' ? '■ PRESS TO STOP' : '▶ PRESS TO START'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Mission Status, Voice Input Meter, System Logs, Environmental Data */}
        <div className="order-3 lg:order-3 w-full lg:w-72 shrink-0 flex flex-col justify-between space-y-4 text-xs text-[#7E8B98]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-3 lg:space-y-4 flex-1 min-h-0">
            
            {/* MISSION STATUS PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                MISSION STATUS
              </h2>

              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span>STATUS</span>
                  <span className="text-[#39D98A] font-bold tracking-widest">IN PROGRESS</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>OBJECTIVE</span>
                  <span className="text-[#E6EDF3] font-semibold">HUMANITY SURVIVAL</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>ETA</span>
                  <span className="text-[#00D9FF]">UNKNOWN</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>DISTANCE TRAVELED</span>
                  <span className="text-[#E6EDF3]">12.5 MILLION KM</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>TIME DILATION FACTOR</span>
                  <span className="text-[#E6EDF3]">1.092x</span>
                </div>
              </div>
            </div>

            {/* VOICE INPUT METER PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                VOICE INPUT
              </h2>

              <div className="border border-[#26313D] p-2 rounded-sm bg-[#05070A] relative">
                <div className="flex items-end justify-between h-8 px-1 gap-1">
                  {[20, 50, 35, 80, 45, 90, 30, 65, 85, 40, 95, 60, 30, 75, 40, 70].map((h, idx) => {
                    const activeAmp = agentState === 'listening' ? micAmplitude : 10;
                    const heightPercent = Math.min(100, Math.max(10, (h * activeAmp) / 50));
                    return (
                      <div
                        key={idx}
                        className="w-1 bg-[#00D9FF] rounded-xs transition-all duration-75"
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SYSTEM LOGS PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2 flex-1 flex flex-col min-h-[140px]">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase shrink-0">
                SYSTEM LOGS
              </h2>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[9px] text-[#7E8B98]">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#7FA9C7] shrink-0">{log.time}</span>
                    <span className="truncate text-[#E6EDF3]">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ENVIRONMENTAL DATA PANEL */}
            <div className="reticle-panel p-3 rounded-sm space-y-2 shrink-0">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-[#E6EDF3] uppercase">
                ENVIRONMENTAL DATA
              </h2>

              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span>TEMPERATURE</span>
                  <span className="text-[#E6EDF3] font-bold">-12 °C</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>RADIATION</span>
                  <span className="text-[#E6EDF3] font-bold">0.17 mSv/h</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>GRAVITY</span>
                  <span className="text-[#E6EDF3] font-bold">0.98 G</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>ATMOSPHERE</span>
                  <span className="text-[#39D98A] font-bold">STABLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT END COMMUNICATION CONTROL */}
          <button
            onClick={handleEndCommunication}
            disabled={agentState === 'idle'}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#0B0F15] border border-[#26313D] hover:border-[#FF5C5C] text-[#E6EDF3] text-[10px] font-mono tracking-widest uppercase transition-all disabled:opacity-40 shrink-0"
          >
            <span>END COMMUNICATION</span>
            <Square size={12} className="text-[#FF5C5C]" />
          </button>
        </div>

        {/* RIGHT ACTIVE DRAWER OVERLAY PANEL (RESPONSIVE MODAL OVERLAY ON MOBILE) */}
        {activeTab && (
          <div className="fixed inset-0 z-50 bg-[#05070A]/80 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none flex justify-end">
            <aside className="w-full max-w-sm lg:w-80 h-full shrink-0 transition-all duration-300 z-50 bg-[#080B10] border-l border-[#26313D] p-4 lg:p-0 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-3 lg:hidden border-b border-[#26313D] mb-3">
                <span className="text-xs font-bold text-[#00D9FF] uppercase tracking-widest">
                  {activeTab} PANEL
                </span>
                <button
                  onClick={() => setActiveTab(null)}
                  className="px-2 py-1 bg-[#0B0F15] border border-[#26313D] text-[#E6EDF3] text-xs font-mono rounded-xs"
                >
                  CLOSE ✕
                </button>
              </div>

              {activeTab === 'personality' && (
                <PersonalityPanel
                  personality={personality}
                  onChange={setPersonality}
                  onReset={() => setPersonality(DEFAULT_PERSONALITY)}
                />
              )}
              {activeTab === 'conversations' && (
                <ConversationPanel
                  conversations={conversations}
                  activeId={activeConvId}
                  onSelect={(id) => {
                    setActiveConvId(id);
                    if (window.innerWidth < 1024) setActiveTab(null);
                  }}
                  onNew={handleNewConversation}
                  onRename={handleRenameConv}
                  onDelete={handleDeleteConv}
                />
              )}
              {activeTab === 'memory' && (
                <MemoryPanel
                  memories={memories}
                  onAdd={handleAddMemory}
                  onDelete={handleDeleteMemory}
                />
              )}
              {activeTab === 'tools' && <ToolPanel />}
              {activeTab === 'settings' && (
                <SettingsPanel
                  config={voiceConfig}
                  onChange={(up) => setVoiceConfig((prev) => ({ ...prev, ...up }))}
                  onClearHistory={() => handleDeleteConv(activeConvId)}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
