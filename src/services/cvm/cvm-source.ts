import { unzipSync } from 'fflate';
import type { HttpCacheService } from '@/services/http/http-cache-service.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface CvmSourceConfig {
    /** Root of the CVM open-data tree, without a trailing slash. */
    baseUrl: string;
    http: HttpCacheService;
    /** How long a downloaded archive stays good. Filings are settled history, so: a day. */
    ttlMinutes?: number;
}

const DEFAULT_TTL = 24 * 60;

/**
 * The CVM's open-data tree, decompressed a member at a time.
 *
 * A year of statements is nineteen files, of which three matter; the shareholders' equity
 * movement alone is two hundred megabytes. Inflating one member per call keeps the peak memory to
 * the size of the file actually being read rather than the size of the archive.
 *
 * A file that is not there yet — a financial year that has not closed — comes back as nothing
 * rather than as an error, because its absence is a date on the calendar and not a fault.
 */
export class CvmSource {
    private readonly baseUrl: string;
    private readonly http: HttpCacheService;
    private readonly ttlMinutes: number;
    private readonly decoder = new TextDecoder('latin1');

    constructor(config: CvmSourceConfig) {
        this.baseUrl = config.baseUrl;
        this.http = config.http;
        this.ttlMinutes = config.ttlMinutes ?? DEFAULT_TTL;
    }

    /**
     * Reads one member out of a zipped archive.
     *
     * @param archive - Path below the base URL, e.g. `DOC/ITR/DADOS/itr_cia_aberta_2026.zip`.
     * @param member - File name inside the archive.
     * @returns The member decoded out of Latin-1, or nothing when archive or member is absent.
     * @throws DomainError when the archive is present but cannot be decompressed.
     */
    public async readMember(archive: string, member: string): Promise<string | undefined> {
        const bytes = await this.bytes(archive);
        if (!bytes) return undefined;

        try {
            const members = unzipSync(bytes, { filter: (file) => file.name === member });
            const found = members[member];

            return found ? this.decoder.decode(found) : undefined;
        } catch (cause) {
            throw new DomainError(`O arquivo ${archive} da CVM não pôde ser descompactado.`, { cause });
        }
    }

    /**
     * Reads a plain file out of the tree.
     *
     * @param path - Path below the base URL, e.g. `CAD/DADOS/cad_cia_aberta.csv`.
     * @returns The file decoded out of Latin-1, or nothing when it is absent.
     */
    public async readText(path: string): Promise<string | undefined> {
        const bytes = await this.bytes(path);

        return bytes ? this.decoder.decode(bytes) : undefined;
    }

    private bytes(path: string): Promise<Uint8Array | undefined> {
        return this.http.fetchBytes(`${this.baseUrl}/${path}`, { ttlMinutes: this.ttlMinutes });
    }
}
