import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLeaks, redactText, toPublic, type RedactContext } from './redact.ts';

const ctx: RedactContext = { hostname: 'Nitro', username: 'teofu', literals: ['secret-repo-name'] };

// Fake values only; built by concatenation so this file itself holds no scannable secret.
const fake = {
  github: 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8',
  openai: 'sk-' + 'proj-abcdefghijklmnopqrstuvwxyz012345',
  aws: 'AKIA' + 'ABCDEFGHIJKLMNOP',
  jwt: 'eyJ' + 'hbGciOiJIUzI1NiJ9.eyJ' + 'zdWIiOiIxIn0.abcdefghijklmnop',
  key: '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXk\n-----END OPENSSH PRIVATE KEY-----',
};

describe('redactText', () => {
  it.each([
    ['GitHub token', `token ${fake.github} here`],
    ['sk- key', `key=${fake.openai}`],
    ['AWS key', `id ${fake.aws}`],
    ['JWT', `jwt ${fake.jwt}`],
    ['private key block', fake.key],
    ['Bearer token', 'Authorization: Bearer abcdefghijklmnop0123456789'],
    ['env-style secret assignment', 'CLOUDFLARE_API_TOKEN=abcDEF123456ghiJKL789'],
    ['account id', 'Account ID: 0123456789abcdef0123456789abcdef'],
  ])('removes a %s and leaves no leak', (_name, input) => {
    const out = redactText(input, ctx);
    expect(out).toContain('[REDACTED]');
    expect(findLeaks(out, ctx)).toEqual([]);
  });

  it.each([
    ['GitLab token', 'glpat-' + 'abcdefghijklmnopqrst', '[REDACTED]'],
    ['npm token', 'npm_' + 'abcdefghijklmnopqrstuvwxyz0123456789', '[REDACTED]'],
    ['Hugging Face token', 'hf_' + 'abcdefghijklmnopqrstuvwxyz0123', '[REDACTED]'],
    ['Stripe-style key', 'sk_live_' + 'abcdefghijklmnop1234', '[REDACTED]'],
    ['Google OAuth token', 'ya29.' + 'a0AfH6SMBabcdefghijklmnop', '[REDACTED]'],
    ['lowercase JSON secret', '"token": "abc123def456ghi789"', '"token": "[REDACTED]"'],
    ['lowercase assignment', "password='hunter2hunter2x'", "password='[REDACTED]'"],
    ['account id in a URL', '/client/v4/accounts/0123456789abcdef0123456789abcdef/workers', '/client/v4/accounts/[REDACTED]/workers'],
    ['URL credentials', 'https://alice:s3cretpass@example.org/x', 'https://[REDACTED]@example.org/x'],
    ['loopback URL token', 'open http://127.0.0.1:2401/RsSIabcdefghijklmnopqrstuvwxyz12/d/x/', 'open http://127.0.0.1:2401/[REDACTED]/d/x/'],
    ['local hostname', 'ssh pi@robot.local', 'ssh pi@[host]'],
  ])('removes a %s', (_name, input, expected) => {
    const out = redactText(input, ctx);
    expect(out).toBe(expected);
    expect(findLeaks(out, ctx)).toEqual([]);
    expect(findLeaks(input, ctx).length).toBeGreaterThan(0);
  });

  it('does not treat ordinary short or code values as secrets', () => {
    const text = '"token": "string", password: process.env.PASSWORD, http://localhost:4321/build-session/';
    expect(redactText(text, ctx)).toBe(text);
  });

  it('keeps the variable name of an env-style secret', () => {
    expect(redactText('CLOUDFLARE_API_TOKEN=abcDEF123456ghiJKL789', ctx)).toBe('CLOUDFLARE_API_TOKEN=[REDACTED]');
  });

  it('replaces emails', () => {
    expect(redactText('write to someone.name+x@example.com now', ctx)).toBe('write to [email] now');
  });

  it.each([
    ['regex-escaped', 'grep "someone@example\\\\.com"', 'grep "[email]"'],
    ['truncated', '"someone@example. 152x34"', '"[email] 152x34"'],
  ])('replaces %s emails', (_name, input, expected) => {
    expect(redactText(input, ctx)).toBe(expected);
    expect(findLeaks(expected, ctx)).toEqual([]);
  });

  it('does not treat scoped packages or versions as emails', () => {
    const text = 'node_modules/@astrojs/cloudflare and pnpm@11';
    expect(redactText(text, ctx)).toBe(text);
  });

  it.each([
    ['C:\\Users\\teofu\\Code\\portfolio\\src', '~\\Code\\portfolio\\src'],
    ['C:/Users/teofu/Code/portfolio', '~/Code/portfolio'],
    ['C:\\\\Users\\\\teofu\\\\Code', '~\\\\Code'],
    ['/c/Users/teofu/Code/portfolio', '~/Code/portfolio'],
    ['/home/alice/project', '~/project'],
  ])('shortens the home path %s', (input, expected) => {
    expect(redactText(input, ctx)).toBe(expected);
  });

  it('replaces IPv4 addresses but keeps loopback', () => {
    expect(redactText('host 192.168.1.20 and 127.0.0.1', ctx)).toBe('host [ip] and 127.0.0.1');
  });

  it('replaces the machine hostname, the OS username and configured literals', () => {
    expect(redactText('teofu@Nitro in secret-repo-name', ctx)).toBe('[user]@[host] in [private]');
  });

  it('does not touch words that only contain the username', () => {
    expect(redactText('https://teofurlan.com', ctx)).toBe('https://teofurlan.com');
  });

  it('replaces phone numbers', () => {
    expect(redactText('call +54 9 11 1234-5678', ctx)).toBe('call [phone]');
  });

  it('leaves ordinary text alone', () => {
    const text = 'pnpm add astro@7.0.0 and run `pnpm test` (73/73).';
    expect(redactText(text, ctx)).toBe(text);
  });
});

