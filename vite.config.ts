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
          // BAFE Fly.io serves /calculate/* (no /api prefix).
          // Railway (bafe-production.up.railway.app) remains as Signatur-App fallback only;
          // the old Vercel deployment (bafe.vercel.app) is dead and removed from CSP in S-1.
          target: env.VITE_BAFE_BASE_URL || 'https://bafe-2u0e2a.fly.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/calculate/, '/calculate'),
        },
        '/chart': {
          // Proxy direct /chart requests to the BAFE backend. Frontend
          // calculateAll() uses /api/chart via the same-origin proxy below.
          target: env.VITE_BAFE_BASE_URL || 'https://bafe-2u0e2a.fly.dev',
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
        '/api/chart': {
          // Frontend calculateAll() hits /api/chart (same-origin proxy). Without
          // this rule Vite returns 404 because the only /chart rule above targets
          // BAFE directly at /chart (no /api prefix), leaving /api/chart unrouted.
          // Prod path works because server.mjs registers app.post('/api/chart').
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
