import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './promptBuilder.js';
import { DEFAULT_PERSONALITY } from '../../../shared/types/index.js';

describe('PromptBuilder', () => {
  it('should include identity directives and TARS operational parameters', () => {
    const prompt = buildSystemPrompt(DEFAULT_PERSONALITY);
    expect(prompt).toContain('TARS (Tactical Autonomous Reconnaissance System)');
    expect(prompt).toContain('HUMOR (75%)');
    expect(prompt).toContain('HONESTY (95%)');
    expect(prompt).toContain('CONFIDENCE (85%)');
  });

  it('should format memories when provided', () => {
    const memories = [
      {
        id: '1',
        key: 'Preferred Unit System',
        value: 'Metric System',
        category: 'preference' as const,
        createdAt: Date.now(),
      },
    ];
    const prompt = buildSystemPrompt(DEFAULT_PERSONALITY, memories);
    expect(prompt).toContain('RECALLED MEMORIES & PREFERENCES');
    expect(prompt).toContain('Preferred Unit System: Metric System');
  });
});
