import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import manifest from './package.json' with { type: 'json' };

export default defineConfig({
    // GitHub Pages serves the project from a subpath, and a relative base survives both that and
    // a local `vite preview` without a second build.
    base: './',
    // The footer names the running version, the dataset it was built from, and where it came from.
    define: {
        __APP_VERSION__: JSON.stringify(manifest.version),
        __APP_REPOSITORY__: JSON.stringify(manifest.repository.url),
    },
    plugins: [react()],
    server: {
        host: true,
        port: 5175,
        strictPort: true,
    },
    preview: {
        host: true,
        port: 5175,
        strictPort: true,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: 'es2022',
        cssCodeSplit: true,
        reportCompressedSize: false,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (!id.includes('node_modules')) return undefined;

                    if (/node_modules[\\/]react(-dom)?[\\/]/.test(id)) return 'v-react';
                    if (/lucide/.test(id)) return 'v-lucide';
                    if (/radix|floating-ui|aria-hidden|react-remove-scroll|react-style-singleton/.test(id)) {
                        return 'v-radix';
                    }

                    return 'v-outros';
                },
            },
        },
    },
});
