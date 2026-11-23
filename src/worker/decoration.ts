/**
 * Daily decoration (P5 / T3+T4): the cron generates, the page handlers read.
 *
 * S4 (L9): the model only picks the parameters and the titles; code draws the SVG with the marker
 * stroke. Two model tries, then seeded random parameters, then yesterday's piece stays (nothing is
 * written). Visitors never trigger model calls: the read helpers only touch KV.
 *
 * KV layout: `piece:<YYYY-MM-DD>` record, `latest` (copy of the newest record), `index` (newest
 * first: {date, plate, theme, title_en, title_es}), `rotation` (theme rotation state).
 */
import { buenosAiresDate, makePiece, nextTheme, type PieceRecord } from '../lib/decoration/daily';
import { buildParameterPrompt, pickSelection, seededRng } from '../lib/decoration/prompt';
import { parseIndex, parseRecord, type IndexEntry } from './render';
import type { DecorationEnv, KVLike } from './types';

export const MODEL = '@cf/google/gemma-4-26b-a4b-it';
/** Parameters plus two titles are tiny. */
const MAX_TOKENS = 800;
/** KV subrequests per archive render: keep well under the 50 per request of the free plan. */
export const ARCHIVE_LIMIT = 40;

export interface DailyResult {
  status: 'created' | 'exists' | 'republished' | 'kept';
  date: string;
  plate?: number;
  source?: PieceRecord['source'];
  calls: number;
  neurons: number;
  error?: string;
}

/** Workers AI returns `{response}` or an OpenAI-style `{choices:[{message}]}` depending on the model. */
function textOf(out: any): string {
  if (typeof out === 'string') return out;
  if (typeof out?.response === 'string') return out.response;
  const msg = out?.choices?.[0]?.message;
  if (typeof msg?.content === 'string' && msg.content) return msg.content;
  // With thinking off some models leave `content` empty and answer in `reasoning`.
  return String(msg?.reasoning ?? msg?.reasoning_content ?? '');
}

function parseObject(raw: string): Record<string, unknown> | null {
  const a = raw.indexOf('{');
  const b = raw.lastIndexOf('}');
  if (a === -1 || b <= a) return null;
  try {
    const o = JSON.parse(raw.slice(a, b + 1));
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0]!;

async function readJson(kv: KVLike, key: string): Promise<unknown | undefined> {
  const raw = await kv.get(key);
  return raw === null ? undefined : JSON.parse(raw);
}

export async function generateDaily(env: DecorationEnv, now: Date = new Date(), rng: () => number = seededRng(randomSeed())): Promise<DailyResult> {
  const date = buenosAiresDate(now);
  const result: DailyResult = { status: 'kept', date, calls: 0, neurons: 0 };
  try {
    const kv = env.DECORATION;
    const rawIndex = await readJson(kv, 'index');
    // A missing index is a fresh archive; an unreadable one must never be replaced.
    const index = rawIndex === undefined ? [] : parseIndex(rawIndex);
    if (!index) throw new Error('index is unreadable');
    const entryOf = (p: PieceRecord): IndexEntry => ({ date: p.date, plate: p.plate, theme: p.theme, title_en: p.title_en, title_es: p.title_es });

    // Idempotent per date.
    const stored = parseRecord(await readJson(kv, `piece:${date}`));
    if (stored) {
      result.plate = stored.plate;
      result.source = stored.source;
      if (index.some((e) => e.date === date)) {
        console.log(`decoration: ${date} already published (plate ${stored.plate}), nothing to do`);
        return { ...result, status: 'exists' };
      }
      await kv.put('index', JSON.stringify([entryOf(stored), ...index]));
      await kv.put('latest', JSON.stringify(stored));
      return { ...result, status: 'republished' };
    }

    const plate = index.length + 1;
    const rotation = nextTheme(await readJson(kv, 'rotation'), rng);
    const selection = pickSelection(rotation.theme, rng);
    const messages = buildParameterPrompt(selection);

    let piece: PieceRecord | null = null;
    for (let attempt = 1; attempt <= 2 && !piece; attempt++) {
      result.calls++;
      try {
        const out: any = await env.AI.run(MODEL, {
          messages,
          max_tokens: MAX_TOKENS,
          seed: Math.floor(rng() * 1_000_000) + attempt,
          chat_template_kwargs: { enable_thinking: false },
        });
        result.neurons += out?.usage?.neurons ?? out?.neurons ?? 0;
        if (out?.choices?.[0]?.finish_reason === 'length') throw new Error('reply was cut off');
        const params = parseObject(textOf(out));
        if (!params) throw new Error('reply is not a JSON object');
        piece = makePiece({ date, plate, selection, params, titles: params, model: MODEL, rng });
      } catch (e) {
        console.warn(`decoration: model attempt ${attempt} failed: ${String(e)}`);
      }
    }
    piece ??= makePiece({ date, plate, selection, params: null, titles: null, model: MODEL, rng });

    await kv.put(`piece:${date}`, JSON.stringify(piece));
    await kv.put('rotation', JSON.stringify(rotation.state));
    await kv.put('index', JSON.stringify([entryOf(piece), ...index]));
    await kv.put('latest', JSON.stringify(piece));
    console.log(`decoration: ${date} plate ${plate} ${piece.theme} via ${piece.source}, ${result.calls} call(s), ${result.neurons} neurons`);
    return { ...result, status: 'created', plate, source: piece.source };
  } catch (e) {
    console.error(`decoration: keeping the previous piece: ${String(e)}`);
    return { ...result, status: 'kept', error: String(e) };
  }
}

/** Newest piece, or null when KV is empty or unreadable (the caller serves the static page). */
export async function readLatest(kv: KVLike): Promise<PieceRecord | null> {
  return parseRecord(await readJson(kv, 'latest'));
}

/** Newest-first pieces for the archive (at most ARCHIVE_LIMIT). */
export async function readArchive(kv: KVLike, limit = ARCHIVE_LIMIT): Promise<PieceRecord[]> {
  const raw = await readJson(kv, 'index');
  const index = raw === undefined ? [] : (parseIndex(raw) ?? []);
  const records = await Promise.all(index.slice(0, limit).map(async (e) => parseRecord(await readJson(kv, `piece:${e.date}`).catch(() => undefined))));
  return records.filter((r): r is PieceRecord => r !== null);
}
