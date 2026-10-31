import './styles.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from './config.js';
import { photos, photo } from './photos.js';
import { initGallery } from './gallery.js';
import { initRsvp } from './rsvp.js';
import { $, $$, esc, clamp, copyText, toast, formatDate } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const guestName = (params.get('to') || '').trim().slice(0, 60);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode = pick3DMode();

root.classList.add(mode === 'off' ? 'no3d' : 'has3d');
if (!reducedMotion) root.classList.add('motion');

const scroll = { hero: 0, story: 0 };
let scene = null;

// ===================================================================
//  Content
// ===================================================================
const { groom, bride, timezone: tz } = config;
const firstEvent = config.events[0];

const binds = {
  'groom-nick': groom.nickname,
  'bride-nick': bride.nickname,
  'groom-full': groom.fullName,
  'bride-full': bride.fullName,
  'groom-parents': groom.parents,
  'bride-parents': bride.parents,
  'groom-initial': groom.nickname[0],
  'bride-initial': bride.nickname[0],
  monogram: config.monogram.join(' '),
  'date-dots': formatDate(firstEvent.start, tz, { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' · '),
  'date-long': formatDate(firstEvent.start, tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  'salam-open': config.opening.salam,
  'opening-text': config.opening.text,
  'verse-text': config.verse.text,
  'verse-source': config.verse.source,
  'closing-text': config.closing.text,
  'salam-close': config.closing.salam,
};
for (const [key, value] of Object.entries(binds)) {
  $$(`[data-bind="${key}"]`).forEach((el) => (el.textContent = value));
}

for (const who of ['groom', 'bride']) {
  if (config[who].photo) {
    const medallion = $(`[data-bind="${who}-initial"]`).parentElement;
    const img = document.createElement('img');
    img.src = photo(config[who].photo).small;
    img.alt = config[who].fullName;
    img.loading = 'lazy';
    img.decoding = 'async';
    const crop = document.createElement('div');
    crop.className = 'person__crop';
    crop.append(img);
    medallion.replaceChildren(crop);
    medallion.classList.add('has-photo');
  }

  const ig = config[who].instagram;
  const a = $(`[data-ig="${who}"]`);
  if (ig) {
    a.href = `https://instagram.com/${encodeURIComponent(ig)}`;
    a.textContent = `@${ig}`;
    a.hidden = false;
  }
}

if (guestName) $('#guest-name').textContent = guestName;

$('#closing-photo').src = photo(config.closing.photo).full;

const timeFmt = (iso) => formatDate(iso, tz, { hour: '2-digit', minute: '2-digit', hour12: false });

function calendarLink(ev) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.title} — ${groom.nickname} & ${bride.nickname}`,
    dates: `${stamp(ev.start)}/${stamp(ev.end)}`,
    details: `${ev.subtitle} of ${groom.fullName} & ${bride.fullName}\n${ev.mapsUrl}`,
    location: `${ev.venue}, ${ev.address}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

$('#save-date').href = calendarLink(firstEvent);

const ICONS = {
  rings: '<svg viewBox="0 0 48 48"><circle cx="19" cy="28" r="11"/><circle cx="29" cy="28" r="11"/><path d="M29 17l3-4-3-4-3 4z"/></svg>',
  glass: '<svg viewBox="0 0 48 48"><path d="M14 8h8l-1 12a5 5 0 01-6 0zM26 8h8l-1 12a5 5 0 01-6 0zM18 23v15M30 23v15M13 40h10M25 40h10M23 6l2-3M27 6l3-2"/></svg>',
};

$('#events-grid').innerHTML = config.events
  .map(
    (ev) => `
    <article class="event panel reveal">
      <div class="event__icon">${ICONS[ev.icon] || ICONS.rings}</div>
      <h3 class="event__title">${esc(ev.title)}</h3>
      <p class="event__subtitle">${esc(ev.subtitle)}</p>
      <div class="ornament" aria-hidden="true"><span></span></div>
      <ul class="event__meta">
        <li><svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>
          ${esc(formatDate(ev.start, tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</li>
        <li><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          ${esc(timeFmt(ev.start))} – ${esc(timeFmt(ev.end))} ${esc(config.timezoneLabel)}</li>
        <li><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          <span><strong>${esc(ev.venue)}</strong><br>${esc(ev.address)}</span></li>
      </ul>
      <div class="event__actions">
        <a class="btn btn--gold btn--small" href="${esc(ev.mapsUrl)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Open Maps</a>
        <a class="btn btn--ghost btn--small" href="${esc(calendarLink(ev))}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M12 8v8M8 12h8M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"/></svg>Add to Calendar</a>
      </div>
    </article>`,
  )
  .join('');

$('#gift-grid').innerHTML = config.gifts
  .map(
    (g, i) => `
    <article class="gift-card reveal">
      <div class="gift-card__top">
        <span class="gift-card__provider">${esc(g.provider)}</span>
        <span class="gift-card__chip" aria-hidden="true"></span>
      </div>
      <p class="gift-card__label">${esc(g.label)}</p>
      <p class="gift-card__number">${esc(g.number.replace(/(\d{4})(?=\d)/g, '$1 '))}</p>
      <div class="gift-card__bottom">
        <span class="gift-card__holder">${esc(g.holder)}</span>
        <button class="btn btn--ghost btn--small" type="button" data-copy="${i}">
          <svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/></svg>Copy</button>
      </div>
    </article>`,
  )
  .join('');

$('#gift-grid').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const g = config.gifts[Number(btn.dataset.copy)];
  const ok = await copyText(g.number);
  toast(ok ? `${g.provider} account number copied ✓` : 'Could not copy — please copy it manually');
});