describe('findLeaks', () => {
  it('names the rules that match without returning the value', () => {
    const leaks = findLeaks(`x ${fake.github} y someone@example.com`, ctx);
    expect(leaks).toEqual(expect.arrayContaining(['github-token', 'email']));
    expect(JSON.stringify(leaks)).not.toContain(fake.github);
  });
});

describe('toPublic', () => {
  const entries = [
    { type: 'session', version: 3, id: 's1', timestamp: '2026-11-10T19:21:21.233Z', cwd: 'C:\\Users\\teofu\\Code\\portfolio' },
    { type: 'model_change', id: 'm', parentId: null, timestamp: '2026-11-10T19:21:32.975Z', provider: 'p', modelId: 'claude-opus-5-5' },
    { type: 'message', id: 'a', parentId: 'm', timestamp: '2026-11-10T19:22:00.000Z', message: { role: 'system', content: 'SYSTEM PROMPT' } },
    { type: 'message', id: 'b', parentId: 'a', timestamp: '2026-11-10T19:23:00.000Z', message: { role: 'user', content: [{ type: 'text', text: 'Hola, mi mail es someone@example.com' }] } },
    {
      type: 'message', id: 'c', parentId: 'b', timestamp: '2026-11-10T19:24:00.000Z',
      message: {
        role: 'assistant', model: 'claude-opus-5-5',
        content: [
          { type: 'thinking', thinking: 'plan', thinkingSignature: 'SIGNATURE' },
          { type: 'text', text: 'Reading.' },
          { type: 'toolCall', id: 't1', name: 'read', arguments: { path: 'C:\\Users\\teofu\\Code\\portfolio\\BRIEF.md' } },
        ],
      },
    },
    { type: 'message', id: 'd', parentId: 'c', timestamp: '2026-11-10T19:25:00.000Z', message: { role: 'toolResult', toolCallId: 't1', toolName: 'read', isError: false, content: [{ type: 'text', text: 'x'.repeat(50) }], details: { diff: '+a' } } },
    { type: 'custom', id: 'e', parentId: 'd', timestamp: '2026-11-10T19:26:00.000Z', customType: 'gentle-pi.session-change/v1', data: {} },
  ];
  const pub = toPublic(entries, ctx, { maxChars: 20 });

  it('keeps session metadata without the local cwd', () => {
    expect(pub.id).toBe('s1');
    expect(pub.startedAt).toBe('2026-11-10T19:21:21.233Z');
    expect(pub.models).toEqual(['claude-opus-5-5']);
    expect(JSON.stringify(pub)).not.toContain('Users');
  });

  it('drops the system prompt, signatures and harness bookkeeping', () => {
    const s = JSON.stringify(pub);
    expect(s).not.toContain('SYSTEM PROMPT');
    expect(s).not.toContain('SIGNATURE');
    expect(s).not.toContain('session-change');
  });

  it('emits ordered events with redacted user text and truncated tool output', () => {
    expect(pub.events.map((e) => e.kind)).toEqual(['user', 'thinking', 'text', 'tool_call', 'tool_result']);
    expect(pub.events[0].text).toBe('Hola, mi mail es [email]');
    expect(pub.events[3]).toMatchObject({ tool: 'read', callId: 't1' });
    expect(pub.events[3].text).toContain('~\\\\Code');
    expect(pub.events[4].text).toBe('x'.repeat(20) + '\n[… 30 chars truncated]');
    expect(pub.events[4].diff).toBe('+a');
    expect(findLeaks(JSON.stringify(pub), ctx)).toEqual([]);
  });
});

