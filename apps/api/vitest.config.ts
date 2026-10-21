import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    // Resolve the shared package from source
    alias: {
      '@azurequest/shared': '../../packages/shared/src/index.ts',
    },
  },
});
