# The cheapest-companies strategy

What Clube do Valor calls *As 20 Ações Mais Baratas da Bolsa*, reconstructed from their public
material and from the literature it descends from, written out completely enough to implement.

Nothing here is investment advice. It is a specification for a screener.

## 1. Where it comes from

The strategy is a Brazilian implementation of a lineage that is well documented in English:

| | | |
| --- | --- | --- |
| Graham (1934) | net-net, low P/E | buy statistical cheapness, hold a basket, ignore the story |
| Greenblatt (2005) | *Magic Formula* | rank on earnings yield **and** return on capital, sum the ranks |
| Gray & Carlisle (2012) | *Quantitative Value* | the quality half adds less than it costs; test it |
| Carlisle (2014) | *The Acquirer's Multiple* | **EV/EBIT alone** beats the two-factor Magic Formula |

Carlisle's finding is the load-bearing one. Testing the Magic Formula's two components separately
on US data 1973–2011, the cheapness rank (earnings yield) carried essentially all of the return;
adding the quality rank (ROIC) *reduced* it, because high ROIC is precisely what stops a cheap
stock from being cheap. His single-factor screen on the 30 lowest EV/EBIT names above a USD 1bn
market cap returned 17.9% CAGR from 1973.

Clube do Valor's product is that screen, run on B3, with safety filters and a quarterly rebalance.
Their analyst Gabriel Roman's Brazilian backtest (2000–2020) reports:

| variant | CAGR |
| --- | --- |
| Earnings yield only | 29.17% |
| Earnings yield + momentum overlay | 30.66% |
| Ibovespa | 9.68% |

Sharpe of 0.80 on the momentum variant. Quarterly rebalancing tested better than annual on B3 —
the opposite of the US result, which is what you would expect from a market where the mispricing
is larger and mean-reverts faster. Their sales page quotes 3,643% cumulative over 2004–2025,
roughly six times the Ibovespa, with the drawdowns of 2008, 2015 and 2020 recovered in each case.
The fund built on it holds 20 names at 5% each and is reviewed quarterly.

Those numbers are theirs, gross of taxes and transaction costs, and this project does not
reproduce them. They are recorded here because the strategy's *shape* is only defensible if you
know what it was fitted to.

## 2. The metric

The rank is **TEV/EBIT** — total enterprise value over operating profit. Its reciprocal is the
earnings yield, and sorting ascending on the multiple is identical to sorting descending on the
yield.

```
TEV  = market capitalisation (all share classes)
     + gross debt
     - cash and cash equivalents
     - short-term financial investments

EBIT = operating profit before the financial result and before taxes
       (CVM account 3.05, trailing twelve months)

rank = TEV / EBIT, ascending
```

### Why this multiple and not the other four

The brief listed P/E, P/B, EV/EBITDA and P/FCF as competing readings of the word *cheap*. They are
not equally good, and the argument for EV/EBIT is specific.

**Against P/E.** The denominator sits below the financial result, so a leveraged company and an
unleveraged one with identical operations get different P/Es purely from their capital structure.
In Brazil, where the policy rate has spent most of two decades in double digits, the financial
line is frequently larger than the operating line, and P/E becomes mostly a reading of the
interest bill. Worse, the numerator is equity value only, so a company can look cheap on P/E while
carrying debt that makes the whole business expensive.

**Against P/B.** Book equity is historical cost less depreciation. It measures what was paid, not
what is owned. It works on balance sheets made of hard assets and fails on the ones made of
brands, software and contracts. It fails in the other direction on Brazilian utilities and
concessionaires, whose regulatory asset bases are revalued on schedules unrelated to market value.

**Against EV/EBITDA.** EBITDA is the right numerator only if depreciation is not a real cost. For
a shopping-centre operator that is arguably true; for a steel mill, a shipping line or a telco it
is a fiction that flatters exactly the capital-intensive companies that most need the charge. EBIT
keeps the depreciation and therefore keeps maintenance capex honest, which is why Greenblatt and
Carlisle both used it.

**Against P/FCF.** Free cash flow is the most economically correct measure and the noisiest. Capex
is lumpy: a company that built a plant this year looks dreadful and one that deferred maintenance
looks superb, so the screen would be ranking on the timing of construction projects. It is a good
*check* on a name the screen surfaces and a bad *sort key*.

