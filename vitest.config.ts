import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
  resolve: {
    alias: {
      // Before '@', which would otherwise claim it.
      '@/prisma': fileURLToPath(
        new URL('./src/generated/prisma', import.meta.url),
      ),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` throws outside Next; use the empty module Next resolves.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
});
