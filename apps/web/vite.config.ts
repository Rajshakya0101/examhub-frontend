import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true, // Enable source maps for Sentry
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
          mui: ['@mui/material', '@mui/x-data-grid', '@mui/x-date-pickers'],
        },
      },
      // Exclude test files from the build
      external: ['**/test*.ts', '**/test*.js', '**/test*.tsx', '**/test*.jsx'],
    },
  },
});