// ---------------- Story ----------------
function renderStory() {
  const chapters = config.story;
  const is3d = mode !== 'off';
  $('#story-track').style.setProperty('--chapters', chapters.length);
  $('#story-chapters').innerHTML = chapters
    .map((c, i) => {
      const p = photo(c.photo);
      const img = is3d
        ? ''
        : `<img class="chapter__photo" src="${p.small}" width="${p.width}" height="${p.height}" alt="" loading="lazy" decoding="async" />`;
      return `
      <article class="chapter ${is3d ? '' : 'reveal'}" data-side="${i % 2 === 0 ? 'left' : 'right'}">
        ${img}
        <div class="chapter__body">
          <p class="chapter__year">${esc(c.year)}</p>
          <h3 class="chapter__title">${esc(c.title)}</h3>
          <p class="chapter__text">${esc(c.text)}</p>
        </div>
      </article>`;
    })
    .join('');
  $('#story-dots').innerHTML = is3d ? chapters.map(() => '<i></i>').join('') : '';
}
renderStory();

const chapterEls = () => $$('#story-chapters .chapter');
const dotEls = () => $$('#story-dots i');

function updateChapters(p) {
  const n = config.story.length;
  const s = p * (n + 1);
  const dots = dotEls();
  chapterEls().forEach((el, i) => {
    const d = s - (i + 1);
    const o = clamp((0.42 - Math.abs(d)) / 0.27, 0, 1);
    el.style.opacity = o;
    el.style.transform = `translate3d(0, ${(-d * 40).toFixed(1)}px, 0)`;
    el.style.visibility = o > 0 ? 'visible' : 'hidden';
    dots[i]?.classList.toggle('is-active', Math.abs(d) < 0.5);
  });
}

// ===================================================================
//  Countdown
// ===================================================================
(function countdown() {
  const target = new Date(firstEvent.start).getTime();
  const units = {
    days: $('[data-unit="days"]'),
    hours: $('[data-unit="hours"]'),
    minutes: $('[data-unit="minutes"]'),
    seconds: $('[data-unit="seconds"]'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      clearInterval(timer);
      $('#countdown-grid').hidden = true;
      const done = $('#countdown-done');
      done.hidden = false;
      done.textContent = diff > -864e5 ? 'Today is the day! 🤍' : 'Happily married, Alhamdulillah 🤍';
      return;
    }
    const v = {
      days: Math.floor(diff / 864e5),
      hours: Math.floor(diff / 36e5) % 24,
      minutes: Math.floor(diff / 6e4) % 60,
      seconds: Math.floor(diff / 1e3) % 60,
    };
    for (const k in v) {
      const text = pad(v[k]);
      if (units[k].textContent !== text) units[k].textContent = text;
    }
  }
  const timer = setInterval(tick, 1000);
  tick();
})();

// ===================================================================
//  Gallery, RSVP
// ===================================================================
let refreshQueued = 0;
const queueRefresh = () => {
  clearTimeout(refreshQueued);
  refreshQueued = setTimeout(() => ScrollTrigger.refresh(), 250);
};

initGallery(photos, { onLayoutChange: queueRefresh });
initRsvp({ endpoint: config.rsvp.endpoint, guestName, maxGuests: config.rsvp.maxGuests, onLayoutChange: queueRefresh });