describe('redact CLI --check', () => {
  const run = (dir: string) =>
    spawnSync(process.execPath, ['scripts/redact.ts', '--check', '--public', dir], { encoding: 'utf8' });

  it('exits 0 when the public transcripts are clean', () => {
    const dir = mkdtempSync(join(tmpdir(), 'redact-ok-'));
    writeFileSync(join(dir, 'a.json'), JSON.stringify({ events: [{ text: 'hola' }] }));
    const r = run(dir);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });

  it('fails when a literal from the committed config (private repo) remains, and passes once it is hidden', () => {
    const dir = mkdtempSync(join(tmpdir(), 'redact-lit-'));
    const config = join(dir, 'config.json');
    writeFileSync(config, JSON.stringify({ literals: ['teofurlan/private-thing'] }));
    const pub = join(dir, 'public');
    mkdirSync(pub);
    writeFileSync(join(pub, 'c.json'), JSON.stringify({ events: [{ text: 'see github.com/teofurlan/private-thing' }] }));
    const bad = spawnSync(process.execPath, ['scripts/redact.ts', '--check', '--public', pub, '--config', config], { encoding: 'utf8' });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('literal');
    writeFileSync(join(pub, 'c.json'), JSON.stringify({ events: [{ text: 'see github.com/[private]' }] }));
    const ok = spawnSync(process.execPath, ['scripts/redact.ts', '--check', '--public', pub, '--config', config], { encoding: 'utf8' });
    expect(ok.status).toBe(0);
  });

  it('the committed config hides the private repos Teo named', () => {
    const literals: string[] = JSON.parse(readFileSync('transcripts/redact.config.json', 'utf8')).literals;
    expect(literals).toEqual(expect.arrayContaining(['teofurlan/bloobert', 'teofurlan/mtds-brazo-robot']));
    expect(redactText('git@github.com:teofurlan/bloobert.git and https://github.com/teofurlan/mtds-brazo-robot', { literals }))
      .toBe('[email]:[private].git and https://github.com/[private]');
  });

  it('exits 1 and names the file and rule, never the value, when a secret remains', () => {
    const dir = mkdtempSync(join(tmpdir(), 'redact-bad-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'b.json'), JSON.stringify({ events: [{ text: `leak ${fake.github}` }] }));
    const before = readFileSync(join(dir, 'b.json'), 'utf8');
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('b.json');
    expect(r.stderr).toContain('github-token');
    expect(r.stderr + r.stdout).not.toContain(fake.github);
    expect(readFileSync(join(dir, 'b.json'), 'utf8')).toBe(before);
  });
});

describe('toPublic: branches and harness notices', () => {
  const msg = (id: string, parentId: string | null, role: string, text: string) => ({
    type: 'message', id, parentId, timestamp: `2026-11-11T10:00:0${id.length}.000Z`,
    message: { role, content: [{ type: 'text', text }] },
  });
  const entries = [
    { type: 'session', version: 3, id: 's2', timestamp: '2026-11-11T10:00:00.000Z', cwd: '/tmp' },
    msg('u1', null, 'user', 'first try'),
    msg('a1', 'u1', 'assistant', 'abandoned answer'),
    msg('u2', null, 'user', 'second try'),
    msg('n1', 'u2', 'user', '[System-generated Gentle Agents notification, not written by the user] Subagent output was delivered.'),
    msg('a2', 'n1', 'assistant', 'kept answer'),
  ];
  const pub = toPublic(entries, ctx);

  it('keeps only the active branch (root to the last entry) and counts what it dropped', () => {
    expect(pub.events.map((e) => e.text)).not.toContain('first try');
    expect(pub.events.map((e) => e.text)).not.toContain('abandoned answer');
    expect(pub.abandoned).toBe(2);
  });

  it('shows system-generated messages sent with the user role as notices, not as the user', () => {
    expect(pub.events.map((e) => [e.kind, e.text])).toEqual([
      ['user', 'second try'],
      ['notice', '[System-generated Gentle Agents notification, not written by the user] Subagent output was delivered.'],
      ['text', 'kept answer'],
    ]);
  });
});
