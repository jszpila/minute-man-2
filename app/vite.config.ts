import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';

const getGitValue = (command: string, fallback: string) => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
};

const gitSha = getGitValue('git rev-parse --short HEAD', 'unknown');
const gitDate = getGitValue('git show -s --format=%cs HEAD', 'unknown');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
    __GIT_DATE__: JSON.stringify(gitDate),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2023',
    minify: 'terser',
    sourcemap: false,
  },
});
