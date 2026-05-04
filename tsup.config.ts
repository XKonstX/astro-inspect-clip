import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/app.ts'],
  format: ['esm'],
  dts: { resolve: ['astro'] },
  clean: true,
  splitting: false,
  sourcemap: true,
  // Keep external references — astro is a peer dep
  external: ['astro'],
});
