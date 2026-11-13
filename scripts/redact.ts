// Usage:
//   node scripts/redact.ts            redact transcripts/raw/*.jsonl -> transcripts/public/*.json, then check
//   node scripts/redact.ts --check    only check transcripts/public (runs before every build)
// Options: --raw <dir>, --public <dir>, --config <file>. Literals to hide ({ "literals": ["..."] }):
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
const readLiterals = (file: string): string[] => (existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).literals ?? []) : []);
const literals = [...readLiterals(opt('--config', 'transcripts/redact.config.json')), ...readLiterals('transcripts/redact.local.json')];

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
  // CI has no local hostname/username to look for; generic rules and literals still apply.
  process.exit(check({ literals }));
}

const ctx: RedactContext = { hostname: hostname(), username: userInfo().username, literals };
mkdirSync(publicDir, { recursive: true });
for (const f of readdirSync(rawDir).filter((n) => n.endsWith('.jsonl')).sort()) {
  const entries = readFileSync(join(rawDir, f), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const pub = toPublic(entries, ctx);
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
