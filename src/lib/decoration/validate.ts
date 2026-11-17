/**
 * Strict SVG validator/sanitizer for the daily decoration (P5 / S10).
 * Pure (no DOM, no Node APIs) so the cron Worker can reuse it.
 *
 * Approach: tokenize with a small tolerant scanner, then rebuild the SVG only from
 * allowlisted elements and attributes with validated values. Anything unexpected is an
 * error (never silently passed through), and the output is the rebuilt string, not the input.
 */

export const INK = '#1d2c47';
export const ACCENT = '#a62f08';
export const VIEWBOX = '0 0 200 120';
export const CANVAS_W = 200;
export const CANVAS_H = 120;
export const MAX_BYTES = 8192;
export const MIN_ELEMENTS = 5;
export const MAX_ELEMENTS = 120;
export const TOLERANCE = 5;
export const MAX_TITLE = 48;

export interface SvgResult {
  ok: boolean;
  svg: string;
  errors: string[];
}

const DRAWABLE = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect']);
const ELEMENTS = new Set(['svg', 'g', ...DRAWABLE]);

const GEOMETRY_ATTRS = new Set([
  'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points',
]);
const STYLE_ATTRS = new Set([
  'stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  svg: new Set(['xmlns', 'viewBox', 'width', 'height', ...STYLE_ATTRS]),
  g: new Set([...STYLE_ATTRS]),
  path: new Set(['d', ...STYLE_ATTRS]),
  line: new Set(['x1', 'y1', 'x2', 'y2', ...STYLE_ATTRS]),
  polyline: new Set(['points', ...STYLE_ATTRS]),
  polygon: new Set(['points', ...STYLE_ATTRS]),
  circle: new Set(['cx', 'cy', 'r', ...STYLE_ATTRS]),
  ellipse: new Set(['cx', 'cy', 'rx', 'ry', ...STYLE_ATTRS]),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'ry', ...STYLE_ATTRS]),
};

const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
const NUM_G = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

const byteLength = (s: string): number => {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  return n;
};

const escAttr = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

interface Tag {
  name: string;
  attrs: [string, string][];
  closing: boolean;
  selfClosing: boolean;
}

const TAG_RE = /<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[^\s=/>"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/y;
const ATTR_RE = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;

function tokenize(src: string, errors: string[]): Tag[] {
  const tags: Tag[] = [];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      if (src.slice(i).trim()) errors.push('text content outside tags is not allowed');
      break;
    }
    if (src.slice(i, lt).trim()) errors.push('text content is not allowed');
    TAG_RE.lastIndex = lt;
    const m = TAG_RE.exec(src);
    if (!m) {
      errors.push(`malformed or forbidden markup near "${src.slice(lt, lt + 24).replace(/\s+/g, ' ')}"`);
      return tags;
    }
    const attrs: [string, string][] = [];
    for (const a of m[3]!.matchAll(ATTR_RE)) attrs.push([a[1]!, a[2] ?? a[3] ?? '']);
    tags.push({ name: m[2]!, attrs, closing: m[1] === '/', selfClosing: m[4] === '/' });
    i = lt + m[0].length;
  }
  return tags;
}

function parseNumber(v: string, label: string, errors: string[]): number | null {
  const t = v.trim();
  if (!NUM.test(t)) {
    errors.push(`${label} is not a plain number`);
    return null;
  }
  return Number(t);
}

const inX = (n: number) => n >= -TOLERANCE && n <= CANVAS_W + TOLERANCE;
const inY = (n: number) => n >= -TOLERANCE && n <= CANVAS_H + TOLERANCE;

function checkPoint(x: number, y: number, el: string, errors: string[]): void {
  if (!inX(x) || !inY(y)) errors.push(`<${el}> has a coordinate outside the canvas (${round(x)}, ${round(y)})`);
}
const round = (n: number) => Math.round(n * 100) / 100;

