import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    include: ['test/**/*.test.{js,ts}','test/**/*.test.js','test/**/*.test.test.js','test/*.test.js','test/*.js'],
    threads: false,
    exclude: ['**/node_modules/**', '**/frontend/**'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
})