// ===================================================================
//  Music
// ===================================================================
const music = (() => {
  const btn = $('#music-toggle');
  if (!config.music?.src) return { play() {} };
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  audio.src = config.music.src;
  let wanted = false;
  let broken = false;
  audio.addEventListener('error', () => {
    broken = true;
    btn.hidden = true;
  });
  audio.addEventListener('play', () => btn.classList.add('is-playing'));
  audio.addEventListener('pause', () => btn.classList.remove('is-playing'));
  btn.addEventListener('click', () => {
    if (audio.paused) {
      wanted = true;
      audio.play().catch(() => {});
    } else {
      wanted = false;
      audio.pause();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (wanted) audio.play().catch(() => {});
  });
  return {
    play() {
      if (broken) return;
      wanted = true;
      audio
        .play()
        .then(() => (btn.hidden = false))
        .catch(() => {});
    },
  };
})();

// ===================================================================
//  3D scene (loaded in the background while the envelope is shown)
// ===================================================================
if (mode !== 'off') {
  import('./scene.js')
    .then(({ createScene }) => {
      const framePhotos = config.story.map((c) => {
        const p = photo(c.photo);
        return { src: p.small, width: p.width, height: p.height };
      });
      scene = createScene($('#scene'), { framePhotos, quality: mode, scroll });
      if (!root.classList.contains('is-locked-cover')) scene.intro();
    })
    .catch((err) => {
      console.warn('3D disabled:', err);
      fallbackTo2D();
    });
}

function fallbackTo2D() {
  mode = 'off';
  root.classList.replace('has3d', 'no3d');
  renderStory();
  setupRevealFor('#story-chapters .reveal');
  queueRefresh();
}

// ===================================================================
//  Scroll animations
// ===================================================================
ScrollTrigger.create({
  trigger: '#home',
  start: 'top top',
  end: 'bottom top',
  onUpdate: (self) => (scroll.hero = self.progress),
});

ScrollTrigger.create({
  trigger: '#story-track',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    scroll.story = self.progress;
    if (mode !== 'off') updateChapters(self.progress);
  },
  onRefresh: (self) => mode !== 'off' && updateChapters(self.progress),
});
if (mode !== 'off') updateChapters(0);

function setupRevealFor(selector) {
  if (reducedMotion) return;
  const els = $$(selector);
  if (!els.length) return;
  gsap.set(els, { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch(els, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, overwrite: true }),
  });
}
setupRevealFor('.reveal');

// Active dock item
const dockLinks = $$('#dock a');
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      dockLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
['home', 'couple', 'events', 'gallery', 'rsvp'].forEach((id) => sectionObserver.observe(document.getElementById(id)));

document.fonts?.ready.then(queueRefresh);
window.addEventListener('load', queueRefresh);

// ===================================================================
//  Envelope / cover
// ===================================================================
root.classList.add('is-locked-cover');
const envelope = $('#envelope');
const heroContent = $$('.hero__content > *, .scroll-hint, .hero__rings-fallback');
if (!reducedMotion) gsap.set(heroContent, { autoAlpha: 0, y: 30 });

if (!reducedMotion && !matchMedia('(pointer: coarse)').matches) {
  const rx = gsap.quickTo(envelope, 'rotationX', { duration: 0.8, ease: 'power3' });
  const ry = gsap.quickTo(envelope, 'rotationY', { duration: 0.8, ease: 'power3' });
  gsap.set(envelope, { transformPerspective: 900 });
  $('#cover').addEventListener('pointermove', (e) => {
    rx(((e.clientY / innerHeight) * 2 - 1) * -9);
    ry(((e.clientX / innerWidth) * 2 - 1) * 12);
  });
}

let opened = false;
function openInvitation() {
  if (opened) return;
  opened = true;
  music.play();

  const finish = () => {
    $('#cover').remove();
    document.body.classList.remove('is-locked');
    root.classList.remove('is-locked-cover');
    root.classList.add('is-open');
    scene?.intro();
    ScrollTrigger.refresh();
    if (!reducedMotion) {
      gsap.to(heroContent, { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.18, delay: 0.25 });
    }
  };

  if (reducedMotion) {
    gsap.to('#cover', { autoAlpha: 0, duration: 0.5, onComplete: finish });
    return;
  }

  gsap.set('.envelope__flap', { transformPerspective: 900, transformOrigin: '50% 0%' });
  gsap
    .timeline({ onComplete: finish })
    .to(envelope, { rotationX: 0, rotationY: 0, duration: 0.4, ease: 'power2.out' })
    .to('.cover__fade', { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.04 }, 0)
    .to('.envelope__seal', { scale: 1.18, duration: 0.18, ease: 'power1.out' }, 0.15)
    .to('.envelope__seal', { scale: 0, autoAlpha: 0, rotation: -30, duration: 0.4, ease: 'back.in(2)' })
    .to('.envelope__flap', { rotationX: 180, duration: 0.85, ease: 'power2.inOut' }, '-=0.1')
    .set('.envelope__flap', { zIndex: 2 }, '-=0.42')
    .to('.envelope__letter', { yPercent: -58, duration: 1.05, ease: 'power3.out' }, '-=0.1')
    .to('.envelope-wrap', { scale: 1.12, duration: 1.2, ease: 'power1.inOut' }, '<')
    .to('.envelope-wrap', { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, '+=0.35')
    .to('#cover', { autoAlpha: 0, duration: 0.7 }, '-=0.5');
}

$('#open-invitation').addEventListener('click', openInvitation);
envelope.addEventListener('click', openInvitation);

// ===================================================================
//  Helpers
// ===================================================================
function pick3DMode() {
  if (params.has('lite')) return 'off';
  const forced = params.has('3d');
  if (reducedMotion && !forced) return 'off';
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) return 'off';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (!forced && (mem <= 2 || cores <= 2)) return 'off';
  const coarse = matchMedia('(pointer: coarse)').matches;
  return coarse || mem <= 4 ? 'medium' : 'high';
}
