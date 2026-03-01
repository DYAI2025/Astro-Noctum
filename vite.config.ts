import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/calculate': {
          target: env.VITE_BAFE_BASE_URL || 'https://bafe.vercel.app',
          changeOrigin: true,
        },
        // Server-side routes → local Express server (run: PORT=3001 node server.mjs)
        '/api/auth': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/profile': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/agent': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
