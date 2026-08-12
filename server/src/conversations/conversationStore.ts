import { Conversation, Message } from '../types/index.js';

export class ConversationStore {
  private conversations: Map<string, Conversation> = new Map();

  constructor() {
    // Create initial active conversation
    const initialConv: Conversation = {
      id: 'conv-default',
      title: 'Initial Exploration Log',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: 'AURA online. Systems operational. What can I help you explore?',
          timestamp: Date.now(),
        },
      ],
    };
    this.conversations.set(initialConv.id, initialConv);
  }

  listConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  createConversation(title: string = 'New Conversation'): Conversation {
    const conv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'New mission log initialized. Systems ready.',
          timestamp: Date.now(),
        },
      ],
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  addMessage(conversationId: string, message: Message): Conversation | undefined {
    const conv = this.conversations.get(conversationId);
    if (!conv) return undefined;

    conv.messages.push(message);
    conv.updatedAt = Date.now();

    // Auto-update conversation title based on first user message
    if (conv.title === 'New Conversation' && message.role === 'user') {
      conv.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
    }

    this.conversations.set(conversationId, conv);
    return conv;
  }

  renameConversation(id: string, title: string): Conversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    conv.title = title.trim();
    conv.updatedAt = Date.now();
    this.conversations.set(id, conv);
    return conv;
  }

  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  clearAll(): void {
    this.conversations.clear();
  }
}

export const conversationStore = new ConversationStore();
