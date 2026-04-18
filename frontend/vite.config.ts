import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal', 'onnxruntime-web'],
    include: ['fabric', 'pdf-lib'],
  },
  build: {
    rollupOptions: {
      external: (id) => id.startsWith('onnxruntime-web'),
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    headers: {
      // credentialless allows cross-origin CDN fetches (ONNX model) while still
      // enabling SharedArrayBuffer for multi-threaded WASM inference.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
