import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O backend expõe as rotas sob /api; o proxy apenas encaminha as chamadas,
// tanto no `vite dev` quanto no `vite preview`.
const apiProxy = {
  '/api': {
    target: process.env.VITE_API_TARGET || 'http://localhost:3000',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: apiProxy },
  preview: { proxy: apiProxy },
});
