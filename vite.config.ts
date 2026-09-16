import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    // Use a stable host to avoid Vite crashing when resolving network interfaces.
    // Set to true to expose the server on the local network (0.0.0.0), 
    // which is more robust for dev environments and subagents.
    host: '0.0.0.0',
    port: 3002,
    // If 3002 is already in use, Vite will fall back to an available port.
    strictPort: false,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    }
  }
});

