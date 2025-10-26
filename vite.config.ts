import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import build from '@hono/vite-cloudflare-pages'
import preact from '@preact/preset-vite'

export default defineConfig(({ mode }) => {
  // CLIENT BUILD: Compile Preact SPA to static/client.js
  if (mode === 'client') {
    return {
      plugins: [preact()],
      build: {
        outDir: 'dist/static',
        emptyOutDir: true,
        rollupOptions: {
          input: './src/client/client.tsx',
          output: {
            entryFileNames: 'client.js',
            chunkFileNames: '[name]-[hash].js',
            assetFileNames: '[name]-[hash].[ext]',
            format: 'es',
          },
        },
      },
    }
  }

  // SERVER BUILD: Compile Hono worker to _worker.js
  return {
    plugins: [
      devServer({
        entry: 'src/server/index.tsx',
        adapter,
      }),
      build(),
    ],
    resolve: {
      alias: {
        '@': '/src',
        '@server': '/src/server',
        '@client': '/src/client',
        '@shared': '/src/shared',
      },
    },
  }
})
