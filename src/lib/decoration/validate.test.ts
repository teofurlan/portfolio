import { describe, expect, it } from 'vitest';
import { validateSvg, validateTitle, extractEnvelope } from './validate';

const wrap = (inner: string, attrs = 'viewBox="0 0 200 120"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;
const lines = (n: number, stroke = '#1d2c47') =>
  Array.from({ length: n }, (_, i) => `<line x1="${i}" y1="10" x2="${i + 5}" y2="50" stroke="${stroke}"/>`).join('');

describe('validateSvg: accepts', () => {
  it('a plain ink drawing and normalizes it', () => {
    const r = validateSvg(wrap(lines(6)));
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.svg).toContain('viewBox="0 0 200 120"');
    expect(r.svg).toContain('fill="none"');
  });
  it('accent colour in any case, and currentColor mapped to ink', () => {
    const r = validateSvg(wrap(lines(5) + '<circle cx="50" cy="50" r="10" stroke="#A62F08" fill="none"/><path d="M0 0L10 10" stroke="currentColor"/>'));
    expect(r.ok).toBe(true);
    expect(r.svg).toContain('#1d2c47');
    expect(r.svg).not.toMatch(/currentColor/i);
  });
  it('groups and nested elements', () => {
    expect(validateSvg(wrap(`<g stroke="#1d2c47" fill="none">${lines(5)}</g>`)).ok).toBe(true);
  });
  it('small tolerance outside the viewBox', () => {
    expect(validateSvg(wrap(lines(5) + '<line x1="-2" y1="0" x2="201" y2="120" stroke="#1d2c47"/>')).ok).toBe(true);
  });
});

describe('validateSvg: rejects malicious content', () => {
  it.each([
    ['script element', wrap(lines(5) + '<script>alert(1)</script>')],
    ['onload attribute', wrap(lines(5), 'viewBox="0 0 200 120" onload="alert(1)"')],
    ['onclick on a shape', wrap(lines(5) + '<circle cx="5" cy="5" r="2" stroke="#1d2c47" onclick="x()"/>')],
    ['external href', wrap(lines(5) + '<a href="https://evil.test"><circle cx="5" cy="5" r="2" stroke="#1d2c47"/></a>')],
    ['image element', wrap(lines(5) + '<image href="https://evil.test/x.png" width="10" height="10"/>')],
    ['use element', wrap(lines(5) + '<use href="#a"/>')],
    ['xlink:href attribute', wrap(lines(5) + '<path d="M0 0L5 5" stroke="#1d2c47" xlink:href="http://e.test"/>')],
    ['foreignObject', wrap(lines(5) + '<foreignObject><div>hi</div></foreignObject>')],
    ['style element with url()', wrap(lines(5) + '<style>rect{fill:url(http://e.test/x)}</style>')],
    ['style attribute with url()', wrap(lines(5) + '<rect x="1" y="1" width="5" height="5" stroke="#1d2c47" style="fill:url(http://e.test/x)"/>')],
    ['fill with url()', wrap(lines(5) + '<rect x="1" y="1" width="5" height="5" stroke="#1d2c47" fill="url(#g)"/>')],
    ['text element', wrap(lines(5) + '<text x="5" y="5">hola</text>')],
    ['CDATA / comment smuggling', wrap(lines(5) + '<![CDATA[<script>x</script>]]>')],
    ['doctype entity', '<!DOCTYPE svg [<!ENTITY x "y">]>' + wrap(lines(5))],
    ['javascript: in attribute', wrap(lines(5) + '<path d="M0 0" stroke="javascript:alert(1)"/>')],
  ])('%s', (_name, svg) => {
    const r = validateSvg(svg);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('validateSvg: rejects rule violations', () => {
  it('wrong viewBox', () => expect(validateSvg(wrap(lines(5), 'viewBox="0 0 100 100"')).ok).toBe(false));
  it('missing viewBox', () => expect(validateSvg(wrap(lines(5), '')).ok).toBe(false));
  it('foreign stroke colour', () => expect(validateSvg(wrap(lines(5, '#ff0000'))).ok).toBe(false));
  it('filled shape', () => expect(validateSvg(wrap(lines(5) + '<rect x="1" y="1" width="5" height="5" stroke="#1d2c47" fill="#1d2c47"/>')).ok).toBe(false));
  it('too few elements', () => expect(validateSvg(wrap(lines(4))).ok).toBe(false));
  it('too many elements', () => expect(validateSvg(wrap(lines(121))).ok).toBe(false));
  it('120 elements are fine', () => expect(validateSvg(wrap(lines(120))).ok).toBe(true));
  it('coordinates far outside the canvas', () =>
    expect(validateSvg(wrap(lines(5) + '<circle cx="500" cy="50" r="5" stroke="#1d2c47"/>')).ok).toBe(false));
  it('path with coordinates far outside', () =>
    expect(validateSvg(wrap(lines(5) + '<path d="M0 0 L900 900" stroke="#1d2c47"/>')).ok).toBe(false));
  it('over 8 KB', () => expect(validateSvg(wrap(lines(5) + '<!-- ' + 'x'.repeat(9000) + ' -->')).ok).toBe(false));
  it('not an svg at all', () => expect(validateSvg('hello').ok).toBe(false));
  it('unclosed element', () => expect(validateSvg('<svg viewBox="0 0 200 120"><g>').ok).toBe(false));
  it('unknown element', () => expect(validateSvg(wrap(lines(5) + '<marker/>')).ok).toBe(false));
  it('unknown attribute', () => expect(validateSvg(wrap(lines(5) + '<line x1="0" y1="0" x2="1" y2="1" stroke="#1d2c47" filter="x"/>')).ok).toBe(false));
});

describe('validateTitle', () => {
  it('accepts a plain title and trims', () => expect(validateTitle('  Four-bar linkage ')).toEqual({ ok: true, title: 'Four-bar linkage' }));
  it('accepts accents', () => expect(validateTitle('Mecanismo de cuatro barras').ok).toBe(true));
  it.each([[''], ['   '], ['x'.repeat(49)], ['<b>hi</b>'], ['a & b <c>'], ['line\nbreak'], [42 as unknown as string]])(
    'rejects %j',
    (t) => expect(validateTitle(t).ok).toBe(false),
  );
});

describe('extractEnvelope', () => {
  const env = '{"title_en":"A","title_es":"B","svg":"<svg/>"}';
  it('parses plain JSON', () => expect(extractEnvelope(env)).toEqual({ title_en: 'A', title_es: 'B', svg: '<svg/>' }));
  it('parses JSON in a code fence with chatter', () => expect(extractEnvelope('Here:\n```json\n' + env + '\n```\n')?.svg).toBe('<svg/>'));
  it('returns null for garbage', () => expect(extractEnvelope('nope')).toBeNull());
  it('falls back to a bare svg block', () => expect(extractEnvelope('x <svg viewBox="0 0 200 120"></svg> y')?.svg).toContain('<svg'));
});
