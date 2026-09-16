import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { HttpCacheService } from '@/services/http/http-cache-service.ts';

const URL = 'https://example.test/data.json';

function respondWith(body: string, status = 200): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            Promise.resolve({
                ok: status >= 200 && status < 300,
                status,
                arrayBuffer: () => Promise.resolve(new TextEncoder().encode(body).buffer),
            }),
        ),
    );
}

function callCount(): number {
    return vi.mocked(globalThis.fetch).mock.calls.length;
}

describe('HttpCacheService', () => {
    let directory: string;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'cheapside-test-'));
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        await rm(directory, { recursive: true, force: true });
    });

    it('fetches on the first call', async () => {
        respondWith('{"a":1}');
        const service = new HttpCacheService({ directory });

        await service.fetchJson(URL, { ttlMinutes: 60 });

        expect(callCount()).toBe(1);
    });

    it('answers the second call from disk', async () => {
        respondWith('{"a":1}');
        const service = new HttpCacheService({ directory });

        await service.fetchJson(URL, { ttlMinutes: 60 });
        await service.fetchJson(URL, { ttlMinutes: 60 });

        expect(callCount()).toBe(1);
    });

    it('gives back the same body it stored', async () => {
        respondWith('{"a":1}');
        const service = new HttpCacheService({ directory });

        await service.fetchJson(URL, { ttlMinutes: 60 });
        const second = await service.fetchJson<{ a: number }>(URL, { ttlMinutes: 60 });

        expect(second).toEqual({ a: 1 });
    });

    it('refetches once the copy is older than its time to live', async () => {
        respondWith('{"a":1}');
        const service = new HttpCacheService({ directory });

        await service.fetchJson(URL, { ttlMinutes: 60 });
        await service.fetchJson(URL, { ttlMinutes: 0 });

        expect(callCount()).toBe(2);
    });

    it('ignores the stored copy entirely when told to bypass', async () => {
        respondWith('{"a":1}');

        await new HttpCacheService({ directory }).fetchJson(URL, { ttlMinutes: 60 });
        await new HttpCacheService({ directory, bypass: true }).fetchJson(URL, { ttlMinutes: 60 });

        expect(callCount()).toBe(2);
    });

    it('keeps two URLs apart', async () => {
        respondWith('{"a":1}');
        const service = new HttpCacheService({ directory });

        await service.fetchJson(URL, { ttlMinutes: 60 });
        await service.fetchJson('https://example.test/other.json', { ttlMinutes: 60 });

        expect(callCount()).toBe(2);
    });

    it('reports a missing resource as nothing rather than as a failure', async () => {
        respondWith('', 404);
        const service = new HttpCacheService({ directory });

        await expect(service.fetchBytes(URL, { ttlMinutes: 60 })).resolves.toBeUndefined();
    });

    it('does not store a failure as if it were an answer', async () => {
        respondWith('boom', 500);
        const service = new HttpCacheService({ directory });

        await expect(service.fetchBytes(URL, { ttlMinutes: 60 })).rejects.toThrow(DomainError);
    });

    it('refuses a body that is not the JSON it claimed to be', async () => {
        respondWith('<html>nope</html>');
        const service = new HttpCacheService({ directory });

        await expect(service.fetchJson(URL, { ttlMinutes: 60 })).rejects.toThrow(DomainError);
    });
});
