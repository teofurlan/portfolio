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

describe('Spanish resume (content/resume.es.json)', () => {
  it('overlays text only: facts, dates, links and keywords stay English-sourced', async () => {
    const { resumes } = await import('./resume');
    const { en, es } = resumes;
    expect(es.basics.email).toBe(en.basics.email);
    expect(es.basics.profiles).toEqual(en.basics.profiles);
    expect(es.work.map((w) => [w.startDate, w.endDate])).toEqual(en.work.map((w) => [w.startDate, w.endDate]));
    expect(es.projects.map((p) => [p.slug, p.keywords, p.startDate])).toEqual(en.projects.map((p) => [p.slug, p.keywords, p.startDate]));
    expect(es.skills.map((s) => s.keywords)).toEqual(en.skills.map((s) => s.keywords));
    expect(es.meta.timeline.map((m) => [m.year, m.photo])).toEqual(en.meta.timeline.map((m) => [m.year, m.photo]));
    expect(es.work[0]?.position).not.toBe(en.work[0]?.position);
    expect(es.work[0]?.highlights).toHaveLength(en.work[0]?.highlights.length ?? -1);
  });

  it('refuses a phone number or any non-text field in the overlay', async () => {
    const { localizeResume, resume } = await import('./resume');
    expect(() => localizeResume(resume, { basics: { phone: '+54 9 11 0000 0000' } })).toThrow();
    expect(() => localizeResume(resume, { work: [{ startDate: '2000' }] })).toThrow();
  });

  it('rejects an overlay whose lists do not line up with the English entries', async () => {
    const { localizeResume, resume } = await import('./resume');
    expect(() => localizeResume(resume, { skills: [] })).toThrow(/entries/);
    expect(() => localizeResume(resume, { work: [{ highlights: ['one'] }] })).toThrow(/highlights/);
  });

  it('contains nothing that looks like a phone number', async () => {
    const { default: raw } = await import('../../content/resume.es.json');
    const text = JSON.stringify(raw);
    expect(text).not.toMatch(/\+\d[\d\s-]{7,}/);
    expect(text).not.toMatch(/"phone"/);
  });
});
