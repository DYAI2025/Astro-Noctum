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
          // Railway deployment serves at /calculate/* (no /api prefix).
          // The old Vercel deployment (bafe.vercel.app) is no longer available.
          target: env.VITE_BAFE_BASE_URL || 'https://bafe-production.up.railway.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/calculate/, '/calculate'),
        },
        '/chart': {
          // calculateAll() calls /chart directly on FuFirE (not under /calculate/).
          target: env.VITE_BAFE_BASE_URL || 'https://bafe-production.up.railway.app',
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
        '/api/transit-state': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/contribute': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/space-weather': {
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
        '/api/experience': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/impact': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-three': ['three'],
            'vendor-motion': ['motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-zod': ['zod'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
