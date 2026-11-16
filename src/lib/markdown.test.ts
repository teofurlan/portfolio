import { describe, expect, it } from 'vitest';
import { renderMarkdown, truncateHtml } from './markdown';

describe('renderMarkdown: inline', () => {
  it('renders bold, italic and inline code', () => {
    expect(renderMarkdown('a **b** *c* _d_ `e`')).toBe('<p>a <strong>b</strong> <em>c</em> <em>d</em> <code>e</code></p>');
  });
  it('does not format inside inline code and escapes its content', () => {
    expect(renderMarkdown('`**x** <b>`')).toBe('<p><code>**x** &lt;b&gt;</code></p>');
  });
  it('keeps snake_case and lone asterisks as text', () => {
    expect(renderMarkdown('my_var_name and 2 * 3 * 4')).toBe('<p>my_var_name and 2 * 3 * 4</p>');
  });
  it('joins soft line breaks with a space (CommonMark) and blank lines into paragraphs', () => {
    expect(renderMarkdown('a\nb\n\nc')).toBe('<p>a b</p><p>c</p>');
  });
  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });
});

describe('renderMarkdown: blocks', () => {
  it('renders fenced code with escaped content and no inline formatting', () => {
    expect(renderMarkdown('```ts\nconst a = "<b>" **x**;\n```')).toBe(
      '<pre class="mdcode"><code>const a = &quot;&lt;b&gt;&quot; **x**;</code></pre>',
    );
  });
  it('closes an unterminated fence at the end', () => {
    expect(renderMarkdown('```\nx')).toBe('<pre class="mdcode"><code>x</code></pre>');
  });
  it('maps headings to styled paragraphs, never h1-h3', () => {
    const html = renderMarkdown('# One\n### Three\n###### Six');
    expect(html).toBe('<p class="mdh"><strong>One</strong></p><p class="mdh"><strong>Three</strong></p><p class="mdh"><strong>Six</strong></p>');
    expect(html).not.toMatch(/<h[1-6]/);
  });
  it('renders unordered and ordered lists', () => {
    expect(renderMarkdown('- a\n* b **x**')).toBe('<ul><li>a</li><li>b <strong>x</strong></li></ul>');
    expect(renderMarkdown('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
  });
  it('keeps nested items as indented text inside the parent item', () => {
    expect(renderMarkdown('- a\n  - b')).toBe('<ul><li>a<br>- b</li></ul>');
  });
  it('renders simple pipe tables', () => {
    expect(renderMarkdown('| A | B |\n|---|:-:|\n| 1 | **2** |')).toBe(
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td><strong>2</strong></td></tr></tbody></table>',
    );
  });
});

describe('renderMarkdown: links', () => {
  it('renders http(s) links with rel', () => {
    expect(renderMarkdown('[a](https://x.dev/p?a=1&b=_2_)')).toBe(
      '<p><a href="https://x.dev/p?a=1&amp;b=_2_" rel="nofollow noopener">a</a></p>',
    );
  });
  it('leaves other schemes as plain text', () => {
    const html = renderMarkdown('[x](javascript:alert(1)) [y](data:text/html,hi) [z](/rel)');
    expect(html).not.toContain('<a');
    expect(html).toContain('[x](javascript:alert(1))');
  });
});

describe('renderMarkdown: XSS', () => {
  it('escapes all HTML and never emits live tags from input', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[x](javascript:alert(1))\n[a"](https://e.com/"onmouseover="x)\n`<i>`\n```\n<script>\n```',
    );
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('href="javascript');
    // no attribute can be injected through a quote in a URL
    expect(html).toContain('<a href="https://e.com/&quot;onmouseover=&quot;x" rel="nofollow noopener">');
  });
});

describe('truncateHtml', () => {
  it('truncates text and closes open tags', () => {
    expect(truncateHtml('<p>a <strong>bcd</strong> e</p>', 4)).toBe('<p>a <strong>bc</strong></p>');
  });
  it('drops later nodes and counts an entity as one char', () => {
    expect(truncateHtml('<p>&lt;a&gt;</p><p>zz</p>', 2)).toBe('<p>&lt;a</p>');
  });
  it('keeps void tags and returns everything when n is large', () => {
    const html = '<p>a<br>b</p>';
    expect(truncateHtml(html, 99)).toBe(html);
    expect(truncateHtml(html, 1)).toBe('<p>a</p>');
  });
  it('returns an empty string for n <= 0', () => {
    expect(truncateHtml('<p>a</p>', 0)).toBe('');
  });
});
