import { describe, expect, it } from 'vitest';
import type { PublicEvent, PublicSession } from '../../scripts/lib/redact.ts';
import { clip, formatRange, formatWhen, loadReplay, parseJsonOrUndefined, parseTranslations, stepView } from './replay-data.ts';

let n = 0;
const ev = (kind: PublicEvent['kind'], text: string = kind, extra: Partial<PublicEvent> = {}): PublicEvent => ({
  id: `e${++n}`, parentId: null, at: `2026-11-11T10:${String(n % 60).padStart(2, '0')}:00.000Z`, kind, text, ...extra,
});
const session = (id: string, startedAt: string, events: PublicEvent[]): PublicSession => ({
  id, startedAt, models: ['claude-opus-5-5'], abandoned: 0, events,
});

describe('loadReplay: empty / missing input (CI has no transcripts)', () => {
  it('returns null when the glob matched nothing', () => {
    expect(loadReplay({}, {}, { sessions: {} })).toBeNull();
  });
  it('returns null when only non-session files are present', () => {
    expect(loadReplay({ '../../transcripts/public/_translations.json': { a: 1 } }, undefined, undefined)).toBeNull();
  });
  it('skips malformed files instead of failing', () => {
    const files = { '/t/2026-11-11-aaaaaaaa.json': { nope: true }, '/t/2026-11-11-bbbbbbbb.json': null, '/t/2026-11-11-cccccccc.json': 'x' };
    expect(loadReplay(files, undefined, undefined)).toBeNull();
  });
});

describe('loadReplay: sessions', () => {
  const a = session('aaaaaaaa-1', '2026-11-12T09:00:00.000Z', [ev('user', 'segundo'), ev('text', 'ok')]);
  const b = session('bbbbbbbb-2', '2026-11-11T09:00:00.000Z', [ev('user', 'primero'), ev('tool_call', '{}', { tool: 'ls' }), ev('text', 'listo')]);
  const files = { '/t/2026-11-12-aaaaaaaa.json': a, '/t/2026-11-11-bbbbbbbb.json': b, '/t/_translations.json': {} };

  it('sorts by startedAt and ignores files starting with _', () => {
    const r = loadReplay(files, undefined, undefined)!;
    expect(r.totals.sessions).toBe(2);
    expect(r.chapters[0].blocks[0]).toMatchObject({ kind: 'message', text: 'primero' });
  });

  it('numbers chapters across sessions and uses curation keyed by the first 8 chars', () => {
    const curation = { sessions: { bbbbbbbb: { chapters: [{ start: b.events[0].id, title: { en: 'One', es: 'Uno' } }], highlights: [b.events[0].id] } } };
    const r = loadReplay(files, undefined, curation)!;
    expect(r.chapters.map((c) => c.n)).toEqual([1, 2]);
    expect(r.chapters[0].title).toEqual({ en: 'One', es: 'Uno' });
    expect(r.chapters[0].blocks[0]).toMatchObject({ highlight: true });
    expect(r.chapters[1].title.en).toContain('2026-11-12');
  });

  it('collapses non-message events into a counted group and keeps text untouched', () => {
    const html = '<script>alert(1)</script>\nline 2';
    const s = session('cccccccc-3', '2026-11-13T09:00:00.000Z', [ev('user', html), ev('thinking', 't'), ev('tool_call', '{"a":1}', { tool: 'read' })]);
    const r = loadReplay({ '/t/2026-11-13-cccccccc.json': s }, undefined, undefined)!;
    expect(r.chapters[0].blocks[0]).toMatchObject({ kind: 'message', role: 'user', text: html });
    expect(r.chapters[0].blocks[1]).toMatchObject({ kind: 'steps', count: 2 });
  });

  it('totals count turns, tool calls and files changed', () => {
    const r = loadReplay(files, undefined, undefined)!;
    expect(r.totals).toMatchObject({ sessions: 2, turns: 2, toolCalls: 1, filesChanged: 0, models: ['claude-opus-5-5'] });
  });
});

