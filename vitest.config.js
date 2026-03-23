import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'client/**/*.test.tsx', 'shared/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.vercel-build', '.idea', '.git', '.cache', 'Nursing-Rocks-Concerts-Live-Site-OLD'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.vercel-build/',
        '**/*.config.js',
        '**/index.ts',
        '**/*.d.ts',
        'migrations/',
        'scripts/',
        'public/'
      ],
      lines: 98,
      functions: 98,
      branches: 98,
      statements: 98,
      ignoreEmptyLines: true,
      skipFull: false,
      thresholdAutoUpdate: false
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  }
});
