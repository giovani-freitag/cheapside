import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { LiquidityHistory } from '@/services/liquidity/types.ts';
import type { Quote } from '@/services/quotes/quotes-service.ts';
import type { SourceStamp } from '@/data/schema.ts';
import { B3Service } from '@/services/b3/b3-service.ts';
import { CvmService } from '@/services/cvm/cvm-service.ts';
import { CvmSource } from '@/services/cvm/cvm-source.ts';
import { HttpCacheService } from '@/services/http/http-cache-service.ts';
import { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import { QuotesService } from '@/services/quotes/quotes-service.ts';
import { UniverseService } from '@/services/universe/universe-service.ts';
import { toSnapshot } from '@/data/snapshot.ts';

const CVM_BASE = 'https://dados.cvm.gov.br/dados/CIA_ABERTA';
const B3_BASE = 'https://sistemaswebb3-listados.b3.com.br/listedCompaniesProxy/CompanyCall/GetInitialCompanies';
const QUOTES_BASE = 'https://brapi.dev/api';

/** How many sessions of turnover to keep. The strategy asks for sixty; this is that window. */
const LIQUIDITY_WINDOW = 60;

const here = dirname(fileURLToPath(import.meta.url));
const generated = join(here, '..', 'src', 'data', 'generated');

/**
 * Reads the three sources and freezes what they said into a snapshot.
 *
 * This is the half of the pipeline that costs network, and it is deliberately the half that
 * decides nothing: no filter runs here, no threshold is applied, no ranking is produced. What
 * comes out is the universe as the sources described it, so that changing the screen never means
 * asking them again.
 *
 * Pass `--fresh` to ignore the HTTP cache, for the day a source is suspected of being wrong.
 */
async function main(): Promise<void> {
    const capturedAt = new Date();
    const http = new HttpCacheService({ bypass: process.argv.includes('--fresh') });

    const quotes = await new QuotesService({ baseUrl: QUOTES_BASE, http }).fetchQuotes();
    console.log(`cotações: ${String(quotes.size)} classes`);

    const liquidity = await recordTurnover(quotes, capturedAt);
    const liquidityService = new LiquidityService({ history: liquidity, window: LIQUIDITY_WINDOW });

    const issuers = await new B3Service({ baseUrl: B3_BASE, http }).fetchIssuers();
    console.log(`registro B3: ${String(issuers.size)} emissores`);

    const cvm = new CvmService({
        source: new CvmSource({ baseUrl: CVM_BASE, http }),
        years: recentYears(capturedAt),
    });
    const registry = await cvm.fetchRegistry();
    console.log(`cadastro CVM: ${String(registry.size)} companhias`);

    const statements = await cvm.fetchStatements();
    console.log(`demonstrações CVM: ${String(statements.size)} companhias`);

    const universe = new UniverseService({ liquidity: liquidityService }).assemble({
        issuers,
        quotes,
        registry,
        statements,
    });

    const snapshot = toSnapshot(universe, {
        capturedAt: capturedAt.toISOString(),
        sources: sourceStamps(capturedAt.toISOString()),
    });

    await mkdir(generated, { recursive: true });
    await writeFile(join(generated, 'snapshot.json'), `${JSON.stringify(snapshot, null, 1)}\n`, 'utf8');

    console.log(
        `snapshot: ${String(snapshot.companies.length)} empresas, ` +
            `${String(universe.candidates.length)} com demonstrações legíveis`,
    );
    console.log('Rode `npm run data:screen` para recalcular a tela sem tocar na rede.');
}

async function recordTurnover(quotes: ReadonlyMap<string, Quote>, asOf: Date): Promise<LiquidityHistory> {
    const path = join(generated, 'liquidity.json');
    const history = await readHistory(path);
    const tradedValue: Record<string, number> = {};

    for (const quote of quotes.values()) {
        tradedValue[quote.ticker] = quote.shareVolume * quote.price;
    }

    const updated = new LiquidityService({ history, window: LIQUIDITY_WINDOW }).observe({
        on: asOf.toISOString().slice(0, 10),
        tradedValue,
    });

    await mkdir(generated, { recursive: true });
    await writeFile(path, `${JSON.stringify(updated)}\n`, 'utf8');

    return updated;
}

async function readHistory(path: string): Promise<LiquidityHistory> {
    try {
        return JSON.parse(await readFile(path, 'utf8')) as LiquidityHistory;
    } catch {
        return { observations: [] };
    }
}

/**
 * Which years of filings to read.
 *
 * Three, because a trailing sum needs a closed financial year and the current year has none until
 * the annual filings land in the spring — and because a company that listed last year has its
 * first closed year two calendars back.
 */
function recentYears(asOf: Date): number[] {
    const year = asOf.getUTCFullYear();

    return [year - 2, year - 1, year];
}

function sourceStamps(retrievedAt: string): SourceStamp[] {
    return [
        {
            name: 'CVM — Dados Abertos (ITR e DFP)',
            url: 'https://dados.cvm.gov.br/dataset/cia_aberta-doc-itr',
            retrievedAt,
            provides: 'Lucro operacional, lucro líquido, caixa, dívida e patrimônio líquido.',
        },
        {
            name: 'CVM — Cadastro de companhias abertas',
            url: 'https://dados.cvm.gov.br/dataset/cia_aberta-cad',
            retrievedAt,
            provides: 'Situação do emissor, incluindo recuperação judicial, e o setor de atividade.',
        },
        {
            name: 'B3 — Empresas listadas',
            url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm',
            retrievedAt,
            provides: 'A ponte entre o código de negociação e o CNPJ da companhia.',
        },
        {
            name: 'brapi',
            url: 'https://brapi.dev',
            retrievedAt,
            provides: 'Preço de fechamento, volume negociado e valor de mercado.',
        },
    ];
}

await main();
