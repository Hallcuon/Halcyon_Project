import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows access from other devices on the network, including ngrok
    allowedHosts: [
      // Allows access from any ngrok address.
      // The dot at the beginning signifies a wildcard for subdomains.
      '.ngrok-free.app',
    ],
    proxy: {
      // Redirect API requests to the backend service inside Docker.
      '/api': {
        target: 'http://backend:8000',
        //https://
        changeOrigin: true,
      },
      //Якщо я захочу запустити локально НЕ в докері http://localhost:8000 - - - - - - - - - - - - - 
      // Redirect media file requests to the backend service.
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // Redirect WebSocket connections to the backend service.
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
  },
});