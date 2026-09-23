import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
    build: {
        sourcemap: true, // Enable source map generation
    lib: {
      entry: './index.js',
      name: 'ClearUI',
      fileName: (format) => `clear-ui.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
});
