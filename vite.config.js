import { defineConfig } from 'vite';

// Relative base so the built site works when served from any sub-path
// (GitHub Pages project sites, static hosts, or opened from disk).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
});
