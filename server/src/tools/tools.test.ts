import { describe, it, expect } from 'vitest';
import { TOOLS } from './index.js';

describe('AURA Tools Suite', () => {
  it('calculator tool should compute basic math correctly', async () => {
    const res = await TOOLS.calculator.execute({ expression: '982 * 27' });
    expect(res.success).toBe(true);
    expect(res.data.result).toBe(26514);
  });

  it('get_time tool should format location time', async () => {
    const res = await TOOLS.get_time.execute({ location: 'Tokyo' });
    expect(res.success).toBe(true);
    expect(res.data.timeZone).toBe('Asia/Tokyo');
    expect(res.data.time).toBeDefined();
  });
});
