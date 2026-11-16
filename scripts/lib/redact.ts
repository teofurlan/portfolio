// Redaction for the public build-session transcripts (BRIEF §5.3).
// Pure functions: the CLI in scripts/redact.ts does the file work.

export interface RedactContext {
  /** Machine hostname to hide (local runs only). */
  hostname?: string;
  /** OS username to hide when it appears as a whole word (local runs only). */
  username?: string;
  /** Extra literal strings to hide, e.g. private repo names. */
  literals?: string[];
  /** Literal strings replaced by a chosen text (e.g. a legal name by the public name). */
  replacements?: Record<string, string>;
  /** Home-relative path of this repo with forward slashes, e.g. `Code/portfolio`; its paths become repo-relative. */
  repo?: string;
}

interface Rule {
  name: string;
  pattern: RegExp;
  replace: string | ((match: string) => string);
}

// A path after `~`: separators `/`, `\`, `\\`; segments never contain quotes, spaces or `:`, and the
// match never ends with a backslash, so a JSON escape (`\"`) right after a path survives.
// Any run of backslashes: a path can be quoted once (`\\`) or twice (`\\\\`, e.g. a test literal in a transcript).
const SEP = String.raw`(?:\\+|\/)`;
const SEG = String.raw`[^\s"'\`<>|*?:\\/]+`;
const PATH = `${SEP}${SEG}(?:${SEP}${SEG})*`;
// What may sit right before a path: an ANSI colour code (ESC[34m) or a literal backslash escape (`\n` as
// two characters inside JSON-looking text) counts as a boundary even though its last letter is a word character.
const AFTER_ESCAPE = String.raw`(?<=\u001b\[[\d;]*m|\\[nrt])`;
const BEFORE_DRIVE = `(?:${AFTER_ESCAPE}|(?<![A-Za-z0-9]))`;
const BEFORE_ROOT = `(?:${AFTER_ESCAPE}|(?<![\\w/.~-]))`;
const BEFORE_TILDE = `(?:${AFTER_ESCAPE}|(?<![A-Za-z0-9~]))`;
// Environment variables that point into the home folder (a path must follow, a bare `$HOME` is fine).
const HOME_VAR = String.raw`(?:\$\{(?:env:)?(?:HOME|USERPROFILE|LOCALAPPDATA|APPDATA)\}|\$(?:env:)?(?:HOME|USERPROFILE|LOCALAPPDATA|APPDATA)(?![A-Za-z0-9_])|%(?:HOME|USERPROFILE|LOCALAPPDATA|APPDATA)%)`;
// URL-encoded separators (%5C, %2F) and segments (an encoded space `%20` stays inside a segment).
const ESEP = '(?:%5C|%2F)';
const ESEG = String.raw`(?:[^%\s"'\`&/\\]|%(?!5C|2F)[0-9A-F]{2})+`;

