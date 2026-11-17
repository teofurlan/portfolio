/**
 * Dev-only trial Worker (P5 / T1). GET /run?model=<id>&theme=<id>&seed=<n>[&mode=svg|params]
 * Builds the prompt, calls Workers AI, validates, and returns everything as JSON.
 * Run with: pnpm wrangler dev -c scripts/decoration/wrangler.trial.jsonc --port 8799
 */
import { buildPrompt, pickSelection, seededRng } from '../../src/lib/decoration/prompt';
import { extractEnvelope, validateSvg, validateTitle } from '../../src/lib/decoration/validate';

interface Env {
  AI: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Workers AI returns `{response}` (legacy) or an OpenAI-style `{choices:[{message}]}` depending on the model. */
function textOf(out: any): string {
  if (typeof out === 'string') return out;
  if (typeof out?.response === 'string') return out.response;
  const msg = out?.choices?.[0]?.message;
  if (typeof msg?.content === 'string') return msg.content;
  // Some models (qwen3 with thinking off) put the answer in `reasoning` and leave `content` null.
  return String(msg?.reasoning ?? msg?.reasoning_content ?? '');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/run') return json({ error: 'GET /run?model=&theme=&seed=' }, 404);
    const model = url.searchParams.get('model') ?? '';
    const theme = url.searchParams.get('theme') ?? '';
    const seed = Number(url.searchParams.get('seed') ?? '1');
    if (!model) return json({ error: 'model required' }, 400);

    let selection;
    try {
      selection = pickSelection(theme, seededRng(seed));
    } catch (e) {
      return json({ error: String(e) }, 400);
    }
    const messages = buildPrompt(selection);
    const prompt = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n');
    const started = Date.now();

    let out: any;
    try {
      // Reasoning models (GLM, Qwen3) can burn the whole budget thinking: switch thinking off.
      out = await env.AI.run(model, {
        messages,
        max_tokens: 4096,
        chat_template_kwargs: { enable_thinking: false },
      });
    } catch (e) {
      return json({ model, theme, seed, selection, prompt, ok: false, errors: [`AI call failed: ${String(e)}`], raw: '', svg: '' });
    }
    const raw = textOf(out);
    const envelope = extractEnvelope(raw);
    const errors: string[] = [];
    let svg = '';
    let title_en = '';
    let title_es = '';
    if (!envelope) {
      errors.push('no JSON envelope or <svg> found in the reply');
    } else {
      const v = validateSvg(envelope.svg);
      if (!v.ok) errors.push(...v.errors);
      else svg = v.svg;
      const te = validateTitle(envelope.title_en);
      const ts = validateTitle(envelope.title_es);
      if (te.ok) title_en = te.title;
      else errors.push(`title_en: ${te.error}`);
      if (ts.ok) title_es = ts.title;
      else errors.push(`title_es: ${ts.error}`);
    }
    return json({
      model,
      theme,
      seed,
      selection,
      prompt,
      raw,
      title_en,
      title_es,
      ok: errors.length === 0,
      svg,
      errors,
      finish_reason: out?.choices?.[0]?.finish_reason ?? null,
      usage: out?.usage ?? null,
      neurons: out?.usage?.neurons ?? out?.neurons ?? null,
      ms: Date.now() - started,
    });
  },
};