/** Walk an SVG path `d` string; checks syntax and that every point is inside the canvas. */
function checkPath(d: string, errors: string[]): void {
  const argc: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  let first = true;
  let steps = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i]!)) i++;
  };
  const num = (): number | null => {
    skip();
    NUM_G.lastIndex = i;
    const m = NUM_G.exec(d);
    if (!m || m.index !== i) return null;
    i += m[0].length;
    return Number(m[0]);
  };
  const flag = (): number | null => {
    skip();
    const c = d[i];
    if (c === '0' || c === '1') {
      i++;
      return Number(c);
    }
    return null;
  };
  while (true) {
    skip();
    if (i >= d.length) break;
    if (++steps > 2000) return void errors.push('path is too long');
    const ch = d[i]!;
    if (/[A-Za-z]/.test(ch)) {
      if (!(ch.toLowerCase() in argc)) return void errors.push(`path command "${ch}" is not allowed`);
      cmd = ch;
      i++;
      if (first && ch !== 'M' && ch !== 'm') return void errors.push('path must start with M');
      first = false;
      if (ch === 'z' || ch === 'Z') {
        cx = sx;
        cy = sy;
        continue;
      }
    } else if (!cmd || cmd === 'z' || cmd === 'Z') {
      return void errors.push('path syntax error');
    } else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    const rel = cmd === cmd.toLowerCase();
    const k = argc[cmd.toLowerCase()]!;
    const args: number[] = [];
    for (let n = 0; n < k; n++) {
      const isFlag = cmd.toLowerCase() === 'a' && (n === 3 || n === 4);
      const v = isFlag ? flag() : num();
      if (v === null) return void errors.push('path syntax error');
      args.push(v);
    }
    const lc = cmd.toLowerCase();
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    if (lc === 'h') {
      cx = args[0]! + ox;
      checkPoint(cx, cy, 'path', errors);
    } else if (lc === 'v') {
      cy = args[0]! + oy;
      checkPoint(cx, cy, 'path', errors);
    } else {
      // control points (c, s, q) then end point
      for (let n = 0; n + 1 < args.length - (lc === 'a' ? 0 : 0); n += 2) {
        if (lc === 'a') break;
        checkPoint(args[n]! + ox, args[n + 1]! + oy, 'path', errors);
      }
      if (lc === 'a') {
        if (args[0]! < 0 || args[1]! < 0 || args[0]! > 400 || args[1]! > 400) errors.push('path arc radius out of range');
      }
      cx = args[k - 2]! + ox;
      cy = args[k - 1]! + oy;
      checkPoint(cx, cy, 'path', errors);
    }
    if (lc === 'm') {
      sx = cx;
      sy = cy;
    }
    if (errors.length > 20) return;
  }
  if (first) errors.push('path is empty');
}

function checkPoints(v: string, el: string, errors: string[]): void {
  const parts = v.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length < 4 || parts.length % 2 || parts.length > 480 || !parts.every((p) => NUM.test(p))) {
    errors.push(`<${el}> points are malformed`);
    return;
  }
  for (let i = 0; i < parts.length; i += 2) checkPoint(Number(parts[i]), Number(parts[i + 1]), el, errors);
}

function normColor(v: string, attr: string, errors: string[]): string | null {
  const t = v.trim().toLowerCase();
  if (attr === 'fill') {
    if (t === 'none') return 'none';
    errors.push(`fill must be "none" (got "${v.slice(0, 30)}")`);
    return null;
  }
  if (t === INK || t === 'currentcolor') return INK;
  if (t === ACCENT) return ACCENT;
  if (t === 'none') return 'none';
  errors.push(`stroke colour "${v.slice(0, 30)}" is not ink ${INK} or accent ${ACCENT}`);
  return null;
}

function normStyleAttr(attr: string, v: string, errors: string[]): string | null {
  switch (attr) {
    case 'stroke':
    case 'fill':
      return normColor(v, attr, errors);
    case 'stroke-width': {
      const n = parseNumber(v, 'stroke-width', errors);
      if (n === null) return null;
      if (n < 0.1 || n > 4) {
        errors.push('stroke-width must be between 0.1 and 4');
        return null;
      }
      return String(n);
    }
    case 'stroke-linecap':
      if (['butt', 'round', 'square'].includes(v.trim())) return v.trim();
      errors.push('invalid stroke-linecap');
      return null;
    case 'stroke-linejoin':
      if (['miter', 'round', 'bevel'].includes(v.trim())) return v.trim();
      errors.push('invalid stroke-linejoin');
      return null;
    case 'stroke-dasharray': {
      const parts = v.trim().split(/[\s,]+/).filter(Boolean);
      if (parts.length && parts.length <= 8 && parts.every((p) => NUM.test(p))) return parts.join(' ');
      errors.push('invalid stroke-dasharray');
      return null;
    }
  }
  return null;
}

