import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  define: {
    'import.meta.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:4587'),
  },
});
