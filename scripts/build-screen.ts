import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { MarketSnapshot } from '@/data/snapshot.ts';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { SNAPSHOT_VERSION, fromSnapshot } from '@/data/snapshot.ts';
import { ScreenService } from '@/services/screen/screen-service.ts';
import { toDataset } from '@/data/serialise.ts';

/** How far past the portfolio the published tail runs, so a reader can see where the line fell. */
const ELIGIBLE_DEPTH = 100;

const here = dirname(fileURLToPath(import.meta.url));
const generated = join(here, '..', 'src', 'data', 'generated');

/**
 * Recomputes the published screen from the committed snapshot.
 *
 * No network, no parsing, no archives — a second of arithmetic over a file. That separation is
 * the point: a different liquidity floor, an extra filter or a portfolio of thirty is a question
 * that can be asked as often as it needs to be, instead of one that costs a round trip to four
 * public services.
 */
async function main(): Promise<void> {
    const snapshot = JSON.parse(await readFile(join(generated, 'snapshot.json'), 'utf8')) as MarketSnapshot;
    if (snapshot.snapshotVersion !== SNAPSHOT_VERSION) {
        throw new DomainError(
            `O snapshot está na versão ${String(snapshot.snapshotVersion)} e o código lê a ${String(SNAPSHOT_VERSION)}. Rode \`npm run data:capture\`.`,
        );
    }

    const universe = fromSnapshot(snapshot);
    const asOf = new Date(snapshot.capturedAt);

    const result = new ScreenService({ parameters: DEFAULT_PARAMETERS }).run({
        candidates: universe.candidates,
        preExcluded: universe.preExcluded,
        asOf,
    });

    const dataset = toDataset({
        result,
        sources: snapshot.sources,
        universeSize: universe.size,
        eligibleDepth: ELIGIBLE_DEPTH,
    });

    await writeFile(join(generated, 'screen.json'), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

    console.log(`universo: ${String(universe.size)} empresas operacionais listadas`);
    console.log(`carteira: ${String(result.portfolio.length)} posições, de ${String(result.eligible.length)} elegíveis`);
    for (const [reason, count] of Object.entries(result.tally)) {
        console.log(`  excluídas por ${reason}: ${String(count)}`);
    }
}

await main();
