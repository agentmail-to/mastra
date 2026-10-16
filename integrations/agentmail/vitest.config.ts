import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit:integrations/agentmail',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
