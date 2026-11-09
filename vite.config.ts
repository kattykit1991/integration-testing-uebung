/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'Unit_Tests',
          root: 'src',
          environment: 'jsdom',
          setupFiles: ['setup.unit.ts'],
          include: ['**/*.unit.test.ts?(x)']
        }
      },
      {
        extends: true,
        test: {
          globals: true,
          name: 'Integration_Tests',
          root: 'src/__tests__/integration',
          environment: 'jsdom',
          setupFiles: ['setup.integration.ts'],
          include: ['**/*.int.test.ts?(x)'],
          env: { VITE_EVENTS_API_URL: 'http://localhost:3001/api' }
        }
      }
    ]
  }
});
