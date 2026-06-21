import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces and use a fixed port so the Docker container is
    // reachable from the host.
    host: true,
    port: 5173,
  },
});
