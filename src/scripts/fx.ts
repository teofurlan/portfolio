import { railProgress } from '../lib/rail-progress';

/** Interactive drafting grid + scroll-driven figures/rail progress (P2 rules). Reduced motion: static finished state. */
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const bg = document.querySelector<HTMLElement>('.bgfx');

if (bg && fine && !reduce) {
  let mx = -999, my = -999, queued = false;
  const xy = bg.querySelector('.xy');
  const pad = (n: number) => String(Math.round(n)).padStart(4, '0');
  const paint = () => {
    queued = false;
    bg.style.setProperty('--mx', `${mx}px`);
    bg.style.setProperty('--my', `${my}px`);
    if (xy) xy.textContent = `X ${pad(mx + scrollX)}  Y ${pad(my + scrollY)}`;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    root.classList.add('bg-on');
    const t = (e.target as Element).closest?.('a,button,input,textarea,select,summary,[role=button],section,article,figure,table,header,footer,.sheet,.cover');
    root.classList.toggle('bg-ch', !t);
    queue();
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('bg-on', 'bg-ch'));
  addEventListener('blur', () => root.classList.remove('bg-on', 'bg-ch'));
  addEventListener('keydown', () => root.classList.remove('bg-ch'));
  addEventListener('scroll', () => { if (root.classList.contains('bg-on')) queue(); }, { passive: true });
}

if (!reduce) {
  root.classList.add('js-fx');
  const figs = [...document.querySelectorAll<HTMLElement>('figure.fig')];
  figs.forEach((f) => f.style.setProperty('--n', String(f.querySelectorAll('svg .d').length)));
  const rail = document.querySelector<HTMLElement>('.rail');
  const railList = rail?.querySelector<HTMLElement>('ol') ?? null;
  const railLinks = rail ? [...rail.querySelectorAll<HTMLAnchorElement>('a[data-sec]')] : [];
  const railItems = railLinks.map((a) => a.closest('li') as HTMLElement);
  const railSecs = railLinks.map((a) => document.getElementById(a.dataset.sec ?? '')).filter((s): s is HTMLElement => !!s);
  const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    // A figure draws while it rises from 92% to 45% of the viewport height.
    figs.forEach((f) => f.style.setProperty('--p', clamp((vh * 0.92 - f.getBoundingClientRect().top) / (vh * 0.47)).toFixed(3)));
    if (rail && railList) {
      // The reading line sits at 25% of the viewport, where rail.ts marks the current section.
      const read = vh * 0.25;
      const tops = railSecs.map((s) => s.getBoundingClientRect().top + scrollY);
      // The line (ol::after) spans the list plus 6 px above and below.
      const centres = railItems.map((li) => li.offsetTop + li.offsetHeight / 2 + 6);
      const prog = railProgress({ tops, end: root.scrollHeight - vh + read, centres, height: railList.offsetHeight + 12, y: scrollY + read });
      rail.style.setProperty('--prog', prog.toFixed(3));
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('load', req); // images can move section tops
  update();
}

export {};
