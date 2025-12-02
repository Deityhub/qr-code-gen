// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'], // Only check source files
            exclude: ['src/**/*.d.ts', 'src/**/types.ts', 'tests/**'], // Exclude types and tests
        },
    },
});
