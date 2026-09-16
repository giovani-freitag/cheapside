import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function sourcesUnder(folder: string): Promise<string[]> {
    const entries = await readdir(join(root, folder), { withFileTypes: true, recursive: true });

    return entries
        .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
        .map((entry) => join(entry.parentPath, entry.name));
}

async function importsIn(file: string): Promise<string[]> {
    const source = await readFile(file, 'utf8');

    return [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '');
}

/** Which files under a folder import something they are not allowed to, by path from the root. */
async function offenders(folder: string, forbidden: RegExp): Promise<string[]> {
    const found: string[] = [];

    for (const file of await sourcesUnder(folder)) {
        const bad = (await importsIn(file)).filter((specifier) => forbidden.test(specifier));
        if (bad.length > 0) found.push(relative(root, file).replace(/\\/g, '/'));
    }

    return found.sort((a, b) => a.localeCompare(b));
}

/** Which files call the composition root, as opposed to merely naming its types. */
async function builders(folder: string): Promise<string[]> {
    const found: string[] = [];

    for (const file of await sourcesUnder(folder)) {
        const source = await readFile(file, 'utf8');
        if (source.includes('createServices')) found.push(relative(root, file).replace(/\\/g, '/'));
    }

    return found.sort((a, b) => a.localeCompare(b));
}

describe('layering', () => {
    it('keeps the domain free of the service layer', async () => {
        const found = await offenders('src/domain', /^@\/services\//);

        expect(found).toEqual([]);
    });

    it('keeps the domain free of React', async () => {
        const found = await offenders('src/domain', /^react$|^react-|^@\/react\//);

        expect(found).toEqual([]);
    });

    it('keeps the domain free of the platform', async () => {
        const found = await offenders('src/domain', /^node:/);

        expect(found).toEqual([]);
    });

    it('keeps the service layer free of React', async () => {
        const found = await offenders('src/services', /^react$|^react-|^@\/react\//);

        expect(found).toEqual([]);
    });

    it('keeps the zip library behind the one service that owns it', async () => {
        const found = await offenders('src', /^fflate$/);

        expect(found).toEqual(['src/services/cvm/cvm-source.ts']);
    });

    it('keeps Radix behind the ui folder', async () => {
        const found = await offenders('src/react/components', /^radix-ui$/);

        expect(found).toEqual([]);
    });

    it('lets one file build the services and the rest only read them', async () => {
        const found = await builders('src/react');

        expect(found).toEqual(['src/react/providers/services-provider.tsx']);
    });
});
