import { $ } from './utils.js';

export function initGallery(photos, { onLayoutChange }) {
  const grid = $('#gallery-grid');
  grid.innerHTML = photos
    .map(
      (p, i) => `
      <button class="gallery__item reveal" type="button" data-index="${i}" aria-label="Open photo ${p.number}">
        <img src="${p.small}" width="${p.width}" height="${p.height}" alt="Lugina and Rani — photo ${p.number}" loading="lazy" decoding="async" />
      </button>`,
    )
    .join('');

  grid.addEventListener('load', onLayoutChange, true);

  // ---------------- Lightbox ----------------
  const box = $('#lightbox');
  const img = $('.lightbox__img', box);
  const counter = $('.lightbox__counter', box);
  let current = 0;
  let lastFocus = null;

  function show(i) {
    current = (i + photos.length) % photos.length;
    const p = photos[current];
    img.src = p.full;
    img.alt = `Lugina and Rani — photo ${p.number}`;
    counter.textContent = `${current + 1} / ${photos.length}`;
    // warm up the neighbours
    [current + 1, current - 1].forEach((n) => {
      const q = photos[(n + photos.length) % photos.length];
      new Image().src = q.full;
    });
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.documentElement.classList.add('is-modal');
    requestAnimationFrame(() => box.classList.add('is-open'));
    $('.lightbox__close', box).focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.documentElement.classList.remove('is-modal');
    setTimeout(() => (box.hidden = true), 300);
    lastFocus?.focus();
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
    if (item) open(Number(item.dataset.index));
  });
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__nav--prev', box).addEventListener('click', () => show(current - 1));
  $('.lightbox__nav--next', box).addEventListener('click', () => show(current + 1));
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  let touchX = null;
  box.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
}
