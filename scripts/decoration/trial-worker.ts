/**
 * Dev-only trial Worker (P5 / T1, T2). GET /run?theme=<id>&seed=<n>[&model=<id>]
 * Runs the pipeline the real cron will use (S4): up to two SVG attempts, then parameter mode
 * (the model returns parameters, code draws), recording which path produced the final piece.
 * Run with: pnpm wrangler dev -c scripts/decoration/wrangler.trial.jsonc --port 8799
 */
import { buildParameterPrompt, buildPrompt, pickSelection, PARAMETER_RENDERERS, seededRng } from '../../src/lib/decoration/prompt';
import type { Message } from '../../src/lib/decoration/prompt';
import { ERR_CUT_OFF, describeMissingSvg, extractEnvelope, validateSvg, validateTitle } from '../../src/lib/decoration/validate';

const DEFAULT_MODEL = '@cf/google/gemma-4-26b-a4b-it';
/** The 8 KB SVG limit is about 2.5k tokens; the envelope adds a little. */
const MAX_TOKENS = 2500;

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

interface Attempt {
  kind: 'svg' | 'parameters';
  n: number;
  ok: boolean;
  errors: string[];
  raw: string;
  finish_reason: string | null;
  neurons: number | null;
  ms: number;
}

interface Call {
  raw: string;
  finish_reason: string | null;
  neurons: number | null;
  ms: number;
  error?: string;
}

async function callModel(env: Env, model: string, messages: Message[], seed: number): Promise<Call> {
  const started = Date.now();
  try {
    // Thinking off: reasoning models can burn the whole budget thinking.
    const out: any = await env.AI.run(model, { messages, max_tokens: MAX_TOKENS, seed, chat_template_kwargs: { enable_thinking: false } });
    return {
      raw: textOf(out),
      finish_reason: out?.choices?.[0]?.finish_reason ?? null,
      neurons: out?.usage?.neurons ?? out?.neurons ?? null,
      ms: Date.now() - started,
    };
  } catch (e) {
    return { raw: '', finish_reason: null, neurons: null, ms: Date.now() - started, error: `AI call failed: ${String(e)}` };
  }
}

const FALLBACK_TITLES = { en: "Today's piece", es: 'La pieza de hoy' };

function svgAttempt(call: Call, n: number): { attempt: Attempt; svg: string; title_en: string; title_es: string } {
  const errors: string[] = [];
  let svg = '';
  let title_en = '';
  let title_es = '';
  if (call.error) errors.push(call.error);
  else if (call.finish_reason === 'length') errors.push(`${ERR_CUT_OFF} (finish_reason=length, max_tokens ${MAX_TOKENS})`);
  else {
    const envelope = extractEnvelope(call.raw);
    if (!envelope) errors.push(describeMissingSvg(call.raw));
    else {
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
  }
  const ok = errors.length === 0;
  return {
    attempt: { kind: 'svg', n, ok, errors, raw: call.raw, finish_reason: call.finish_reason, neurons: call.neurons, ms: call.ms },
    svg: ok ? svg : '',
    title_en,
    title_es,
  };
}

function parameterAttempt(call: Call, theme: string): { attempt: Attempt; svg: string; title_en: string; title_es: string } {
  const errors: string[] = [];
  let svg = '';
  let title_en = FALLBACK_TITLES.en;
  let title_es = FALLBACK_TITLES.es;
  const render = PARAMETER_RENDERERS[theme];
  if (call.error) errors.push(call.error);
  else if (call.finish_reason === 'length') errors.push(`reply was cut off (finish_reason=length, max_tokens ${MAX_TOKENS})`);
  else if (!render) errors.push(`no parameter renderer for theme ${theme}`);
  else {
    const a = call.raw.indexOf('{');
    const b = call.raw.lastIndexOf('}');
    let params: any = null;
    try {
      params = JSON.parse(call.raw.slice(a, b + 1));
    } catch {
      errors.push('parameter reply is not valid JSON');
    }
    if (params && typeof params === 'object') {
      const te = validateTitle(params.title_en);
      const ts = validateTitle(params.title_es);
      if (te.ok) title_en = te.title;
      if (ts.ok) title_es = ts.title;
      const v = validateSvg(render(params as never));
      if (!v.ok) errors.push(...v.errors);
      else svg = v.svg;
    } else if (!errors.length) errors.push('parameter reply is not a JSON object');
  }
  const ok = errors.length === 0;
  return {
    attempt: { kind: 'parameters', n: 1, ok, errors, raw: call.raw, finish_reason: call.finish_reason, neurons: call.neurons, ms: call.ms },
    svg: ok ? svg : '',
    title_en,
    title_es,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/run') return json({ error: 'GET /run?theme=&seed=[&model=]' }, 404);
    const model = url.searchParams.get('model') || DEFAULT_MODEL;
    const theme = url.searchParams.get('theme') ?? '';
    const seed = Number(url.searchParams.get('seed') ?? '1');
    // Trials only: skip the SVG attempts to see what the parameter fallback draws.
    const forceParameters = url.searchParams.get('force') === 'parameters';

    let selection;
    try {
      selection = pickSelection(theme, seededRng(seed));
    } catch (e) {
      return json({ error: String(e) }, 400);
    }
    const messages = buildPrompt(selection);
    const prompt = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n');
    const attempts: Attempt[] = [];
    let path: 'svg-attempt-1' | 'svg-attempt-2' | 'parameters' | 'failed' = 'failed';
    let final = { svg: '', title_en: '', title_es: '' };

    // S4: two SVG attempts (the second one with a different model seed), then parameters.
    for (let n = 1; n <= 2 && path === 'failed' && !forceParameters; n++) {
      const r = svgAttempt(await callModel(env, model, messages, seed * 10 + n), n);
      attempts.push(r.attempt);
      if (r.attempt.ok) {
        path = n === 1 ? 'svg-attempt-1' : 'svg-attempt-2';
        final = r;
      }
    }
    let parameterPrompt = '';
    if (path === 'failed' && PARAMETER_RENDERERS[theme]) {
      const pm = buildParameterPrompt(selection);
      parameterPrompt = pm.map((m) => `[${m.role}]\n${m.content}`).join('\n\n');
      const r = parameterAttempt(await callModel(env, model, pm, seed * 10 + 3), theme);
      attempts.push(r.attempt);
      if (r.attempt.ok) {
        path = 'parameters';
        final = r;
      }
    }
    return json({
      model,
      theme,
      seed,
      selection,
      prompt,
      parameterPrompt,
      path,
      ok: path !== 'failed',
      svg: final.svg,
      title_en: final.title_en,
      title_es: final.title_es,
      attempts,
      calls: attempts.length,
      neurons: attempts.reduce((n, a) => n + (a.neurons ?? 0), 0),
      ms: attempts.reduce((n, a) => n + a.ms, 0),
    });
  },
};