EV/EBIT is the compromise the literature converged on: capital-structure neutral like EV/EBITDA,
depreciation-honest like P/E, and stable enough to sort on.

### What EV/EBIT still gets wrong

Worth stating, because the screen will surface these and the interface has to show them.

- **Cyclical peaks.** A commodity producer at the top of its cycle has peak EBIT and therefore a
  low multiple. It is cheap against earnings it will not repeat. This is the most common failure
  mode on B3, where mining, steel, pulp and oil are a large share of the market.
- **One-off gains inside 3.05.** Asset disposals, reversals of provisions and legal wins land
  above the financial result and inflate EBIT. A normalised EBIT would exclude them; a screen
  cannot tell them apart without reading the notes.
- **Equity-method income.** Account 3.04.06 (*Resultado de Equivalência Patrimonial*) is inside
  3.05 but is not operating profit the parent controls, and the associate's own debt is not in the
  parent's enterprise value.
- **Holdings and structurally complex groups.** Enterprise value assumes one consolidated economic
  entity. A holding whose value is a minority stake in a listed subsidiary breaks that assumption
  in both the numerator and the denominator.

## 3. The universe and the filters

Filters apply in order. Each removes companies for a stated reason, and every removal is recorded
so a reader can disagree with it rather than wonder where a name went.

### 3.1 Listing filter — what counts as a company

- Source: B3's listed-companies registry, joined to CVM's registry by CNPJ.
- One row per **company**, not per ticker. A company with ON and PN classes is one candidate, and
  the multiple uses the *sum* of all classes' market capitalisation, because enterprise value is a
  property of the enterprise and not of a share class.
- The ticker quoted for the position is the most liquid class.
- BDRs, ETFs, FIIs and fixed-income vehicles are out: they are not operating companies with a CVM
  income statement.

### 3.2 Sector exclusion — banks, insurers, and everything that lends

**Excluded:** banks, insurers, reinsurers, brokers, exchanges, securitisers, credit fintechs, and
holdings whose consolidated statement is a financial statement.

The reason is not prudence, it is arithmetic. For a financial company debt *is* the raw material.
Deposits and funding lines are not a claim on the enterprise the way a factory's loans are — they
are its inventory. Adding them to market cap produces an enterprise value that means nothing. And
there is no EBIT: the CVM income statement for a financial company begins at 3.01 *Receitas de
Intermediação Financeira* and has no account 3.05 at all. The metric is undefined, not merely
unreliable.

Detection is therefore structural rather than by sector label — a company is financial when its
consolidated income statement has no account 3.05. That catches the holdings a sector label misses.

Banks can still be cheap. Ranking them needs P/B against ROE, which is a different screen, and
mixing the two into one list would be dishonest about what the number means.

### 3.3 Going-concern exclusion — judicial recovery

**Excluded:** any issuer whose CVM registry status (`SIT_EMISSOR`) is *EM RECUPERAÇÃO JUDICIAL OU
EQUIVALENTE*, *FALIDA* or *LIQUIDAÇÃO EXTRAJUDICIAL*.

A company in judicial recovery is cheap because its equity may be worth nothing, and the screen
cannot price the probability of the plan succeeding. Including it would put the screen's worst
outcomes at the top of its own list. Suspended and cancelled registrations go too — they have no
current statements to read.

### 3.4 Profitability filter — negative EBIT

**Excluded:** trailing-twelve-month EBIT ≤ 0.

A negative denominator produces a negative multiple, which sorts *below* every genuinely cheap
company and would fill the top of the list with the worst businesses on the exchange. This is not
a judgement that loss-making companies are bad investments; it is that the ranking function is
meaningless for them.

### 3.5 Liquidity filter

**Excluded:** median daily traded value below **R$ 1,000,000** over the sessions on record.

Clube do Valor's published floor is R$ 200,000/day. That is a floor for a retail investor with a
small position, and it is too low to be honest here: a screen that quotes a price nobody can
transact at is quoting a fiction. The higher floor costs some genuinely cheap microcaps and buys a
list that can actually be bought. It is a parameter, and it is exposed as one.

