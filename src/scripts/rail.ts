/** Rail sync (artboard 08): marks the section being read with aria-current and updates the "now" label. */
const links = [...document.querySelectorAll<HTMLAnchorElement>('.rail a[data-sec]')];
const secs = links.map((a) => document.getElementById(a.dataset.sec ?? ''));
const nl = document.getElementById('now-l');
const ns = document.getElementById('now-s');
const rail = document.querySelector<HTMLElement>('.rail');

if ('IntersectionObserver' in window && nl && ns && secs.every(Boolean)) {
  const total = links.length;
  const set = (i: number | null) => {
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (i === null) {
      nl.textContent = rail?.dataset.now ?? `${total} sections, top to bottom`;
      ns.textContent = rail?.dataset.nowShort ?? 'Page map';
      return;
    }
    const a = links[i];
    nl.textContent = `${i + 1} / ${total} · ${a.querySelector('.lbl')?.textContent ?? ''}`;
    ns.textContent = `${i + 1} / ${total} · ${a.dataset.short ?? ''}`;
  };
  const vis: Record<string, boolean> = {};
  let cur = -1;
  const io = new IntersectionObserver(
    (es) => {
      es.forEach((e) => (vis[e.target.id] = e.isIntersecting));
      let pick: number | null = null;
      secs.forEach((s, k) => { if (vis[s!.id]) pick = k; });
      if (pick === null && secs[0]!.getBoundingClientRect().top <= innerHeight * 0.4) pick = cur < 0 ? null : cur;
      if ((pick ?? -1) !== cur) { cur = pick ?? -1; set(pick); }
    },
    { rootMargin: '-10% 0px -75% 0px' },
  );
  secs.forEach((s) => io.observe(s!));
}

export {};
