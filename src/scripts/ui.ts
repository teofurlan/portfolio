/** Theme toggle, email reveal and language cookie. Without JS: OS theme, toggle hidden, email shown as "user [at] domain". */
const root = document.documentElement;

const btn = document.getElementById('theme') as HTMLButtonElement | null;
if (btn) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const a = root.getAttribute('data-theme');
    return a ? a === 'dark' : mq.matches;
  };
  const sync = () => btn.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
  btn.hidden = false;
  sync();
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {}
    sync();
  });
  mq.addEventListener?.('change', sync);
}

// Email: assembled at runtime so the address never appears in the HTML.
document.querySelectorAll<HTMLElement>('[data-email]').forEach((src) => {
  const addr = `${src.dataset.u}@${src.dataset.d}`;
  const a = document.createElement('a');
  a.href = `mailto:${addr}`;
  a.className = src.className;
  a.textContent = addr;
  src.replaceWith(a);
  const b = a.parentElement?.querySelector<HTMLButtonElement>('[data-copy]');
  if (!b || !navigator.clipboard?.writeText) return;
  const label = b.textContent;
  b.hidden = false;
  b.addEventListener('click', () => {
    navigator.clipboard.writeText(addr).then(() => {
      b.textContent = b.dataset.copied ?? 'Copied';
      setTimeout(() => (b.textContent = label), 1600);
    }, () => {});
  });
});

// Language switch: remember the choice (T3 reads this cookie to skip auto-detection).
document.querySelectorAll<HTMLAnchorElement>('a[data-lang]').forEach((a) => {
  a.addEventListener('click', () => {
    document.cookie = `lang=${a.dataset.lang}; Max-Age=31536000; Path=/; SameSite=Lax`;
  });
});

export {};

// Phones: the main nav is one swipeable line; bring the current page's link into view.
const navCur = document.querySelector<HTMLElement>('.mainnav a[aria-current="page"]');
const navUl = navCur?.closest<HTMLElement>('.mainnav');
if (navCur && navUl && navUl.scrollWidth > navUl.clientWidth) {
  const over = navCur.offsetLeft + navCur.offsetWidth + 40 - navUl.clientWidth;
  if (over > 0) navUl.scrollLeft = over;
}
