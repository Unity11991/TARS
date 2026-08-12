import { Message, PersonalityConfig, MemoryItem, ChatStreamEvent, ToolDefinition } from '../../../shared/types/index.js';

export interface StreamOptions {
  personality: PersonalityConfig;
  memories: MemoryItem[];
  messages: Message[];
  tools?: ToolDefinition[];
  onEvent: (event: ChatStreamEvent) => void;
}

export interface AIProvider {
  name: string;
  generateStream(options: StreamOptions): Promise<string>;
}
