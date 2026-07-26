import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Run all *.test.ts files anywhere in src/
    include: ['src/**/*.test.ts'],
    // Node environment (no browser APIs needed for engine tests)
    environment: 'node',
    // Clear mocks between tests
    clearMocks: true,
  },
  resolve: {
    alias: {
      // Mirror the Astro tsconfig alias so imports like '@/engine' work in tests
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
