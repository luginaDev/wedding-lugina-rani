export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Elegant SVG placeholder used until real photos are added. */
export function placeholderImage(label, w = 800, h = 1000) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1f45"/><stop offset="1" stop-color="#0b3a3a"/></linearGradient>
<radialGradient id="r" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#d4af6a" stop-opacity=".28"/><stop offset="1" stop-color="#d4af6a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#r)"/>
<rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" fill="none" stroke="#d4af6a" stroke-opacity=".55" stroke-width="2"/>
<text x="50%" y="47%" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.09}" fill="#e9cf94">${esc(label)}</text>
<text x="50%" y="55%" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${w * 0.04}" fill="#e9cf94" fill-opacity=".7">your photo goes here</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

let toastTimer;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function formatDate(iso, timeZone, opts) {
  return new Intl.DateTimeFormat('en-GB', { timeZone, ...opts }).format(new Date(iso));
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
export function timeAgo(date) {
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, sec] of units) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return 'just now';
}