export function validateSvg(input: string): SvgResult {
  const errors: string[] = [];
  const fail = (): SvgResult => ({ ok: false, svg: '', errors });
  if (typeof input !== 'string' || !input.trim()) {
    errors.push('empty input');
    return fail();
  }
  if (byteLength(input) > MAX_BYTES) errors.push(`svg is larger than ${MAX_BYTES} bytes`);

  // Comments and an XML prolog are harmless noise: drop them. Anything else starting with
  // "<!" or "<?" (DOCTYPE, CDATA, processing instructions) is rejected by the tokenizer.
  const src = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*<\?xml[^>]*\?>/i, '')
    .trim();

  const tags = tokenize(src, errors);
  if (errors.length) return fail();
  if (!tags.length || tags[0]!.name !== 'svg' || tags[0]!.closing) {
    errors.push('root element must be <svg>');
    return fail();
  }

  const stack: string[] = [];
  const out: string[] = [];
  let drawable = 0;
  let rootDone = false;
  let rootAttrs: Record<string, string> = {};
  const rootIndex = 0;

  for (let t = 0; t < tags.length; t++) {
    const tag = tags[t]!;
    if (rootDone) {
      errors.push('content after the root element');
      break;
    }
    if (!ELEMENTS.has(tag.name)) {
      errors.push(`element <${tag.name}> is not allowed`);
      continue;
    }
    if (tag.closing) {
      if (stack.pop() !== tag.name) errors.push(`unbalanced </${tag.name}>`);
      else out.push(`</${tag.name}>`);
      if (!stack.length) rootDone = true;
      continue;
    }
    if (t !== rootIndex && tag.name === 'svg') {
      errors.push('nested <svg> is not allowed');
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag.name]!;
    const seen = new Set<string>();
    const attrs: Record<string, string> = {};
    for (const [name, value] of tag.attrs) {
      if (!allowed.has(name)) {
        errors.push(`attribute "${name}" is not allowed on <${tag.name}>`);
        continue;
      }
      if (seen.has(name)) {
        errors.push(`duplicate attribute "${name}" on <${tag.name}>`);
        continue;
      }
      seen.add(name);
      if (/[&<]/.test(value) || /javascript:|data:|url\s*\(/i.test(value)) {
        errors.push(`attribute "${name}" has a forbidden value`);
        continue;
      }
      attrs[name] = value;
    }

    const emitted: [string, string][] = [];
    for (const [name, value] of Object.entries(attrs)) {
      if (STYLE_ATTRS.has(name)) {
        const n = normStyleAttr(name, value, errors);
        if (n !== null) emitted.push([name, n]);
      } else if (GEOMETRY_ATTRS.has(name)) {
        if (name === 'd') {
          if (value.length > MAX_BYTES) errors.push('path data too long');
          else checkPath(value, errors);
          emitted.push([name, value.trim().replace(/\s+/g, ' ')]);
        } else if (name === 'points') {
          checkPoints(value, tag.name, errors);
          emitted.push([name, value.trim().replace(/\s+/g, ' ')]);
        } else if (tag.name !== 'svg') {
          const n = parseNumber(value, `${name} on <${tag.name}>`, errors);
          if (n !== null) {
            const horizontal = ['x', 'x1', 'x2', 'cx'].includes(name);
            const vertical = ['y', 'y1', 'y2', 'cy'].includes(name);
            if (horizontal && !inX(n)) errors.push(`<${tag.name}> ${name}=${n} is outside the canvas`);
            if (vertical && !inY(n)) errors.push(`<${tag.name}> ${name}=${n} is outside the canvas`);
            if (!horizontal && !vertical && (n < 0 || n > 400)) errors.push(`<${tag.name}> ${name}=${n} is out of range`);
            emitted.push([name, String(n)]);
          }
        }
      }
    }

    if (tag.name === 'svg') {
      if (attrs['viewBox']?.trim().replace(/[\s,]+/g, ' ') !== VIEWBOX) errors.push(`viewBox must be "${VIEWBOX}"`);
      if (attrs['xmlns'] !== undefined && attrs['xmlns'] !== 'http://www.w3.org/2000/svg') errors.push('invalid xmlns');
      rootAttrs = Object.fromEntries(emitted);
    } else if (DRAWABLE.has(tag.name)) {
      drawable++;
      // Extent checks for shapes defined by centre/size.
      const n = (k: string) => (attrs[k] !== undefined && NUM.test(attrs[k]!.trim()) ? Number(attrs[k]) : undefined);
      if (tag.name === 'circle' || tag.name === 'ellipse') {
        const rx = n(tag.name === 'circle' ? 'r' : 'rx');
        const ry = n(tag.name === 'circle' ? 'r' : 'ry');
        const cx = n('cx') ?? 0;
        const cy = n('cy') ?? 0;
        if (rx === undefined || ry === undefined) errors.push(`<${tag.name}> needs a radius`);
        else if (!inX(cx - rx) || !inX(cx + rx) || !inY(cy - ry) || !inY(cy + ry)) errors.push(`<${tag.name}> extends outside the canvas`);
      }
      if (tag.name === 'rect') {
        const w = n('width');
        const h = n('height');
        if (w === undefined || h === undefined) errors.push('<rect> needs width and height');
        else if (!inX((n('x') ?? 0) + w) || !inY((n('y') ?? 0) + h)) errors.push('<rect> extends outside the canvas');
      }
      if (tag.name === 'line' && ['x1', 'y1', 'x2', 'y2'].some((k) => n(k) === undefined)) errors.push('<line> needs x1 y1 x2 y2');
      if (tag.name === 'path' && attrs['d'] === undefined) errors.push('<path> needs d');
      if ((tag.name === 'polyline' || tag.name === 'polygon') && attrs['points'] === undefined) errors.push(`<${tag.name}> needs points`);
    }

    if (tag.name === 'svg') {
      // Root is rebuilt below once drawing is known; reserve the slot.
      out.push('\u0000ROOT\u0000');
    } else {
      const attrStr = emitted.map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
      out.push(tag.selfClosing ? `<${tag.name}${attrStr}/>` : `<${tag.name}${attrStr}>`);
    }
    if (!tag.selfClosing) stack.push(tag.name);
    else if (!stack.length) rootDone = true;
  }

  if (stack.length) errors.push('unclosed element(s)');
  if (drawable < MIN_ELEMENTS) errors.push(`needs at least ${MIN_ELEMENTS} drawable elements (found ${drawable})`);
  if (drawable > MAX_ELEMENTS) errors.push(`at most ${MAX_ELEMENTS} drawable elements allowed (found ${drawable})`);
  if (errors.length) return fail();

  const stroke = rootAttrs['stroke'] ?? INK;
  const root =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none" stroke="${stroke}"` +
    ` stroke-width="${rootAttrs['stroke-width'] ?? '1'}" stroke-linecap="${rootAttrs['stroke-linecap'] ?? 'round'}"` +
    ` stroke-linejoin="${rootAttrs['stroke-linejoin'] ?? 'round'}">`;
  const svg = out.join('').replace('\u0000ROOT\u0000', root);
  if (byteLength(svg) > MAX_BYTES) return { ok: false, svg: '', errors: [`svg is larger than ${MAX_BYTES} bytes`] };
  return { ok: true, svg, errors: [] };
}

