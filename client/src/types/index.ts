export type AgentState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface PersonalityConfig {
  humor: number;       // 0 - 100
  honesty: number;     // 0 - 100
  confidence: number;  // 0 - 100
  formality: number;   // 0 - 100
  sarcasm: number;     // 0 - 100
  empathy: number;     // 0 - 100
  verbosity: number;   // 0 - 100
}

export const DEFAULT_PERSONALITY: PersonalityConfig = {
  humor: 75,
  honesty: 95,
  confidence: 85,
  formality: 40,
  sarcasm: 35,
  empathy: 60,
  verbosity: 30,
};

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolExecutionSummary[];
  isInterim?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'fact' | 'instruction' | 'general';
  createdAt: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolExecutionSummary {
  name: string;
  args: Record<string, any>;
  result: any;
  success: boolean;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface VoiceConfig {
  voiceURI: string;
  rate: number;      // 0.5 to 2.0
  pitch: number;     // 0.5 to 1.5
  volume: number;    // 0 to 1.0
  micSensitivity: number; // 0 to 100
  autoListen: boolean;
  fallbackTextMode: boolean;
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceURI: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  micSensitivity: 50,
  autoListen: true,
  fallbackTextMode: false,
};

export interface ChatStreamEvent {
  type: 'token' | 'sentence' | 'tool_start' | 'tool_end' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  error?: string;
  messageId?: string;
}
