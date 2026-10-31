# Lugina & Rani — "Under the Stars" 💍

A 3D wedding invitation website. It is fully static, so it can be hosted for free.

## Run it on your laptop

```bash
npm install     # first time only
npm run dev     # open the http://localhost:5173 link it prints
```

Because `npm run dev` uses `--host`, you can also open the **Network** link it prints on your phone (same Wi-Fi).

Test links:

- `http://localhost:5173/?to=Budi%20Santoso` shows a personalised guest name
- `?lite` forces the lightweight 2D version (what very old phones get automatically)

## What to edit

| What                                        | Where                                                        |
| ------------------------------------------- | ------------------------------------------------------------ |
| Names, parents, times, address, love story, bank account | `src/config.js` (every `// DEMO` line is a placeholder) |
| Photos                                      | see below                                                    |
| Music                                       | put an mp3 at `public/music/song.mp3`                         |

### Add your 11 photos

1. Copy your photos (JPG/PNG) into the `photos-original/` folder. They are used **in name order**, so you can rename them `01.jpg`, `02.jpg`, … to control the order.
   - Photos 1–5 appear in the 3D love story (change this with `photo:` in `config.js`).
   - All of them appear in the gallery.
   - Photo 11 is the closing photo. Photo 1 becomes the WhatsApp link preview.
2. Run `npm run photos`. This compresses them to fast WebP files.

iPhone HEIC photos: convert them to JPG first.

## Connect RSVP to Google Sheets (free)

1. Create a new Google Sheet, then open **Extensions → Apps Script**.
2. Delete what's there, and paste in the contents of `google-apps-script/Code.gs`. Save.
3. Click **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise it, then copy the **Web app URL**.
5. Paste the URL into `rsvp.endpoint` in `src/config.js`.

Every RSVP and wish now appears in your sheet, and the wishes show live on the website.

## Publish it (free)

```bash
npm run build   # creates the dist/ folder
```

The easiest way is to drag the `dist/` folder onto https://app.netlify.com/drop.

After it's live, change `og:image` in `index.html` to the full URL (for example `https://your-site.netlify.app/og.jpg`) and build again. WhatsApp needs a full URL to show the photo preview.

Guest links look like this: `https://your-site.netlify.app/?to=Budi%20Santoso` (`%20` = space).