// Order matters: secrets first, then contact data, then paths and hosts.
const RULES: Rule[] = [
  { name: 'private-key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replace: '[REDACTED]' },
  { name: 'github-token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g, replace: '[REDACTED]' },
  { name: 'sk-key', pattern: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/g, replace: '[REDACTED]' },
  { name: 'aws-key', pattern: /\bAKIA[0-9A-Z]{16}\b/g, replace: '[REDACTED]' },
  { name: 'gitlab-token', pattern: /\bglpat-[A-Za-z0-9_-]{20,}/g, replace: '[REDACTED]' },
  { name: 'npm-token', pattern: /\bnpm_[A-Za-z0-9]{36}\b/g, replace: '[REDACTED]' },
  { name: 'hf-token', pattern: /\bhf_[A-Za-z0-9]{30,}\b/g, replace: '[REDACTED]' },
  { name: 'stripe-key', pattern: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/g, replace: '[REDACTED]' },
  { name: 'google-oauth', pattern: /\bya29\.[A-Za-z0-9_-]{20,}/g, replace: '[REDACTED]' },
  { name: 'url-credentials', pattern: /(\b[a-z][a-z0-9+.-]*:\/\/)(?!\[REDACTED\])[^\s/:@"'`]+:[^\s/@"'`]+@/gi, replace: '$1[REDACTED]@' },
  // Local dev servers (design canvas, previews) put an access token in the first path segment.
  {
    name: 'loopback-token',
    pattern: /(https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/)(?!\[REDACTED\])[A-Za-z0-9_-]{24,}(?=[/?#\s"'`)]|$)/g,
    replace: '$1[REDACTED]',
  },
  { name: 'google-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g, replace: '[REDACTED]' },
  { name: 'slack-token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, replace: '[REDACTED]' },
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, replace: '[REDACTED]' },
  { name: 'bearer', pattern: /\bBearer\s+(?!\[)[A-Za-z0-9._~+/=-]{16,}/g, replace: 'Bearer [REDACTED]' },
  {
    name: 'env-secret',
    pattern: /\b([A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*)(\s*[=:]\s*["']?)(?![$[<{])([^\s"'`]{8,})/g,
    replace: '$1$2[REDACTED]',
  },
  {
    name: 'quoted-secret',
    pattern: /(["']?\b(?:token|secret|password|passwd|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["'])(?!\[REDACTED\])([^"'\s]{8,})(["'])/gi,
    replace: '$1[REDACTED]$3',
  },
  { name: 'account-id', pattern: /(account[ _-]?id\W{0,5})[0-9a-f]{32}\b/gi, replace: '$1[REDACTED]' },
  { name: 'account-id', pattern: /(\/accounts\/)[0-9a-f]{32}\b/g, replace: '$1[REDACTED]' },
  { name: 'local-hostname', pattern: /(?<![.\w-])[A-Za-z0-9-]+\.(?:local|lan|internal|home\.arpa)\b/g, replace: '[host]' },
  // Also catches regex-escaped dots (`a@b\\.com`), truncated domains (`a@gmail.`) and bare webmail
  // domains (`a@gmail`) that show up in grep commands; the domain must start with a letter (not `astro@7.0.0`).
  {
    name: 'email',
    pattern: /[A-Za-z0-9._%+-]+@(?:[A-Za-z][A-Za-z0-9-]*(?:\\*\.[A-Za-z0-9-]*)+|(?:gmail|googlemail|outlook|hotmail|yahoo|icloud|proton|protonmail)\b)/g,
    replace: '[email]',
  },
  // Pi / Claude session folder names: the cwd with separators turned into dashes (`--C--Users-name-AppData-x--`).
  { name: 'session-folder', pattern: /-*[A-Za-z]--Users-[\w.-]*/gi, replace: '[local path]' },
  // URL-encoded home paths (`C%3A%5CUsers%5Cname%5Cx`).
  {
    name: 'home-path',
    pattern: new RegExp(`(?:${BEFORE_DRIVE}[A-Za-z]%3A${ESEP}|%2F)Users${ESEP}${ESEG}(?:${ESEP}${ESEG})*`, 'gi'),
    replace: '[local path]',
  },
  // WSL shares: `\\wsl$\Ubuntu\home\name`, `\\wsl.localhost\...`.
  { name: 'home-path', pattern: new RegExp(`(?:\\\\{2,}|//)wsl(?:\\$|\\.localhost)${SEP}[^\\\\/\\s"'\`]+${SEP}home${SEP}[^\\\\/\\s"'\`]+`, 'gi'), replace: '~' },
  { name: 'home-path', pattern: new RegExp(`${BEFORE_DRIVE}[A-Za-z]:(?:\\\\+|/)Users(?:\\\\+|/)[^\\\\/\\s"'\`:*?<>|]+`, 'gi'), replace: '~' },
  { name: 'home-path', pattern: new RegExp(`${BEFORE_ROOT}/(?:mnt/)?[a-z]/Users/[^/\\s"'\`]+`, 'gi'), replace: '~' },
  { name: 'home-path', pattern: new RegExp(`${BEFORE_ROOT}/(?:home|Users)/[^/\\s"'\`]+`, 'g'), replace: '~' },
  // `$HOME/x`, `%USERPROFILE%\x`: the folder becomes `~` too, so repo paths shorten and the rest is hidden.
  { name: 'home-path', pattern: new RegExp(`${HOME_VAR}(?=${SEP}${SEG})`, 'gi'), replace: '~' },
  // After the home folder became `~`: any other path on this machine is hidden whole (no file name).
  { name: 'local-path', pattern: new RegExp(`${BEFORE_TILDE}~${PATH}`, 'g'), replace: '[local path]' },
  { name: 'ipv4', pattern: /\b(?!127\.0\.0\.1\b)(?!0\.0\.0\.0\b)(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, replace: '[ip]' },
  { name: 'phone', pattern: /\+\d{1,3}(?:[ -]?\(?\d{1,4}\)?){3,6}/g, replace: '[phone]' },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function contextRules(ctx: RedactContext): Rule[] {
  const rules: Rule[] = [];
  // One pass over every replacement, longest first, so "Ana Pérez" wins over "Ana" and a
  // replacement's own text is never replaced again.
  const map = ctx.replacements ?? {};
  const froms = Object.keys(map).filter(Boolean).sort((a, b) => b.length - a.length);
  if (froms.length) rules.push({ name: 'literal', pattern: new RegExp(froms.map(escape).join('|'), 'g'), replace: (m) => map[m] });
  for (const literal of ctx.literals ?? []) {
    if (literal) rules.push({ name: 'literal', pattern: new RegExp(escape(literal), 'g'), replace: '[private]' });
  }
  if (ctx.hostname) rules.push({ name: 'hostname', pattern: new RegExp(`\\b${escape(ctx.hostname)}\\b`, 'g'), replace: '[host]' });
  if (ctx.username) rules.push({ name: 'username', pattern: new RegExp(`\\b${escape(ctx.username)}\\b`, 'g'), replace: '[user]' });
  return rules;
}

function repoRules(ctx: RedactContext): Rule[] {
  const parts = (ctx.repo ?? '').split(/[\\/]+/).filter(Boolean);
  if (!parts.length) return [];
  const root = `${BEFORE_TILDE}~${parts.map((p) => `${SEP}${escape(p)}`).join('')}`;
  return [
    { name: 'repo-path', pattern: new RegExp(`${root}${SEP}(${SEG}(?:${SEP}${SEG})*)`, 'g'), replace: '$1' },
    { name: 'repo-path', pattern: new RegExp(`${root}(?![\\w.-])`, 'g'), replace: '[repo]' },
  ];
}

function allRules(ctx: RedactContext): Rule[] {
  // Repo paths go before the generic local-path rule; context rules run after paths (so `~`
  // replaces the home folder first) and before IPs.
  const local = RULES.findIndex((r) => r.name === 'local-path');
  const at = RULES.findIndex((r) => r.name === 'ipv4');
  return [...RULES.slice(0, local), ...repoRules(ctx), ...RULES.slice(local, at), ...contextRules(ctx), ...RULES.slice(at)];
}

export function redactText(text: string, ctx: RedactContext = {}): string {
  let out = text;
  for (const rule of allRules(ctx)) out = out.replace(rule.pattern, rule.replace as string);
  return out;
}

/** Names of the rules that still match. Never returns the matched value. */
export function findLeaks(text: string, ctx: RedactContext = {}): string[] {
  const names = new Set<string>();
  for (const rule of allRules(ctx)) {
    rule.pattern.lastIndex = 0;
    for (const m of text.matchAll(rule.pattern)) {
      // A replacement that keeps a prefix (env-secret, bearer, account-id) is not a leak.
      if (!m[0].includes('[REDACTED]')) names.add(rule.name);
    }
  }
  return [...names];
}

function redactValue(value: unknown, ctx: RedactContext): unknown {
  if (typeof value === 'string') return redactText(value, ctx);
  if (Array.isArray(value)) return value.map((v) => redactValue(v, ctx));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactValue(v, ctx)]));
  }
  return value;
}

export type EventKind = 'user' | 'thinking' | 'text' | 'tool_call' | 'tool_result' | 'notice';

export interface PublicEvent {
  id: string;
  parentId: string | null;
  at: string;
  kind: EventKind;
  text: string;
  tool?: string;
  callId?: string;
  isError?: boolean;
  diff?: string;
  model?: string;
}

export interface PublicSession {
  id: string;
  startedAt: string;
  models: string[];
  /** Entries left out because they sit on an abandoned branch (a retried prompt). */
  abandoned: number;
  events: PublicEvent[];
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\n[… ${text.length - max} chars truncated]` : text;
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((c): c is { type: 'text'; text: string } => c?.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n');
}

// Custom messages worth showing: subagent results are part of the story; the rest is harness bookkeeping.
const SHOWN_NOTICES = new Set(['gentle-agents.result']);
// The harness also sends some notifications with the user role; they are not Teo's words.
const HARNESS_PREFIX = /^\[(?:System-generated|Harness note)[^\]]*\]/;

/** Ids on the path from the last entry back to the root: the conversation as it finally went. */
function activePath(entries: any[]): Set<string> {
  const byId = new Map(entries.filter((e) => e.id && e.type !== 'session').map((e) => [e.id, e]));
  const path = new Set<string>();
  let cur = [...byId.values()].at(-1);
  while (cur && !path.has(cur.id)) {
    path.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

/** Convert raw Pi session entries (JSONL v3) into a redacted public session. */
export function toPublic(entries: any[], ctx: RedactContext, opts: { maxChars?: number; hide?: string[] } = {}): PublicSession {
  const max = opts.maxChars ?? 6000;
  const hidden = new Set(opts.hide ?? []);
  const session = entries.find((e) => e.type === 'session');
  const models = new Set<string>();
  const events: PublicEvent[] = [];
  const path = activePath(entries);
  let abandoned = 0;

  for (const e of entries) {
    if (e.type === 'model_change' && e.modelId) models.add(e.modelId);
    if (e.type === 'session') continue;
    if (e.id && !path.has(e.id)) {
      abandoned++;
      continue;
    }
    const base = { parentId: e.parentId ?? null, at: e.timestamp };

    if (e.type === 'custom_message' && SHOWN_NOTICES.has(e.customType)) {
      events.push({ ...base, id: e.id, kind: 'notice', text: redactText(textOf(e.content), ctx) });
      continue;
    }
    if (e.type !== 'message') continue;
    const m = e.message ?? {};

    if (m.role === 'user') {
      const text = redactText(textOf(m.content), ctx);
      events.push({ ...base, id: e.id, kind: HARNESS_PREFIX.test(text) ? 'notice' : 'user', text });
    } else if (m.role === 'assistant') {
      if (m.model) models.add(m.model);
      (Array.isArray(m.content) ? m.content : []).forEach((c: any, i: number) => {
        const id = `${e.id}.${i}`;
        if (c.type === 'thinking' && c.thinking) events.push({ ...base, id, kind: 'thinking', text: redactText(c.thinking, ctx), model: m.model });
        else if (c.type === 'text' && c.text) events.push({ ...base, id, kind: 'text', text: redactText(c.text, ctx), model: m.model });
        else if (c.type === 'toolCall') {
          events.push({ ...base, id, kind: 'tool_call', tool: c.name, callId: c.id, text: JSON.stringify(redactValue(c.arguments ?? {}, ctx)) });
        }
      });
    } else if (m.role === 'toolResult' && hidden.has(e.id)) {
      // Private tool output (e.g. a folder listing): keep that the step happened, not what it showed.
      events.push({ ...base, id: e.id, kind: 'tool_result', tool: m.toolName, callId: m.toolCallId, isError: Boolean(m.isError), text: '[private listing]' });
    } else if (m.role === 'toolResult') {
      const diff = typeof m.details?.diff === 'string' ? truncate(redactText(m.details.diff, ctx), max) : undefined;
      events.push({
        ...base,
        id: e.id,
        kind: 'tool_result',
        tool: m.toolName,
        callId: m.toolCallId,
        isError: Boolean(m.isError),
        text: truncate(redactText(textOf(m.content), ctx), max),
        ...(diff !== undefined ? { diff } : {}),
      });
    }
  }

  return { id: session?.id ?? '', startedAt: session?.timestamp ?? '', models: [...models], abandoned, events };
}
