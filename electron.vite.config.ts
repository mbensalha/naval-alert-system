
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'electron/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    target: 'electron-main',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
