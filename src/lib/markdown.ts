/**
 * Tiny Markdown renderer for model messages in the build-session replay.
 * Pure and dependency-free. ALL input HTML is escaped first, so the output only contains tags emitted here.
 * Supported: paragraphs / line breaks, **bold**, *italic* / _italic_, `code`, fenced code, # headings
 * (rendered as <p class="mdh"> so the page outline keeps its own h1-h3), one-level lists,
 * http(s) links and simple pipe tables. Anything else stays literal text.
 */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const MARK = '\u0000';

/** Inline formatting over text that is ALREADY escaped. */
function inlineEscaped(s: string): string {
  const slots: string[] = [];
  const hold = (html: string) => `${MARK}${slots.push(html) - 1}${MARK}`;
  let t = s.replace(/`([^`\n]+)`/g, (_, c: string) => hold(`<code>${c}</code>`));
  t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s()]+)\)/g, (_, text: string, url: string) =>
    hold(`<a href="${url}" rel="nofollow noopener">${inlineEscaped(text)}</a>`),
  );
  t = t.replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/(^|[^\w])_(?=[^\s_])([^_\n]+?)(?<=[^\s_])_(?!\w)/g, '$1<em>$2</em>');
  const back = new RegExp(`${MARK}(\\d+)${MARK}`, 'g');
  return t.replace(back, (_, i: string) => slots[Number(i)]);
}

const inline = (s: string) => inlineEscaped(esc(s.split(MARK).join('')));

const FENCE = /^\s{0,3}```/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const ITEM = /^( {0,1})([-*]|\d+\.)\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[][] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join(' ')}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) {
      const li = list.items.map((it) => `<li>${it.map(inline).join('<br>')}</li>`).join('');
      out.push(`<${list.tag}>${li}</${list.tag}>`);
    }
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FENCE.test(line)) {
      flushPara();
      flushList();
      const code: string[] = [];
      for (i++; i < lines.length && !FENCE.test(lines[i]); i++) code.push(lines[i]);
      out.push(`<pre class="mdcode"><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const h = HEADING.exec(line);
    if (h) {
      flushPara();
      flushList();
      out.push(`<p class="mdh"><strong>${inline(h[1])}</strong></p>`);
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      flushPara();
      flushList();
      const head = cells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].includes('|') && lines[i].trim(); i++) rows.push(cells(lines[i]));
      i--;
      const th = head.map((c) => `<th>${inline(c)}</th>`).join('');
      const body = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }
    const m = ITEM.exec(line);
    if (m) {
      flushPara();
      const tag = /\d/.test(m[2]) ? 'ol' : 'ul';
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push([m[3]]);
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      // nested item or continuation: stays as indented text inside the current item
      list.items[list.items.length - 1].push(line.trim());
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join('');
}

const VOID = new Set(['br', 'hr', 'img']);

/**
 * Keep only the first `n` visible characters of trusted HTML (as produced by renderMarkdown):
 * entities count as one character, later nodes are dropped and open tags are closed.
 */
export function truncateHtml(html: string, n: number): string {
  if (n <= 0) return '';
  let out = '';
  let count = 0;
  const open: string[] = [];
  for (let i = 0; i < html.length && count < n; ) {
    const c = html[i];
    if (c === '<') {
      const end = html.indexOf('>', i);
      if (end < 0) break;
      const tag = html.slice(i, end + 1);
      out += tag;
      const name = /^<\/?([a-zA-Z0-9]+)/.exec(tag)?.[1].toLowerCase();
      if (name && !VOID.has(name)) {
        if (tag[1] === '/') open.pop();
        else open.push(name);
      }
      i = end + 1;
    } else if (c === '&') {
      const ent = /^&#?\w+;/.exec(html.slice(i, i + 12))?.[0] ?? '&';
      out += ent;
      i += ent.length;
      count++;
    } else {
      out += c;
      i++;
      count++;
    }
  }
  while (open.length) out += `</${open.pop()}>`;
  return out;
}
