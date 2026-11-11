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

describe('resume content', () => {
  it('keeps projects and the timeline photo instead of stripping them', () => {
    const parsed = resumeSchema.parse({
      basics: { ...basics, location: { region: 'Entre Ríos', countryCode: 'AR' } },
      projects: [{ name: 'MTDS', startDate: '2026', highlights: ['IK'] }],
      meta: { timeline: [{ year: 2004, title: 'First computer', photo: 'x.jpg' }] },
    });
    expect(parsed.projects[0]?.name).toBe('MTDS');
    expect(parsed.basics.location?.region).toBe('Entre Ríos');
    expect(parsed.meta.timeline[0]?.photo).toBe('x.jpg');
  });
});

describe('content/resume.json', () => {
  it('parses against the schema', async () => {
    const { resume } = await import('./resume');
    expect(resume.basics.name).toBe('Teo Furlan');
  });

  it('contains nothing that looks like a phone number', async () => {
    const { default: raw } = await import('../../content/resume.json');
    const text = JSON.stringify(raw);
    expect(text).not.toMatch(/\+\d[\d\s-]{7,}/);
    expect(text).not.toMatch(/"phone"/);
  });
});
