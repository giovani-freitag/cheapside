import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import manifest from './package.json' with { type: 'json' };

export default defineConfig({
    // The interface names its own version in the footer, so the tests have to know one too.
    define: {
        __APP_VERSION__: JSON.stringify(manifest.version),
        __APP_REPOSITORY__: JSON.stringify(manifest.repository.url),
    },
    test: {
        globals: true,
        clearMocks: true,
        // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock of their own.
        environment: 'node',
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        setupFiles: ['tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/domain/**', 'src/services/**'],
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
