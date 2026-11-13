// Usage:
//   node scripts/redact.ts            redact transcripts/raw/*.jsonl -> transcripts/public/*.json, then check
//   node scripts/redact.ts --check    only check transcripts/public (runs before every build)
// Options: --raw <dir>, --public <dir>, --config <file>. Config: { "literals": [...] -> [private],
// "replacements": { "from": "to" }, "hideEvents": [tool result ids -> [private listing]] }, read from
// transcripts/redact.config.json (committed, e.g. private repo names) plus the optional
// transcripts/redact.local.json (git-ignored). Exit 1 if any secret pattern remains; values are never printed.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, userInfo } from 'node:os';
import { basename, join } from 'node:path';
import { findLeaks, redactText, toPublic, type RedactContext } from './lib/redact.ts';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const rawDir = opt('--raw', 'transcripts/raw');
const publicDir = opt('--public', 'transcripts/public');
interface Config { literals?: string[]; replacements?: Record<string, string>; hideEvents?: string[] }
const readConfig = (file: string): Config => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {});
// Committed config (enforced on CI too) + git-ignored local config for values that must not be committed.
const configs = [readConfig(opt('--config', 'transcripts/redact.config.json')), readConfig('transcripts/redact.local.json')];
const literals = configs.flatMap((c) => c.literals ?? []);
const replacements = Object.assign({}, ...configs.map((c) => c.replacements ?? {})) as Record<string, string>;
const hide = configs.flatMap((c) => c.hideEvents ?? []);

function check(ctx: RedactContext): number {
  if (!existsSync(publicDir)) {
    console.log(`redact: ${publicDir} does not exist, nothing to check`);
    return 0;
  }
  const files = readdirSync(publicDir).filter((f) => f.endsWith('.json'));
  let failed = 0;
  for (const f of files) {
    const leaks = findLeaks(readFileSync(join(publicDir, f), 'utf8'), ctx);
    if (leaks.length) {
      failed++;
      console.error(`redact: ${join(publicDir, f)} still matches: ${leaks.join(', ')}`);
    }
  }
  if (failed) return 1;
  console.log(`redact: ${files.length} public transcript(s) clean`);
  return 0;
}

if (args.includes('--check')) {
  // On CI the hostname and username belong to the runner (e.g. "runner"), so only generic rules and
  // literals apply there; locally the check also looks for this machine's hostname and username.
  process.exit(check(process.env.CI ? { literals, replacements } : { hostname: hostname(), username: userInfo().username, literals, replacements }));
}

const ctx: RedactContext = { hostname: hostname(), username: userInfo().username, literals, replacements };
mkdirSync(publicDir, { recursive: true });
for (const f of readdirSync(rawDir).filter((n) => n.endsWith('.jsonl')).sort()) {
  const entries = readFileSync(join(rawDir, f), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const pub = toPublic(entries, ctx, { hide });
  const out = join(publicDir, `${pub.startedAt.slice(0, 10)}-${pub.id.slice(0, 8)}.json`);
  writeFileSync(out, `${JSON.stringify(pub, null, 1)}\n`);
  console.log(`redact: ${basename(f)} -> ${out} (${pub.events.length} events)`);
}
// Translations are written from already-redacted text, but new rules (or literals) must reach them too.
const translations = join(publicDir, '_translations.json');
if (existsSync(translations)) {
  const data: Record<string, { text: string }> = JSON.parse(readFileSync(translations, 'utf8'));
  for (const entry of Object.values(data)) entry.text = redactText(entry.text, ctx);
  writeFileSync(translations, `${JSON.stringify(data, null, 1)}\n`);
}
process.exit(check(ctx));
