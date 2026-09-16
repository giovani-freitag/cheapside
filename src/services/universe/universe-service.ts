import type { IssuerRecord, StatementRecord } from '@/services/cvm/types.ts';
import type { ExcludedCompany } from '@/services/screen/types.ts';
import type { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import type { ListedIssuer } from '@/services/b3/b3-service.ts';
import type { Quote } from '@/services/quotes/quotes-service.ts';
import { Candidate } from '@/domain/entities/candidate.ts';
import { Company } from '@/domain/entities/company.ts';
import { Financials } from '@/domain/entities/financials.ts';
import { Listing } from '@/domain/entities/listing.ts';
import { TrailingEarnings } from '@/domain/values/trailing-earnings.ts';

export interface UniverseServiceConfig {
    liquidity: LiquidityService;
}

/** The four readings the universe is assembled from, each keyed the way its source keys it. */
export interface UniverseSources {
    /** Listed issuers by four-letter ticker root. */
    issuers: ReadonlyMap<string, ListedIssuer>;
    /** Closing quotes by ticker. */
    quotes: ReadonlyMap<string, Quote>;
    /** Registry records by CNPJ root. */
    registry: ReadonlyMap<string, IssuerRecord>;
    /** Filings by CNPJ root. */
    statements: ReadonlyMap<string, StatementRecord>;
}

export interface Universe {
    candidates: readonly Candidate[];
    /** Companies that could not be valued at all, with the reason already settled. */
    preExcluded: readonly ExcludedCompany[];
    /** How many operating companies were listed before anything was removed. */
    size: number;
}

/**
 * Joins quotes, the listing registry and the filings into companies the screen can rank.
 *
 * Three sources, three keys, and no two of them share one: quotes arrive under a ticker, the
 * registry under a four-letter root, and filings under a CNPJ. The join runs root to CNPJ, which
 * is the only exact bridge between the market and the accounts, and anything that fails to cross
 * it is reported rather than dropped.
 */
export class UniverseService {
    private readonly liquidity: LiquidityService;

    constructor(config: UniverseServiceConfig) {
        this.liquidity = config.liquidity;
    }

    /**
     * Assembles every listed operating company from the four readings.
     *
     * @param sources - The registry, the quotes and the filings as their sources hand them over.
     * @returns The candidates, the companies that could not become one, and the universe size.
     */
    public assemble(sources: UniverseSources): Universe {
        const candidates: Candidate[] = [];
        const preExcluded: ExcludedCompany[] = [];
        const byRoot = groupByRoot(sources.quotes);

        for (const [root, quotes] of byRoot) {
            const issuer = sources.issuers.get(root);
            if (!issuer) continue;

            const identity = sources.registry.get(issuer.cnpj.root);
            const filings = sources.statements.get(issuer.cnpj.root);
            const company = this.buildCompany({ issuer, identity, quotes });

            const financials = filings ? buildFinancials(filings) : undefined;
            if (!financials) {
                preExcluded.push({
                    ticker: company.primaryListing.ticker,
                    name: company.tradingName,
                    reason: 'no-recent-statement',
                });
                continue;
            }

            candidates.push(new Candidate({ company, financials }));
        }

        return { candidates, preExcluded, size: candidates.length + preExcluded.length };
    }

    private buildCompany(parts: {
        issuer: ListedIssuer;
        identity: IssuerRecord | undefined;
        quotes: readonly Quote[];
    }): Company {
        const { issuer, identity, quotes } = parts;
        const listings = quotes.map((quote) => {
            const turnover = this.liquidity.typical(quote.ticker);

            return new Listing({
                ticker: quote.ticker,
                price: quote.price,
                typicalTradedValue: turnover.value,
                observations: turnover.observations,
            });
        });

        return new Company({
            cnpj: issuer.cnpj,
            cvmCode: identity?.cvmCode ?? '',
            legalName: identity?.legalName ?? issuer.companyName,
            tradingName: issuer.tradingName,
            sector: quotes[0]?.sector || issuer.segment,
            // A company B3 lists but the CVM registry does not know is not one the screen can
            // vouch for the standing of, and standing is the whole content of that filter.
            status: identity?.status ?? 'inactive',
            marketCapitalisation: quotes[0]?.marketCapitalisation ?? 0,
            listings,
        });
    }
}

function groupByRoot(quotes: ReadonlyMap<string, Quote>): Map<string, Quote[]> {
    const byRoot = new Map<string, Quote[]>();

    for (const quote of quotes.values()) {
        const group = byRoot.get(quote.root);
        if (group) group.push(quote);
        else byRoot.set(quote.root, [quote]);
    }

    return byRoot;
}

/**
 * The filings turned into the figures a multiple is built from.
 *
 * Nothing comes back without both a closed financial year and a balance sheet: the first is what
 * a trailing sum is assembled on, the second is where debt and cash are read, and a multiple
 * missing either is not a cautious estimate but a different number.
 */
function buildFinancials(record: StatementRecord): Financials | undefined {
    if (!record.annual || !record.balanceSheetAt) return undefined;

    return new Financials({
        balanceSheetAt: record.balanceSheetAt,
        earnings: new TrailingEarnings({
            annual: record.annual,
            currentToDate: record.currentToDate,
            priorToDate: record.priorToDate,
        }),
        cashAndEquivalents: record.cashAndEquivalents,
        shortTermInvestments: record.shortTermInvestments,
        grossDebt: record.grossDebt,
        shareholdersEquity: record.shareholdersEquity,
        totalAssets: record.totalAssets,
        hasOperatingResultLine: record.hasOperatingResultLine,
    });
}