Median rather than mean, because a single block trade should not qualify a stock for two months.

**The window is smaller than sixty, and says so.** The free quote source publishes one session's
turnover, not a history. Rather than call a single day a median, the pipeline records each session
it runs and takes the median of the sessions on record — one at first, sixty eventually, with the
count carried beside the figure so nobody mistakes a thin measurement for a thick one. Weekly
rebuilds mean the window reaches a quarter of real coverage in about three months.

### 3.6 Leverage filter

**Excluded:** net debt / **EBIT** above 4.0, where net debt is positive.

A company can reach a low EV/EBIT by being cheap or by being close to default — in the second case
the low multiple is the market pricing the equity as an option on survival. The conventional
covenant in Brazilian debentures is three turns of EBITDA, and that is the ratio this filter wants.

It is not the ratio it uses. Depreciation and amortisation are not a fixed account in the CVM's
chart: they appear in the cash-flow statement under descriptions each company writes for itself,
so reconstructing EBITDA across two thousand filers means matching free text and being wrong about
some of them silently. EBIT is a published number. Since EBIT is smaller than EBITDA, the same
strictness needs a looser cap, and four turns is roughly where three turns of EBITDA lands for a
typical industrial. A defensible ratio on a figure the source publishes beats a better ratio on
one inferred.

Companies with net cash pass automatically.

### 3.7 Data-freshness filter

**Excluded:** no consolidated statement with a reference date inside the last 8 months.

Delinquent filing correlates with everything the other filters are trying to avoid.

## 4. Building the portfolio

| decision | value | why |
| --- | --- | --- |
| positions | 20 | Greenblatt used 30, Carlisle 30, Clube do Valor 20. Below ~15 a single blow-up dominates; above ~30 the screen dilutes into the index. |
| weights | equal, 5% each | The screen has no opinion on which of its picks is best. Any other weighting smuggles one in. |
| rebalance | quarterly | Follows the Brazilian backtest, and tracks the ITR filing calendar, so the fundamentals actually change between rebalances. |
| turnover | full rotation | The screen is recomputed from scratch and the portfolio becomes the new top 20. A name still in the top 20 is simply held. |
| sell trigger | falling out of the top 20 | No stop, no target price, no discretionary exit. Adding one would make the strategy discretionary, which is the thing it was built to avoid. |

Rebalancing on the first trading day of the month after each ITR/DFP deadline lets the filings land
before the screen reads them.

### The momentum overlay

The better Brazilian variant sorts the cheap candidates by 12-month price momentum (excluding the
most recent month) and takes the top 20 of the cheapest ~40. It picks up the documented interaction
between value and momentum: cheap-and-still-falling is where value traps live, cheap-and-recovering
is where the returns are.

It added 1.5 percentage points of CAGR in their test. This project implements it as an **optional,
off-by-default** second sort, because a 1.5pp edge measured once, on one market, over one period,
is inside the range where the honest answer is that it might be the fit rather than the effect.

## 5. What the screen cannot do

The brief is right that the cheapest ten will contain companies that are cheap because they deserve
to be, and that separating them is a harder project. This is the boundary.

The screen answers *what is statistically cheap*. It cannot answer *why*. The why lives in the
management discussion, the risk factors, the notes on contingencies, the related-party transactions
and the auditor's opinion — prose, not numbers.

That gap is where a language model earns its place in this project, and nowhere else. Its job is
not to pick stocks and not to move the rank. Its job is to read the filings behind a name the
screen surfaced and answer three narrow questions:

1. **Is the EBIT repeatable?** Is the trailing figure inflated by disposals, provision reversals,
   litigation wins, or a cycle peak?
2. **Is the balance sheet as stated?** Off-balance-sheet guarantees, related-party receivables,
   covenant breaches, going-concern language in the auditor's opinion.
3. **Is there a structural reason for the discount?** Controlling-shareholder conflicts, a pending
   delisting, a regulated business facing a tariff review, a contract that is most of revenue and
   expires.

Each answer is a short passage with a citation to the filing, produced offline, committed to the
repository, and displayed beside the rank as *context* — never as a score, never as a filter. A
name with no verdict is shown as unanalysed rather than as passing.

