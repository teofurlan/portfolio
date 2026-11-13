// Copy this repo's Pi session transcripts into transcripts/raw/ (git-ignored). Never deletes:
// a file already copied is only overwritten when the source has grown (the session went on).
// Usage: node scripts/collect-sessions.ts [--from <dir>]
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Pi names a project's session folder after its cwd: C:\a\b -> --C--a-b-- */
export function sessionFolderName(cwd: string): string {
  return `--${cwd.replace(/[:\\/]/g, '-').replace(/^-+|-+$/g, '')}--`;
}

const args = process.argv.slice(2);
const i = args.indexOf('--from');
const from = i >= 0 ? args[i + 1] : join(homedir(), '.pi', 'agent', 'sessions', sessionFolderName(process.cwd()));
const to = 'transcripts/raw';

if (!existsSync(from)) {
  console.error(`collect-sessions: no session folder at ${from}`);
  process.exit(1);
}
mkdirSync(to, { recursive: true });
let copied = 0;
for (const f of readdirSync(from).filter((n) => n.endsWith('.jsonl'))) {
  const src = join(from, f);
  const dst = join(to, f);
  if (!existsSync(dst) || statSync(src).size > statSync(dst).size) {
    copyFileSync(src, dst);
    copied++;
  }
}
console.log(`collect-sessions: ${copied} file(s) copied or updated in ${to}`);
