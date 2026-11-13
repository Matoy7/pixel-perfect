import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://matoy7.github.io/pixel-perfect/
export default defineConfig({
  base: '/pixel-perfect/',
  plugins: [react()],
});