describe('translations', () => {
  const s = session('dddddddd-4', '2026-11-13T09:00:00.000Z', [ev('user', 'hola'), ev('text', 'hi there'), ev('tool_call', '{}', { tool: 'ls' })]);
  const [u, t, call] = s.events;
  const files = { '/t/2026-11-13-dddddddd.json': s };

  it('missing or garbage input means no translations', () => {
    for (const bad of [undefined, null, 'x', 5, [], { x: 'y' }]) expect(parseTranslations(bad).size).toBe(0);
  });

  it('keeps only well-formed entries', () => {
    const m = parseTranslations({
      a: { from: 'es', to: 'en', text: 'hello' },
      b: { from: 'es', to: 'fr', text: 'x' },
      c: { from: 'es', to: 'en', text: '' },
      d: { from: 'en', to: 'es' },
      e: null,
    });
    expect([...m.keys()]).toEqual(['a']);
  });

  it('attaches a translation to its message, partial coverage allowed', () => {
    const r = loadReplay(files, { [u.id]: { from: 'es', to: 'en', text: 'hello' } }, undefined)!;
    const [m1, m2] = r.chapters[0].blocks;
    expect(m1).toMatchObject({ text: 'hola', translation: { to: 'en', text: 'hello' } });
    expect(m2).toMatchObject({ text: 'hi there' });
    expect((m2 as { translation?: unknown }).translation).toBeUndefined();
  });

  it('ignores translations for tool events and never alters the original', () => {
    const r = loadReplay(files, { [call.id]: { from: 'en', to: 'es', text: 'x' }, [t.id]: { from: 'en', to: 'es', text: 'hola' } }, undefined)!;
    expect(r.chapters[0].blocks[1]).toMatchObject({ text: 'hi there', translation: { to: 'es', text: 'hola' } });
    expect(JSON.stringify(r.chapters[0].blocks[2])).not.toContain('"to"');
  });
});

describe('clip / stepView', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    expect(clip('a\n  b\tc', 20)).toBe('a b c');
    expect(clip('x'.repeat(30), 10)).toBe('xxxxxxxxx…');
  });
  it('labels tool calls, results (errors flagged), thinking and notices', () => {
    expect(stepView(ev('tool_call', '{"path":"a"}', { tool: 'read' }))).toMatchObject({ label: 'read', kind: 'call', snippet: '{"path":"a"}' });
    expect(stepView(ev('tool_result', 'boom', { tool: 'bash', isError: true }))).toMatchObject({ label: 'bash', kind: 'result', error: true });
    expect(stepView(ev('thinking', 'hmm')).kind).toBe('thinking');
    expect(stepView(ev('notice', 'n')).kind).toBe('notice');
  });
});

describe('date formatting (UTC, deterministic)', () => {
  it('formats a moment in each language', () => {
    expect(formatWhen('2026-11-10T19:21:00.000Z', 'en')).toMatch(/Nov.*10|10.*Nov/);
    expect(formatWhen('2026-11-10T19:21:00.000Z', 'es')).toMatch(/10.*nov/i);
    expect(formatWhen('2026-11-10T19:21:00.000Z', 'en')).toContain('19:21');
  });
  it('shortens a same-day range and keeps both dates otherwise', () => {
    const same = formatRange('2026-11-10T19:21:00.000Z', '2026-11-10T19:58:00.000Z', 'en');
    expect(same).toContain('19:21');
    expect(same).toContain('19:58');
    expect(same.match(/Nov/g)).toHaveLength(1);
    expect(formatRange('2026-11-10T19:21:00.000Z', '2026-11-12T08:00:00.000Z', 'en').match(/Nov/g)).toHaveLength(2);
  });
});

describe('parseJsonOrUndefined', () => {
  it('returns undefined for missing or invalid JSON (file being written)', () => {
    expect(parseJsonOrUndefined(undefined)).toBeUndefined();
    expect(parseJsonOrUndefined('{"a": ')).toBeUndefined();
    expect(parseJsonOrUndefined('{"a":1}')).toEqual({ a: 1 });
  });
});
