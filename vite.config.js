import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression2';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    compression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'brotli',
      ext: '.br'
    })
  ]
});
