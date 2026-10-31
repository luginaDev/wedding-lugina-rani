// =====================================================================
//  ✏️  EVERYTHING ABOUT THE WEDDING LIVES IN THIS FILE.
//  Lines marked  // DEMO  are placeholders — replace them with real data.
// =====================================================================

const base = import.meta.env.BASE_URL;

export const config = {
  groom: {
    nickname: 'Lugina',
    fullName: 'Muhamad Lugina Nurhuda',
    parents: 'The son of Mr. Nurwahyudin & Mrs. Tini Suhartini',
    instagram: '', // optional, e.g. 'lugina.nh' (without @)
    photo: 11, // portrait in the couple section
  },

  bride: {
    nickname: 'Rani',
    fullName: 'Rani Rantika',
    parents: 'The daughter of Mr. Casmin & Mrs. Cuheti',
    instagram: '',
    photo: 10,
  },

  monogram: ['L', 'R'],

  timezone: 'Asia/Jakarta',
  timezoneLabel: 'WIB',

  opening: {
    salam: 'Assalamu’alaikum Warahmatullahi Wabarakatuh',
    text: 'By the grace of Allah SWT, we joyfully invite you to share in the happiness of our wedding day.',
  },

  verse: {
    text: 'And of His signs is that He created for you from yourselves mates that you may find tranquillity in them; and He placed between you affection and mercy. Indeed in that are signs for a people who give thought.',
    source: 'QS. Ar-Rum : 21',
  },

  // The countdown counts to the FIRST event.
  // Time format: 'YYYY-MM-DDTHH:MM:SS+07:00'  (+07:00 = WIB)
  events: [
    {
      icon: 'rings',
      title: 'Akad Nikah',
      subtitle: 'The Marriage Vow',
      start: '2026-12-28T08:00:00+07:00', // DEMO time
      end: '2026-12-28T10:00:00+07:00', // DEMO time
      venue: 'The Residence of Rani Rantika',
      address: 'Bride’s family home', // DEMO — put the full address here
      mapsUrl: 'https://maps.app.goo.gl/cuT8GoZoH7TdSDkC7',
    },
    {
      icon: 'glass',
      title: 'Resepsi',
      subtitle: 'Wedding Reception',
      start: '2026-12-28T11:00:00+07:00', // DEMO time
      end: '2026-12-28T15:00:00+07:00', // DEMO time
      venue: 'The Residence of Rani Rantika',
      address: 'Bride’s family home', // DEMO
      mapsUrl: 'https://maps.app.goo.gl/cuT8GoZoH7TdSDkC7',
    },
  ],

  // Love story — each chapter floats in the 3D star corridor.
  // `photo` = photo number (1 = photos/01.webp, …)
  story: [
    {
      year: '2022', // DEMO
      title: 'Same Campus, Different Paths',
      text: 'We walked the same campus halls long before our paths truly crossed. One simple hello turned into conversations we never wanted to end.',
      photo: 3,
    },
    {
      year: '2022', // DEMO
      title: 'The Beginning of Us',
      text: 'What started as friendship quietly grew into something more. That year, we decided to walk this journey together.',
      photo: 1,
    },
    {
      year: '2022 — 2026', // DEMO
      title: 'Four Years, One Heart',
      text: 'Deadlines, late-night talks, graduations and growing up — four years taught us that love is a choice we make every single day.',
      photo: 7,
    },
    {
      year: '2026', // DEMO
      title: 'The Promise',
      text: 'With the blessing of both our families, we promised to turn our campus love story into a lifetime together.',
      photo: 2,
    },
    {
      year: '28 . 12 . 2026',
      title: 'Forever Begins',
      text: 'And now, under the same sky that watched us grow, we begin our forever. Bismillah.',
      photo: 9,
    },
  ],

  // Photo numbers shown in the gallery (in this order)
  gallery: [4, 6, 1, 7, 9, 2],

  gifts: [
    {
      provider: 'BNI',
      label: 'Bank Negara Indonesia',
      number: '0000000000', // DEMO — put the real account number here
      holder: 'Muhamad Lugina Nurhuda', // DEMO — check the account holder name
    },
    // Add more, e.g. an e-wallet:
    // { provider: 'DANA', label: 'E-Wallet', number: '08xxxxxxxxxx', holder: 'Rani Rantika' },
  ],

  // Drop an mp3 at  public/music/song.mp3  — the music button appears automatically.
  music: {
    src: `${base}music/song.mp3`,
  },

  // Paste your Google Apps Script Web App URL here (see README).
  // While empty, RSVP runs in demo mode (saved only in this browser).
  rsvp: {
    endpoint: '',
    maxGuests: 4,
  },

  closing: {
    text: 'It would be a great honour and joy for us if you could attend and give your blessings. Thank you for being part of our story.',
    salam: 'Wassalamu’alaikum Warahmatullahi Wabarakatuh',
    photo: 8,
  },
};
