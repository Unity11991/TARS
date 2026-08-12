import { MemoryItem } from '../types/index.js';

export class MemoryManager {
  private memories: MemoryItem[] = [];

  constructor() {
    // Pre-seed default core directives
    this.memories = [
      {
        id: 'mem-1',
        key: 'Response Length Preference',
        value: 'User prefers concise, direct responses suitable for real-time speech.',
        category: 'preference',
        createdAt: Date.now(),
      },
      {
        id: 'mem-2',
        key: 'AURA Primary Mandate',
        value: 'Operate as a calm, highly analytical exploration assistant.',
        category: 'instruction',
        createdAt: Date.now(),
      },
    ];
  }

  getMemories(): MemoryItem[] {
    return [...this.memories];
  }

  addMemory(key: string, value: string, category: MemoryItem['category'] = 'general'): MemoryItem {
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      key: key.trim(),
      value: value.trim(),
      category,
      createdAt: Date.now(),
    };
    this.memories.push(newItem);
    return newItem;
  }

  deleteMemory(id: string): boolean {
    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => m.id !== id);
    return this.memories.length < initialLen;
  }

  clearAll(): void {
    this.memories = [];
  }
}

export const memoryManager = new MemoryManager();
