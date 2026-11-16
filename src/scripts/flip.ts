/**
 * Hero photo card: the decoration piece lives on its back. Without JS only the
 * photo shows (the back stays hidden). The face out of view is inert, so its
 * link and button never take focus; focus follows the flip.
 */
document.querySelectorAll<HTMLElement>('[data-flip]').forEach((card) => {
  const front = card.querySelector<HTMLElement>('.front');
  const back = card.querySelector<HTMLElement>('.back');
  if (!front || !back) return;

  const set = (toBack: boolean, moveFocus: boolean) => {
    // Focus inside the face that is turning away would be lost once it goes inert.
    if ((toBack ? front : back).contains(document.activeElement)) moveFocus = true;
    card.classList.toggle('on', toBack);
    front.inert = toBack;
    back.inert = !toBack;
    if (moveFocus) (toBack ? back : front).querySelector<HTMLButtonElement>('.flip-btn')?.focus({ preventScroll: true });
  };

  card.querySelectorAll<HTMLButtonElement>('.flip-btn').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      set(b.dataset.flipTo === 'back', true);
    });
  });
  // Pointer convenience: a click anywhere on the card flips it, except on its link.
  card.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a,button')) return;
    set(!card.classList.contains('on'), false);
  });

  back.hidden = false;
  card.classList.add('ready');
  set(false, false);
  // Transitions only after the first frame: otherwise the back face visibly turns into place on load.
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('anim')));
});

export {};
