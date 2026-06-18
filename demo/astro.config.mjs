import { defineConfig } from 'astro/config';
import inspectClip from '../dist/index.js';

export default defineConfig({
  devToolbar: {
    enabled: true,
  },
  integrations: [inspectClip()],
});
