import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import build from '@hono/vite-cloudflare-pages'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: './src/client/client.ts',
          output: {
            entryFileNames: 'static/client.js',
            format: 'es',
          },
        },
      },
    }
  }

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
