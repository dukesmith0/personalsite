import { defineConfig } from 'vite';

// Relative base so the built site works when served from any sub-path
// (GitHub Pages project sites, static hosts, or opened from disk).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      // multi-page: the main site + the /assets experiment gallery
      input: {
        main: 'index.html',
        assets: 'assets/index.html'
      },
      output: {
        // split the heavy 3D vendor into its own long-cache chunk
        manualChunks: { three: ['three'] }
      }
    }
  }
});
