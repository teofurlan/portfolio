import { describe, expect, it } from 'vitest';
import { resumeSchema } from './resume';

const basics = { name: 'Teo Furlan', email: 'a@b.co', url: 'https://teofurlan.com' };

describe('resume schema', () => {
  it('accepts the public basics', () => {
    expect(resumeSchema.safeParse({ basics }).success).toBe(true);
  });

  it('refuses a phone number so it can never be published', () => {
    const result = resumeSchema.safeParse({ basics: { ...basics, phone: '+54 9 11 0000 0000' } });
    expect(result.success).toBe(false);
  });
});
