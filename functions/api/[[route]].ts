/**
 * Cloudflare Pages Function Handler
 *
 * Catch-all route that forwards all /api/* requests to Hono app
 */
import { handle } from 'hono/cloudflare-pages'
import app from '../../src/server/index'

export const onRequest = handle(app)
