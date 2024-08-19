import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'service-worker': 'src/shared-service-worker/service-worker.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'service-worker' ? '[name].js' : 'assets/[name]-[hash].js';
        },
      },
    },
  },
})
