// Turns the redacted public sessions (transcripts/public/*.json) into what the replay page shows:
// stats, chapters and blocks. Curation never rewrites text: it only groups, collapses and marks.
import type { PublicEvent, PublicSession } from '../../scripts/lib/redact.ts';

export type Localized = { en: string; es: string };

export interface SessionCuration {
  chapters: { start: string; title: Localized }[];
  highlights?: string[];
}

export interface SessionStats {
  id: string;
  models: string[];
  startedAt: string;
  endedAt: string;
  turns: number;
  toolCalls: number;
  filesChanged: string[];
}

/** Tools whose `path` argument is a file the agent changed. */
const WRITING_TOOLS = new Set(['edit', 'write']);

export function relativePath(path: string): string {
  return path.replace(/\\+/g, '/').replace(/^.*?\/Code\/portfolio\//, '').replace(/^\.\//, '');
}

function pathOf(event: PublicEvent): string | undefined {
  try {
    const args = JSON.parse(event.text);
    return typeof args?.path === 'string' ? relativePath(args.path) : undefined;
  } catch {
    return undefined;
  }
}

export function sessionStats(s: PublicSession): SessionStats {
  const files = new Set<string>();
  let toolCalls = 0;
  for (const e of s.events) {
    if (e.kind !== 'tool_call') continue;
    toolCalls++;
    if (e.tool && WRITING_TOOLS.has(e.tool)) {
      const p = pathOf(e);
      if (p) files.add(p);
    }
  }
  return {
    id: s.id,
    models: s.models,
    startedAt: s.events[0]?.at ?? s.startedAt,
    endedAt: s.events.at(-1)?.at ?? s.startedAt,
    turns: s.events.filter((e) => e.kind === 'user').length,
    toolCalls,
    filesChanged: [...files].sort(),
  };
}

export function totals(stats: SessionStats[]) {
  return {
    sessions: stats.length,
    models: [...new Set(stats.flatMap((s) => s.models))],
    startedAt: stats.map((s) => s.startedAt).sort()[0] ?? '',
    endedAt: stats.map((s) => s.endedAt).sort().at(-1) ?? '',
    turns: stats.reduce((a, s) => a + s.turns, 0),
    toolCalls: stats.reduce((a, s) => a + s.toolCalls, 0),
    filesChanged: new Set(stats.flatMap((s) => s.filesChanged)).size,
  };
}

export type Block =
  | { kind: 'message'; event: PublicEvent; highlight: boolean }
  | { kind: 'steps'; count: number; events: PublicEvent[] };

/** Messages stay visible; thinking, tool calls, results and harness notices collapse into counted groups. */
const VISIBLE = new Set<PublicEvent['kind']>(['user', 'text']);

export function toBlocks(events: PublicEvent[], highlights: string[]): Block[] {
  const marked = new Set(highlights);
  const blocks: Block[] = [];
  for (const event of events) {
    if (VISIBLE.has(event.kind)) {
      blocks.push({ kind: 'message', event, highlight: marked.has(event.id) });
      continue;
    }
    const last = blocks.at(-1);
    if (last?.kind === 'steps') {
      last.events.push(event);
      last.count++;
    } else {
      blocks.push({ kind: 'steps', count: 1, events: [event] });
    }
  }
  return blocks;
}

export interface Chapter {
  title: Localized;
  from: string;
  to: string;
  blocks: Block[];
}

export function buildChapters(s: PublicSession, curation: SessionCuration | undefined): Chapter[] {
  const day = s.startedAt.slice(0, 10);
  const starts = new Map((curation?.chapters ?? []).map((c) => [c.start, c.title]));
  const groups: { title: Localized; events: PublicEvent[] }[] = [];
  for (const e of s.events) {
    const title = starts.get(e.id);
    if (title && groups.at(-1)?.events.length) groups.push({ title, events: [e] });
    else if (title && groups.length) groups.at(-1)!.title = title;
    else if (!groups.length) groups.push({ title: title ?? { en: `Session of ${day}`, es: `Sesión del ${day}` }, events: [e] });
    else groups.at(-1)!.events.push(e);
  }
  return groups.map((g) => ({
    title: g.title,
    from: g.events[0].at,
    to: g.events.at(-1)!.at,
    blocks: toBlocks(g.events, curation?.highlights ?? []),
  }));
}
