import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Handle API requests
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Handle WebSocket (Live Stream) requests
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      },
      // Catch-all for root websocket connections if your app uses them
      '^/socket.io': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    },
  },
});