## 6. Data sources

All of them are free, none needs a token, and all are read at build time rather than from the
browser.

| what | source | notes |
| --- | --- | --- |
| Financial statements | [CVM open data](https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/), ITR and DFP | Official and standardised. EBIT is 3.05; cash is 1.01.01 + 1.01.02; debt is 2.01.04 + 2.02.01; equity is 2.03. Latin-1, semicolon-delimited, one zip per year. |
| Issuer registry | [CVM `cad_cia_aberta.csv`](https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/) | Carries `SIT_EMISSOR`, the judicial-recovery flag, and `SETOR_ATIV`. |
| Ticker ↔ CNPJ | B3 listed-companies registry | The bridge between the accounting world (CNPJ, CD_CVM) and the market world (tickers). |
| Prices, volume, market cap | [brapi.dev](https://brapi.dev) `/api/quote/list` | The list endpoint is open without a token; the per-ticker fundamentals endpoint is not, and is not needed. |

A token would have to ship inside the bundle for a browser-side call, which is the reason the
pipeline runs in CI and its result is committed. The screener is a static site over a dataset with
a timestamp on it.

## 7. Parameters, collected

Every threshold above in one place, because they are choices and not findings.

```
positions            20
weighting            equal (5% each)
rebalance            quarterly
rank                 TEV / EBIT (TTM), ascending
momentum overlay     off
liquidity floor      R$ 1,000,000 median daily, over up to 60 recorded sessions
net debt / EBIT cap  4.0
minimum EBIT         > 0
statement staleness  8 months
excluded             financials, judicial recovery, non-operating vehicles
```

## 8. What the first run found

The screen's own output is the best test of the caveats above, and the first run made one of them
concrete immediately.

The cheapest company on the exchange came out at **0.97× EV/EBIT** — the whole enterprise for less
than one year of operating profit. The arithmetic is right: the figures reconcile to the filing to
the last thousand reais. What produced it is that the company's *Despesas/Receitas Operacionais*
line moved by about R$ 340 million between two financial years, tripling operating profit without
revenue moving at all. That is the shape of a provision reversal or a disposal, not of a business
that got three times better, and the trailing multiple has no way to know the difference.

It is exactly §2's second failure mode, arriving at rank one on the first run. The screen is not
wrong to publish it; publishing it and saying nothing about why would be. That is the job the
reading in §5 exists to do, and the interface marks an unread company as unread rather than
leaving the space where the reading would go blank.

Banks, insurers and brokers were the other thing the first run taught. The plan in §3.2 was to
detect them by the absence of account 3.05 — and every one of them files a 3.05. The CVM fixes the
code and not the layout: an industrial company puts *Resultado Antes do Resultado Financeiro e dos
Tributos* there, a bank puts *Resultado Antes dos Tributos sobre o Lucro*, which is the same code
holding a figure struck after the financial result rather than before it, and an insurer puts a
residual operating line. Ranking on the code alone put Santander and Banco BMG in the portfolio and
pushed Itaú and Banco do Brasil into the over-leveraged bucket, which is the arithmetic nonsense
§3.2 predicted, arriving through a door it had not thought to watch. The layout is read from the
line's description instead.

## Sources

- [As 20 Ações Mais Baratas da Bolsa — Clube do Valor](https://clubedovalor.com.br/20-acoes-mais-baratas/)
- [Como Comprar Ações Baratas e Vender as Caras — Clube do Valor](https://clubedovalor.com.br/blog/acoes-baratas/)
- [Magic Formula: o método dos maiores investidores do mundo — Clube do Valor](https://clubedovalor.com.br/blog/magic-formula/)
- [Magic Formula de Joel Greenblatt: como aplicar no Brasil — brapi.dev](https://brapi.dev/blog/magic-formula-joel-greenblatt-brasil-2026)
- [Clube do Valor Ações Baratas FIF — Mais Retorno](https://maisretorno.com/fundo/clube-do-valor-acoes-baratas-fif)
- [The Acquirer's Multiple — Tobias Carlisle](https://acquirersmultiple.com/)
- [Portal de Dados Abertos da CVM](https://dados.cvm.gov.br/dataset/cia_aberta-doc-itr)
