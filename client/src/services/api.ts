import { Conversation, MemoryItem, Message, PersonalityConfig, ToolDefinition, ChatStreamEvent } from '../types/index';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  return res.json();
}

export async function createConversation(title?: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchMemories(): Promise<MemoryItem[]> {
  const res = await fetch(`${API_BASE}/memory`);
  return res.json();
}

export async function addMemory(key: string, value: string, category: MemoryItem['category']): Promise<MemoryItem> {
  const res = await fetch(`${API_BASE}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, category }),
  });
  return res.json();
}

export async function deleteMemory(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/memory/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchTools(): Promise<ToolDefinition[]> {
  const res = await fetch(`${API_BASE}/tools`);
  return res.json();
}

export interface StreamChatParams {
  conversationId: string;
  userContent: string;
  personality: PersonalityConfig;
  history: Message[];
  onEvent: (event: ChatStreamEvent) => void;
  signal?: AbortSignal;
}

export async function streamChatResponse(params: StreamChatParams): Promise<void> {
  const { conversationId, userContent, personality, history, onEvent, signal } = params;

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      userContent,
      personality,
      history,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body reader unreadable');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json: ChatStreamEvent = JSON.parse(line.slice(6));
          onEvent(json);
        } catch (e) {
          console.error('[SSE Parse Error]', e);
        }
      }
    }
  }
}
