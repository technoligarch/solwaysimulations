import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Points to your backend
        changeOrigin: true,
        secure: false,
        ws: true, // IMPORTANT: Allows WebSockets to work
      },
    },
  },
});