// Music-service tests — uses root config
// Backend tests use vitest.config.js (Cloudflare Workers pool)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
