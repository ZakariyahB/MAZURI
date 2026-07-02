import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Library build for the embeddable widget (npm run build:embed).
 *
 * Produces a self-contained IIFE bundle in dist-embed/:
 *   community-bridge.js   — React + CoreApp + the embed shell, global `CommunityBridge`
 *   community-bridge.css  — the scoped `cb-` styles
 *
 * Both files are static assets a host site includes with one <script> and one
 * <link> tag — see src/embed/index.ts for the drop-in snippet.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    // React's UMD/library builds read process.env.NODE_ENV; inline it.
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist-embed',
    lib: {
      entry: 'src/embed/index.ts',
      name: 'CommunityBridge',
      formats: ['iife'],
      fileName: () => 'community-bridge.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css') ? 'community-bridge.css' : '[name][extname]',
      },
    },
  },
});
