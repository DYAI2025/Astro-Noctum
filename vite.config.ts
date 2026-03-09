import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
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
        '/api/interpret': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
