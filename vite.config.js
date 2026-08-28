import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  root: './',
  publicDir: './public',
  plugins: [
    glsl()
  ],
  server: {
    host: true,
    port: 3000,
    open: false,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
});
