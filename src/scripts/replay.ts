/**
 * Session replay player (loaded only on the build-session pages).
 * Progressive enhancement over the server-rendered transcript:
 *  - no JS: the full transcript is already there;
 *  - JS: messages appear one by one with a typing effect, with play/pause, speed and a chapter progress bar;
 *  - any click, wheel, touch or key inside the stage pauses and switches to the full browsable transcript;
 *  - prefers-reduced-motion: starts as the static transcript (paused); Play reveals items without typing.
 */
const root = document.querySelector<HTMLElement>('[data-replay]');
if (root) init(root);

function init(root: HTMLElement) {
  const bar = root.querySelector<HTMLElement>('[data-bar]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const speedBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-speed]')];
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const fill = root.querySelector<HTMLElement>('[data-fill]')!;
  const marks = root.querySelector<HTMLElement>('[data-marks]')!;
  const now = root.querySelector<HTMLElement>('[data-now]')!;
  const live = root.querySelector<HTMLElement>('[data-live]')!;
  const trSwitch = root.querySelector<HTMLElement>('[data-tr-switch]')!;
  const trAll = root.querySelector<HTMLInputElement>('[data-tr-all]')!;
  const stageLabel = root.dataset.lStage ?? '';
  const items = [...root.querySelectorAll<HTMLElement>('[data-seq]')];
  const L = root.dataset;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = items.length;
  if (!N) return;

  // Message text is read once from the (escaped) server markup and restored from here.
  const pres = items.map((el) => el.querySelector<HTMLElement>('.orig'));
  const full = pres.map((p) => p?.textContent ?? '');
  const chapters = items.flatMap((el, i) => (el.dataset.chapter ? [{ i, n: el.dataset.chapter, title: el.dataset.title ?? '' }] : []));
  const chapterText = (n: string, title: string) => (L.lChapter ?? '').replace('{n}', n).replace('{title}', title);

  let mode: 'player' | 'browse' = 'browse';
  let playing = false;
  let speed = 1;
  let idx = 0; // item being revealed (all before it are complete)
  let elapsed = 0; // ms of replay time spent on item idx
  let last = 0;
  let raf = 0;

  const typeMs = (i: number) => (pres[i] && full[i] ? Math.min((full[i].length / 45) * 1000, 12000) : 0);
  const dwellMs = (i: number) => (pres[i] ? 600 : items[i].dataset.chapter ? 700 : 350);

  function setMode(next: 'player' | 'browse') {
    mode = next;
    root.dataset.mode = next;
    if (next === 'player') {
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('role', 'region');
      stage.setAttribute('aria-label', stageLabel);
    } else {
      stage.removeAttribute('tabindex');
      stage.removeAttribute('role');
      stage.removeAttribute('aria-label');
    }
  }

  function showItem(i: number, chars: number) {
    const el = items[i];
    el.classList.add('seen');
    const pre = pres[i];
    if (!pre) return;
    const text = full[i];
    const done = chars >= text.length;
    pre.textContent = done ? text : text.slice(0, Math.max(0, Math.floor(chars)));
    if (done) pre.removeAttribute('aria-hidden');
    else pre.setAttribute('aria-hidden', 'true');
    el.classList.toggle('typing', !done);
  }

  // The live region holds only the message being played now.
  function announce(i: number) {
    const el = items[i];
    if (el.dataset.who) live.textContent = `${el.dataset.who}: ${full[i]}`;
    else if (el.dataset.title) live.textContent = el.dataset.title;
    else live.textContent = '';
  }

  function render() {
    const at = Math.min(idx, N);
    track.setAttribute('aria-valuemax', String(N));
    track.setAttribute('aria-valuenow', String(at));
    fill.style.width = `${(at / N) * 100}%`;
    const ch = [...chapters].reverse().find((c) => c.i <= Math.min(idx, N - 1));
    now.textContent = ch ? chapterText(ch.n, ch.title) : '';
    track.setAttribute('aria-valuetext', now.textContent);
  }

  function setPlaying(p: boolean) {
    playing = p;
    playBtn.textContent = p ? (L.lPause ?? '') : idx >= N ? (L.lRestart ?? '') : (L.lPlay ?? '');
  }

  /** Reveal everything before n instantly and start item n. */
  function seek(n: number) {
    idx = Math.max(0, Math.min(n, N));
    elapsed = 0;
    items.forEach((el, i) => {
      if (i < idx) showItem(i, Infinity);
      else {
        el.classList.remove('seen', 'typing');
        pres[i]?.removeAttribute('aria-hidden');
      }
    });
    if (idx < N) {
      showItem(idx, reduced ? Infinity : 0);
      announce(idx);
    }
    render();
    stage.scrollTop = stage.scrollHeight;
  }

  function loop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(t: number) {
    if (!playing) return;
    elapsed += (t - last) * speed;
    last = t;
    const tm = reduced ? 0 : typeMs(idx);
    if (pres[idx] && tm) showItem(idx, full[idx].length * Math.min(elapsed / tm, 1));
    if (elapsed >= tm + dwellMs(idx)) {
      showItem(idx, Infinity);
      idx++;
      elapsed = 0;
      if (idx >= N) {
        render();
        pause();
        return;
      }
      showItem(idx, reduced ? Infinity : 0);
      announce(idx);
      render();
    }
    stage.scrollTop = stage.scrollHeight;
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (idx >= N) idx = 0;
    if (mode === 'browse') {
      idx = firstInView();
      setMode('player');
    }
    seek(idx);
    setPlaying(true);
    loop();
  }

  function pause() {
    cancelAnimationFrame(raf);
    setPlaying(false);
    if (idx < N) showItem(idx, Infinity);
  }

  /** Leave player mode: show the whole transcript with the current item in view. */
  function toBrowse() {
    if (mode !== 'player') return;
    pause();
    const current = items[Math.min(idx, N - 1)];
    setMode('browse');
    items.forEach((el, i) => {
      el.classList.remove('seen', 'typing');
      const pre = pres[i];
      if (pre) {
        pre.removeAttribute('aria-hidden');
        pre.textContent = full[i];
      }
    });
    live.textContent = L.lPaused ?? '';
    current.scrollIntoView({ block: 'center', behavior: 'auto' });
  }

  function firstInView(): number {
    const top = bar.getBoundingClientRect().bottom;
    const i = items.findIndex((el) => el.getBoundingClientRect().bottom > top + 4);
    return i < 0 ? 0 : i;
  }

  function jump(i: number) {
    const wasPlaying = playing;
    if (mode === 'browse') setMode('player');
    seek(i);
    if (wasPlaying) {
      setPlaying(true);
      loop();
    } else {
      pause();
    }
  }

  // Controls (hidden until JS runs; without JS the transcript is simply static).
  bar.hidden = false;
  trSwitch.hidden = false;
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  speedBtns.forEach((b) =>
    b.addEventListener('click', () => {
      speed = Number(b.dataset.speed) || 1;
      speedBtns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }),
  );
  trAll.addEventListener('change', () => {
    root.querySelectorAll<HTMLDetailsElement>('details.trd').forEach((d) => (d.open = trAll.checked));
  });

  // Progress bar: chapter markers are buttons; the track itself is a slider (click or arrow keys).
  chapters.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rp-mark';
    b.style.left = `${(c.i / N) * 100}%`;
    b.textContent = c.n;
    b.setAttribute('aria-label', chapterText(c.n, c.title));
    b.title = c.title;
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      jump(c.i);
    });
    marks.append(b);
  });
  track.addEventListener('click', (ev) => {
    const r = track.getBoundingClientRect();
    jump(Math.round(((ev.clientX - r.left) / r.width) * N));
  });
  track.addEventListener('keydown', (ev) => {
    const k = ev.key;
    if (k === 'ArrowRight' || k === 'ArrowUp') jump(Math.min(N - 1, idx + 1));
    else if (k === 'ArrowLeft' || k === 'ArrowDown') jump(Math.max(0, idx - 1));
    else if (k === 'Home') jump(0);
    else if (k === 'End') jump(N - 1);
    else return;
    ev.preventDefault();
  });

  // Any interaction inside the stage pauses and opens the full transcript at this point.
  for (const type of ['click', 'wheel', 'touchstart', 'keydown'] as const) {
    stage.addEventListener(type, toBrowse, { passive: true });
  }

  render();
  setPlaying(false);
  if (reduced) setMode('browse'); // static and paused; Play starts the player on request
  else {
    setMode('player');
    play();
  }
}
