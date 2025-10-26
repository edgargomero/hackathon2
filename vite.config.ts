import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import build from '@hono/vite-cloudflare-pages'

export default defineConfig({
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
})
