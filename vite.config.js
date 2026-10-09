import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Allows any .trycloudflare.com tunnel URL
    allowedHosts: ['.trycloudflare.com']
  }
});