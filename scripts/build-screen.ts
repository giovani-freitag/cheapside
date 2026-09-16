import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { LiquidityHistory } from '@/services/liquidity/types.ts';
import type { SourceStamp } from '@/data/schema.ts';
import { B3Service } from '@/services/b3/b3-service.ts';
import { CvmService } from '@/services/cvm/cvm-service.ts';
import { CvmSource } from '@/services/cvm/cvm-source.ts';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import { QuotesService } from '@/services/quotes/quotes-service.ts';
import { ScreenService } from '@/services/screen/screen-service.ts';
import { UniverseService } from '@/services/universe/universe-service.ts';
import { toDataset } from '@/data/serialise.ts';

const CVM_BASE = 'https://dados.cvm.gov.br/dados/CIA_ABERTA';
const B3_BASE = 'https://sistemaswebb3-listados.b3.com.br/listedCompaniesProxy/CompanyCall/GetInitialCompanies';
const QUOTES_BASE = 'https://brapi.dev/api';

/** How many sessions of turnover to keep. The strategy asks for sixty; this is that window. */
const LIQUIDITY_WINDOW = 60;

/** How far past the portfolio the published tail runs, so a reader can see where the line fell. */
const ELIGIBLE_DEPTH = 100;

const here = dirname(fileURLToPath(import.meta.url));
const generated = join(here, '..', 'src', 'data', 'generated');

async function main(): Promise<void> {
    const asOf = new Date();
    const retrievedAt = asOf.toISOString();

    const quotesService = new QuotesService({ baseUrl: QUOTES_BASE });
    const quotes = await quotesService.fetchQuotes();
    console.log(`cotações: ${String(quotes.size)} classes`);

    const liquidity = await recordTurnover(quotes, asOf);
    const liquidityService = new LiquidityService({ history: liquidity, window: LIQUIDITY_WINDOW });

    const b3Service = new B3Service({ baseUrl: B3_BASE });
    const issuers = await b3Service.fetchIssuers();
    console.log(`registro B3: ${String(issuers.size)} emissores`);

    const cvmService = new CvmService({
        source: new CvmSource({ baseUrl: CVM_BASE }),
        years: recentYears(asOf),
    });
    const registry = await cvmService.fetchRegistry();
    console.log(`cadastro CVM: ${String(registry.size)} companhias`);

    const statements = await cvmService.fetchStatements();
    console.log(`demonstrações CVM: ${String(statements.size)} companhias`);

    const universe = new UniverseService({ liquidity: liquidityService }).assemble({
        issuers,
        quotes,
        registry,
        statements,
    });
    console.log(`universo: ${String(universe.size)} empresas operacionais listadas`);

    const result = new ScreenService({ parameters: DEFAULT_PARAMETERS }).run({
        candidates: universe.candidates,
        preExcluded: universe.preExcluded,
        asOf,
    });

    const dataset = toDataset({
        result,
        sources: sourceStamps(retrievedAt),
        universeSize: universe.size,
        eligibleDepth: ELIGIBLE_DEPTH,
    });

    await mkdir(generated, { recursive: true });
    await writeFile(join(generated, 'screen.json'), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

    report(dataset.tally, result.portfolio.length, result.eligible.length);
}

async function recordTurnover(
    quotes: Awaited<ReturnType<QuotesService['fetchQuotes']>>,
    asOf: Date,
): Promise<LiquidityHistory> {
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
    await writeFile(join(generated, 'liquidity.json'), `${JSON.stringify(updated)}\n`, 'utf8');

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
 * Three, because a trailing sum needs a closed financial year and the current year has none
 * until the annual filings land in the spring — and because a company that listed last year has
 * its first closed year two calendars back.
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
            provides: 'Lucro operacional, caixa, dívida e patrimônio líquido, das demonstrações padronizadas.',
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

function report(
    tally: Readonly<Record<string, number>>,
    portfolio: number,
    eligible: number,
): void {
    console.log(`carteira: ${String(portfolio)} posições, de ${String(eligible)} elegíveis`);
    for (const [reason, count] of Object.entries(tally)) {
        console.log(`  excluídas por ${reason}: ${String(count)}`);
    }
}

await main();
