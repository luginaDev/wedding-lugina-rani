import { $, timeAgo, toast } from './utils.js';

const LOCAL_KEY = 'lr-wedding-wishes';
const PAGE_SIZE = 6;

const DEMO_WISHES = [
  {
    name: 'Demo Guest',
    attendance: 'Attending',
    message: 'Congratulations Lugina & Rani! May your marriage be filled with sakinah, mawaddah, warahmah. 🤍',
    time: '2026-10-30T10:00:00+07:00',
  },
  {
    name: 'Campus Friends',
    attendance: 'Attending',
    message: 'From the same campus to the same path forever. So happy for you both!',
    time: '2026-10-29T19:30:00+07:00',
  },
];

export function initRsvp({ endpoint, guestName, maxGuests, onLayoutChange }) {
  const form = $('#rsvp-form');
  const list = $('#wishes-list');
  const more = $('#wishes-more');
  const count = $('#wishes-count');
  const guestsField = $('#guests-field');
  const select = form.elements.guests;

  select.innerHTML = Array.from({ length: maxGuests }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'people' : 'person'}</option>`).join('');
  if (guestName) form.elements.name.value = guestName;
  if (!endpoint) $('#rsvp-demo').hidden = false;

  form.addEventListener('change', () => {
    guestsField.hidden = form.elements.attendance.value === 'Not attending';
  });

  let wishes = [];
  let shown = PAGE_SIZE;

  function render() {
    count.textContent = wishes.length;
    list.replaceChildren(
      ...wishes.slice(0, shown).map((w) => {
        const li = document.createElement('li');
        li.className = 'wish';
        const head = document.createElement('div');
        head.className = 'wish__head';
        const name = document.createElement('strong');
        name.textContent = w.name;
        const badge = document.createElement('span');
        badge.className = `wish__badge ${w.attendance === 'Attending' ? 'is-yes' : 'is-no'}`;
        badge.textContent = w.attendance === 'Attending' ? 'Attending' : 'Not attending';
        head.append(name, badge);
        const msg = document.createElement('p');
        msg.textContent = w.message;
        const time = document.createElement('time');
        time.textContent = w.time ? timeAgo(w.time) : '';
        li.append(head, msg, time);
        return li;
      }),
    );
    more.hidden = wishes.length <= shown;
    onLayoutChange?.();
  }

  async function load() {
    if (!endpoint) {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      wishes = [...local, ...DEMO_WISHES];
      return render();
    }
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      wishes = (data.wishes || []).filter((w) => w.message);
      render();
    } catch (err) {
      console.warn('Could not load wishes', err);
    }
  }

  more.addEventListener('click', () => {
    shown += PAGE_SIZE;
    render();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (fd.get('website')) return; // bot
    const data = {
      name: String(fd.get('name') || '').trim(),
      attendance: fd.get('attendance'),
      guests: fd.get('attendance') === 'Attending' ? fd.get('guests') : '0',
      message: String(fd.get('message') || '').trim(),
    };
    if (!data.name) return toast('Please write your name 🙏');
    if (!data.attendance) return toast('Please let us know if you can attend');

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: 'POST', body: new URLSearchParams(data) });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || 'Failed');
      } else {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        if (data.message) local.unshift({ ...data, time: new Date().toISOString() });
        localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
      }
      toast(`Thank you, ${data.name}! 🤍`);
      form.elements.message.value = '';
      await load();
    } catch (err) {
      console.error(err);
      toast('Sorry, something went wrong. Please try again.');
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });

  load();
}
