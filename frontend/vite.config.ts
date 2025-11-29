import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3001,
    host: true
  },
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
});