export type TitleResult = { ok: true; title: string } | { ok: false; error: string };

export function validateTitle(input: unknown): TitleResult {
  if (typeof input !== 'string') return { ok: false, error: 'title is not a string' };
  const title = input.trim();
  if (!title) return { ok: false, error: 'title is empty' };
  if ([...title].length > MAX_TITLE) return { ok: false, error: `title is longer than ${MAX_TITLE} characters` };
  if (/[<>&]/.test(title)) return { ok: false, error: 'title must be plain text (no < > &)' };
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(title)) return { ok: false, error: 'title has control characters or line breaks' };
  return { ok: true, title };
}

export interface Envelope {
  title_en: string;
  title_es: string;
  svg: string;
}

/** Pull `{title_en,title_es,svg}` out of a model reply: plain JSON, fenced JSON, or sloppy JSON. */
export function extractEnvelope(raw: string): Envelope | null {
  if (typeof raw !== 'string') return null;
  const candidates = [raw.trim()];
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1]!.trim());
  const a = raw.indexOf('{');
  const b = raw.lastIndexOf('}');
  if (a !== -1 && b > a) candidates.push(raw.slice(a, b + 1));
  for (const c of candidates) {
    try {
      const o = JSON.parse(c) as Record<string, unknown>;
      if (o && typeof o === 'object' && typeof o['svg'] === 'string') {
        return {
          title_en: typeof o['title_en'] === 'string' ? o['title_en'] : '',
          title_es: typeof o['title_es'] === 'string' ? o['title_es'] : '',
          svg: o['svg'],
        };
      }
    } catch {
      /* try next */
    }
  }
  // Sloppy JSON (raw newlines or quotes inside the svg string): scrape the fields.
  const svg = raw.match(/<svg[\s\S]*?<\/svg>/i)?.[0];
  if (!svg) return null;
  const field = (k: string) => raw.match(new RegExp(`"${k}"\\s*:\\s*"([^"\\n]*)"`))?.[1] ?? '';
  return { title_en: field('title_en'), title_es: field('title_es'), svg };
}
