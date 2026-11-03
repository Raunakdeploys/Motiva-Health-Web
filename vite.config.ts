import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // The v0 preview proxy does not forward Vite's HMR WebSocket. Keeping HMR
      // disabled prevents @vite/client from retrying a socket that cannot open.
      hmr: false,
      watch: null,
      allowedHosts: true as const,
    },
    preview: {
      allowedHosts: true as const,
    },
    build: {
      chunkSizeWarningLimit: 1200,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('pdfjs-dist')) return 'pdf';
              if (id.includes('react')) return 'vendor';
            }
          },
        },
      },
    },
  };
});
