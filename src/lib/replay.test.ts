import { describe, expect, it } from 'vitest';
import type { PublicEvent, PublicSession } from '../../scripts/lib/redact.ts';
import { buildChapters, relativePath, sessionStats, toBlocks, totals } from './replay.ts';

let n = 0;
const ev = (kind: PublicEvent['kind'], text: string = kind, extra: Partial<PublicEvent> = {}): PublicEvent => ({
  id: `e${++n}`, parentId: null, at: `2026-11-11T10:${String(n).padStart(2, '0')}:00.000Z`, kind, text, ...extra,
});

const session = (events: PublicEvent[], id = 'abcdef12-0000'): PublicSession => ({
  id, startedAt: '2026-11-11T09:00:00.000Z', models: ['claude-opus-5-5'], abandoned: 0, events,
});

describe('relativePath', () => {
  it.each([
    ['~\\Code\\portfolio\\src\\lib\\x.ts', 'src/lib/x.ts'],
    ['~/Code/portfolio/BRIEF.md', 'BRIEF.md'],
    ['./odd/tasks/p4.md', 'odd/tasks/p4.md'],
    ['src/a.ts', 'src/a.ts'],
  ])('%s -> %s', (input, expected) => expect(relativePath(input)).toBe(expected));
});

describe('sessionStats', () => {
  const s = session([
    ev('user', 'hola'),
    ev('tool_call', JSON.stringify({ path: '~\\Code\\portfolio\\src\\a.ts' }), { tool: 'edit' }),
    ev('tool_result', 'ok', { tool: 'edit' }),
    ev('tool_call', JSON.stringify({ path: 'src/a.ts', content: 'x' }), { tool: 'write' }),
    ev('tool_call', JSON.stringify({ path: 'README.md' }), { tool: 'read' }),
    ev('notice', '[System-generated] done'),
    ev('user', 'otra'),
    ev('text', 'listo'),
  ]);

  it('counts turns (user messages only), tool calls and distinct files written or edited', () => {
    expect(sessionStats(s)).toEqual({
      id: 'abcdef12-0000',
      models: ['claude-opus-5-5'],
      startedAt: s.events[0].at,
      endedAt: s.events.at(-1)!.at,
      turns: 2,
      toolCalls: 3,
      filesChanged: ['src/a.ts'],
    });
  });

  it('adds sessions up without counting a file twice', () => {
    const t = totals([sessionStats(s), sessionStats(s)]);
    expect(t).toMatchObject({ sessions: 2, turns: 4, toolCalls: 6, filesChanged: 1, models: ['claude-opus-5-5'] });
  });
});

describe('toBlocks', () => {
  const events = [ev('user', 'pedido'), ev('thinking'), ev('tool_call'), ev('tool_result'), ev('text', 'respuesta'), ev('notice'), ev('tool_call')];

  it('shows user and assistant messages and collapses everything else into counted step groups', () => {
    const blocks = toBlocks(events, []);
    expect(blocks.map((b) => (b.kind === 'steps' ? `steps:${b.count}` : b.event.text))).toEqual([
      'pedido', 'steps:3', 'respuesta', 'steps:2',
    ]);
  });

  it('never drops an event: the steps keep the collapsed events', () => {
    const blocks = toBlocks(events, []);
    const kept = blocks.flatMap((b) => (b.kind === 'steps' ? b.events : [b.event]));
    expect(kept).toEqual(events);
  });

  it('marks highlighted messages', () => {
    const blocks = toBlocks(events, [events[4].id]);
    expect(blocks.filter((b) => b.kind === 'message' && b.highlight).map((b) => b.kind === 'message' && b.event.text)).toEqual(['respuesta']);
  });
});

describe('buildChapters', () => {
  const events = [ev('user', 'a'), ev('text', 'b'), ev('user', 'c'), ev('text', 'd')];
  const s = session(events);

  it('splits a session at the curated starts, with a title and a time range', () => {
    const chapters = buildChapters(s, {
      chapters: [
        { start: events[0].id, title: { en: 'Brief', es: 'Brief' } },
        { start: events[2].id, title: { en: 'Scaffold', es: 'Andamiaje' } },
      ],
      highlights: [],
    });
    expect(chapters.map((c) => [c.title.es, c.from, c.to, c.blocks.length])).toEqual([
      ['Brief', events[0].at, events[1].at, 2],
      ['Andamiaje', events[2].at, events[3].at, 2],
    ]);
  });

  it('falls back to one chapter per session when nothing is curated', () => {
    const chapters = buildChapters(s, undefined);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toEqual({ en: 'Session of 2026-11-11', es: 'Sesión del 2026-11-11' });
  });

  it('puts events before the first curated start in a session chapter instead of dropping them', () => {
    const chapters = buildChapters(s, { chapters: [{ start: events[2].id, title: { en: 'Later', es: 'Después' } }] });
    expect(chapters.map((c) => [c.title.en, c.blocks.length])).toEqual([
      ['Session of 2026-11-11', 2],
      ['Later', 2],
    ]);
  });
});
