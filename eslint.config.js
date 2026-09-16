import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules', '.cache', 'src/data/generated'] },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                project: ['./tsconfig.app.json', './tsconfig.node.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
            ],
            '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: false }],
        },
    },
    {
        files: ['src/react/**/*.{ts,tsx}', 'src/main.tsx'],
        extends: [reactHooks.configs.flat['recommended-latest']],
        plugins: { 'react-refresh': reactRefresh },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['src/domain/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['react', 'react-*', '@/react/*', '@/services/*', 'node:*'],
                            message: 'The domain layer depends on nothing but itself.',
                        },
                    ],
                },
            ],
            'no-restricted-globals': [
                'error',
                { name: 'window', message: 'The domain layer must stay platform-agnostic.' },
                { name: 'document', message: 'The domain layer must stay platform-agnostic.' },
                { name: 'fetch', message: 'The domain layer does no I/O.' },
            ],
        },
    },
    {
        files: ['src/services/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['react', 'react-*', '@/react/*'],
                            message: 'The service layer must stay framework-agnostic.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['tests/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },
    {
        files: ['scripts/**/*.ts'],
        languageOptions: { globals: globals.node },
        rules: {
            'no-console': 'off',
        },
    },
    {
        files: ['**/*.{js,mjs}'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { globals: globals.node },
    },
);
