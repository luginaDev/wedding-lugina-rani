// Converts your original photos into small, fast WebP files.
//   1. Put photos in  photos-original/  (JPG / PNG). They are used in name order.
//   2. Run:  npm run photos
// Output: public/photos/01.webp (large), 01-sm.webp (small), public/og.jpg, src/photos.json
import sharp from 'sharp';
import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'photos-original';
const OUT = 'public/photos';

const files = (await readdir(SRC))
  .filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (!files.length) {
  console.log(`No photos found in ${SRC}/ — add your JPG/PNG files there first.`);
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const manifest = [];
for (const [i, file] of files.entries()) {
  const name = String(i + 1).padStart(2, '0');
  const input = path.join(SRC, file);
  const large = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(OUT, `${name}.webp`));
  const small = await sharp(input)
    .rotate()
    .resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(path.join(OUT, `${name}-sm.webp`));
  manifest.push({ file: name, w: large.width, h: large.height });
  console.log(`✓ ${file} → ${name}.webp (${Math.round(large.size / 1024)} KB) + small (${Math.round(small.size / 1024)} KB)`);
}

// Link preview image for WhatsApp / social media
await sharp(path.join(SRC, files[0]))
  .rotate()
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82 })
  .toFile('public/og.jpg');

await writeFile('src/photos.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nDone! ${files.length} photos ready. Link preview saved to public/og.jpg`);
