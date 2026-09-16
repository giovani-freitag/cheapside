import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface CvmSourceConfig {
    /** Root of the CVM open-data tree, without a trailing slash. */
    baseUrl: string;
    /** Where downloaded files are kept between runs. */
    cacheDirectory?: string;
}

/**
 * The CVM's open-data tree, fetched once and decompressed a member at a time.
 *
 * A year of statements is nineteen files, of which three matter; the shareholders' equity
 * movement alone is two hundred megabytes. Inflating one member per call keeps the peak memory
 * to the size of the file actually being read rather than the size of the archive.
 *
 * Downloads are cached on disk because a rebuilt screen usually differs only in its prices, and
 * re-fetching a hundred megabytes of unchanged filings to discover that is rude to a public
 * service. A file that is not there yet — a financial year that has not closed — comes back as
 * nothing rather than as an error, because its absence is a date on the calendar, not a fault.
 */
export class CvmSource {
    private readonly baseUrl: string;
    private readonly cacheDirectory: string;
    private readonly decoder = new TextDecoder('latin1');

    constructor(config: CvmSourceConfig) {
        this.baseUrl = config.baseUrl;
        this.cacheDirectory = config.cacheDirectory ?? join(tmpdir(), 'cheapside-cvm');
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

    private async bytes(path: string): Promise<Uint8Array | undefined> {
        const cached = join(this.cacheDirectory, path.replace(/[\\/]/g, '_'));

        try {
            return new Uint8Array(await readFile(cached));
        } catch {
            const downloaded = await this.download(`${this.baseUrl}/${path}`);
            if (!downloaded) return undefined;

            await mkdir(this.cacheDirectory, { recursive: true });
            await writeFile(cached, downloaded);

            return downloaded;
        }
    }

    private async download(url: string): Promise<Uint8Array | undefined> {
        const response = await fetch(url);
        if (response.status === 404) return undefined;
        if (!response.ok) {
            throw new DomainError(`A CVM respondeu ${String(response.status)} para ${url}.`);
        }

        return new Uint8Array(await response.arrayBuffer());
    }
}
