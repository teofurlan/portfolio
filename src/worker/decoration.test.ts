import { describe, expect, it } from 'vitest';
import { generateDaily, MODEL } from './decoration';
import { seededRng } from '../lib/decoration/rng';
import { THEMES } from '../lib/decoration/themes';
import { validateSvg } from '../lib/decoration/validate';

class FakeKV {
  store = new Map<string, string>();
  puts: string[] = [];
  async get(k: string) {
    return this.store.get(k) ?? null;
  }
  async put(k: string, v: string) {
    this.puts.push(k);
    this.store.set(k, v);
  }
}

const goodReply = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ title_en: 'A calm board', title_es: 'Una placa calma', pins: 6, size: 50, traces: 3, accent: 1, seed: 5, ...extra });

function fakeAi(replies: (string | Error)[]) {
  const calls: { model: string; input: Record<string, unknown> }[] = [];
  return {
    calls,
    async run(model: string, input: Record<string, unknown>) {
      calls.push({ model, input });
      const r = replies[Math.min(calls.length - 1, replies.length - 1)]!;
      if (r instanceof Error) throw r;
      return { choices: [{ message: { content: r }, finish_reason: 'stop' }], usage: { neurons: 12 } };
    },
  };
}

const day = (n: number) => new Date(Date.UTC(2026, 10, 18 + n, 6, 0, 0)); // 06:00 UTC = 03:00 ART
const json = (kv: FakeKV, k: string) => JSON.parse(kv.store.get(k)!);

describe('generateDaily', () => {
  it('stores the piece, latest, index and rotation (model path)', async () => {
    const kv = new FakeKV();
    const ai = fakeAi([goodReply()]);
    const r = await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(1));
    expect(r).toMatchObject({ status: 'created', date: '2026-11-18', plate: 1 });
    expect(ai.calls).toHaveLength(1);
    expect(ai.calls[0]!.model).toBe(MODEL);
    expect(ai.calls[0]!.input['chat_template_kwargs']).toEqual({ enable_thinking: false });
    const piece = json(kv, 'piece:2026-11-18');
    expect(piece).toMatchObject({ plate: 1, source: 'model-params', model: MODEL });
    expect(validateSvg(piece.svg).ok).toBe(true);
    expect(json(kv, 'latest')).toEqual(piece);
    expect(json(kv, 'index')).toEqual([
      { date: '2026-11-18', plate: 1, theme: piece.theme, title_en: piece.title_en, title_es: piece.title_es },
    ]);
    expect(json(kv, 'rotation').used).toEqual([piece.theme]);
  });

  it('is idempotent per date: no model call, no writes', async () => {
    const kv = new FakeKV();
    const ai = fakeAi([goodReply()]);
    await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(1));
    const before = kv.puts.length;
    const r = await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(2));
    expect(r.status).toBe('exists');
    expect(ai.calls).toHaveLength(1);
    expect(kv.puts).toHaveLength(before);
  });

  it('adds newest first, numbers plates by index length and rotates themes (S3, S8)', async () => {
    const kv = new FakeKV();
    const env = { AI: fakeAi([goodReply()]), DECORATION: kv };
    const themes: string[] = [];
    for (let i = 0; i < THEMES.length; i++) {
      const r = await generateDaily(env, day(i), seededRng(10 + i));
      expect(r.plate).toBe(i + 1);
      themes.push(json(kv, 'latest').theme);
    }
    expect([...themes].sort()).toEqual(THEMES.map((t) => t.id).sort());
    const index = json(kv, 'index');
    expect(index.map((e: { plate: number }) => e.plate)).toEqual([5, 4, 3, 2, 1]);
    expect(index[0].date).toBe('2026-11-22');
  });

  it('retries once, then uses the second reply (S4)', async () => {
    const kv = new FakeKV();
    const ai = fakeAi(['sorry, I cannot', goodReply()]);
    await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(3));
    expect(ai.calls).toHaveLength(2);
    expect(json(kv, 'latest').source).toBe('model-params');
  });

  it('draws from random parameters when both replies fail (S4, S11)', async () => {
    const kv = new FakeKV();
    const ai = fakeAi(['nope', new Error('AI down')]);
    const r = await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(3));
    expect(r.status).toBe('created');
    expect(ai.calls).toHaveLength(2);
    expect(json(kv, 'latest')).toMatchObject({ source: 'code-random', title_en: "Today's piece", title_es: 'La pieza de hoy' });
  });

  it('reads the answer from `reasoning` when content is empty', async () => {
    const kv = new FakeKV();
    const ai = {
      async run() {
        return { choices: [{ message: { content: null, reasoning: goodReply() }, finish_reason: 'stop' }] };
      },
    };
    await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(3));
    expect(json(kv, 'latest').source).toBe('model-params');
  });

  it('keeps fallback titles when only the titles are bad', async () => {
    const kv = new FakeKV();
    await generateDaily({ AI: fakeAi([goodReply({ title_en: '<b>x</b>' })]), DECORATION: kv }, day(0), seededRng(3));
    expect(json(kv, 'latest')).toMatchObject({ source: 'model-params', title_en: "Today's piece", title_es: 'Una placa calma' });
  });

  it('keeps yesterday and writes nothing when storage state is unusable (S1)', async () => {
    const kv = new FakeKV();
    kv.store.set('index', '{not json');
    const ai = fakeAi([goodReply()]);
    const r = await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(3));
    expect(r.status).toBe('kept');
    expect(kv.puts).toHaveLength(0);
  });

  it('keeps yesterday when the KV write fails', async () => {
    const kv = new FakeKV();
    kv.put = async () => {
      throw new Error('kv down');
    };
    const r = await generateDaily({ AI: fakeAi([goodReply()]), DECORATION: kv }, day(0), seededRng(3));
    expect(r.status).toBe('kept');
    expect(kv.store.size).toBe(0);
  });

  it('republishes a stored piece that never reached the index, without calling the model', async () => {
    const kv = new FakeKV();
    await generateDaily({ AI: fakeAi([goodReply()]), DECORATION: kv }, day(0), seededRng(3));
    kv.store.delete('index');
    kv.store.delete('latest');
    const ai = fakeAi([goodReply()]);
    const r = await generateDaily({ AI: ai, DECORATION: kv }, day(0), seededRng(3));
    expect(r.status).toBe('republished');
    expect(ai.calls).toHaveLength(0);
    expect(json(kv, 'index')).toHaveLength(1);
    expect(json(kv, 'latest').date).toBe('2026-11-18');
  });
});
