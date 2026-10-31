import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the site works on any host (Netlify, Vercel, GitHub Pages sub-folder…)
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    // three.js lives in its own chunk, loaded in the background behind the envelope
    chunkSizeWarningLimit: 700,
  },
});
