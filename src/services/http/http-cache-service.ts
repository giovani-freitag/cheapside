import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface HttpCacheServiceConfig {
    /** Where responses are kept between runs. */
    directory?: string;
    /** Set for a run that must ignore whatever is on disk. */
    bypass?: boolean;
}

export interface FetchOptions {
    /** How long a cached copy stays good. Zero always refetches. */
    ttlMinutes: number;
}

const DEFAULT_DIRECTORY = join(tmpdir(), 'cheapside-http');
const MINUTE = 60_000;

/**
 * Every outward request the pipeline makes, with a copy kept on disk.
 *
 * The sources are public services that owe this project nothing, and a rebuilt screen usually
 * differs only in its prices — refetching a hundred and fifty megabytes of unchanged filings to
 * discover that is rude. The cache also makes the pipeline debuggable: the second run of a build
 * that failed halfway is seconds rather than minutes, and it exercises the same bytes.
 *
 * Time to live is the caller's decision because the sources move at different speeds. A year of
 * filings is settled history; a closing price is not.
 */
export class HttpCacheService {
    private readonly directory: string;
    private readonly bypass: boolean;

    constructor(config: HttpCacheServiceConfig = {}) {
        this.directory = config.directory ?? DEFAULT_DIRECTORY;
        this.bypass = config.bypass ?? false;
    }

    /**
     * Fetches a URL, answering from disk while the cached copy is still within its time to live.
     *
     * @param url - The absolute URL to read.
     * @param options - How long a stored copy stays good.
     * @returns The body, or nothing when the source answers 404.
     * @throws DomainError when the source answers with any other failure.
     */
    public async fetchBytes(url: string, options: FetchOptions): Promise<Uint8Array | undefined> {
        const path = this.pathFor(url);

        if (!this.bypass && (await this.isFresh(path, options.ttlMinutes))) {
            return new Uint8Array(await readFile(path));
        }

        const response = await fetch(url);
        if (response.status === 404) return undefined;
        if (!response.ok) {
            throw new DomainError(`${url} respondeu ${String(response.status)}.`);
        }

        const body = new Uint8Array(await response.arrayBuffer());
        await mkdir(this.directory, { recursive: true });
        await writeFile(path, body);

        return body;
    }

    /**
     * Fetches a URL and reads the body as JSON.
     *
     * @param url - The absolute URL to read.
     * @param options - How long a stored copy stays good.
     * @returns The parsed body, or nothing when the source answers 404.
     * @throws DomainError when the body is not the JSON it claimed to be.
     */
    public async fetchJson<T>(url: string, options: FetchOptions): Promise<T | undefined> {
        const bytes = await this.fetchBytes(url, options);
        if (!bytes) return undefined;

        try {
            return JSON.parse(new TextDecoder().decode(bytes)) as T;
        } catch (cause) {
            throw new DomainError(`${url} não devolveu JSON.`, { cause });
        }
    }

    private async isFresh(path: string, ttlMinutes: number): Promise<boolean> {
        if (ttlMinutes <= 0) return false;

        try {
            const age = Date.now() - (await stat(path)).mtimeMs;

            return age < ttlMinutes * MINUTE;
        } catch {
            return false;
        }
    }

    /** A URL can be any length and hold any character, so the file is named after its digest. */
    private pathFor(url: string): string {
        return join(this.directory, createHash('sha256').update(url).digest('hex').slice(0, 32));
    }
}
