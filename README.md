# Cheapside

The twenty cheapest companies on B3, ranked by EV/EBIT, with every input of every rank on the page
next to it.

**[giovani-freitag.github.io/cheapside](https://giovani-freitag.github.io/cheapside/)**

## What it is

A quantitative screener. It reads every company listed on B3 out of the CVM's public filings,
ranks them by what the whole enterprise costs against what it earns, and publishes the twenty at
the top — along with the two hundred and eighty it removed and the reason for each removal.

The strategy is the one Clube do Valor publishes as *As 20 Ações Mais Baratas da Bolsa*, which is
in turn a Brazilian implementation of Carlisle's Acquirer's Multiple. The complete rules, the
argument for each threshold, and what the metric still gets wrong are in
**[docs/strategy.md](docs/strategy.md)**.

Not investment advice, and not a claim that cheap means good. The twenty cheapest on any metric
include companies that are cheap because they deserve to be.

## The decisions the brief left open

The first version of this README listed five things that had to be decided before any code was
written. They are decided; each is argued in `docs/strategy.md`.

| | decided | where |
| --- | --- | --- |
| Which exchange | B3 | — |
| What "cheap" means | EV/EBIT on trailing twelve months, and not P/E, P/B, EV/EBITDA or P/FCF | §2 |
| What is excluded | Financials, judicial recovery, illiquid, loss-making, over-levered, stale filers | §3 |
| Where the data comes from | CVM open data, B3's listing registry, brapi quotes — all free, none needing a token | §6 |
| What the output is | A static site over a dataset rebuilt in CI and committed | below |

## How it is built

Nothing runs at page load. The pipeline runs in CI, the result is committed as JSON, and the site
is a static page over it. That is what lets the whole thing live on GitHub Pages and be forked by
anyone: there is no server, no API key, and no request the reader has to trust.

```
scripts/build-screen.ts        the pipeline: fetch, join, rank, write
  └─ src/services/cvm/         CVM open data — EBIT, cash, debt, issuer standing
  └─ src/services/b3/          the listing registry — the bridge from ticker to CNPJ
  └─ src/services/quotes/      prices, turnover, market capitalisation
  └─ src/services/liquidity/   a rolling median of traded value, one session per run
  └─ src/services/universe/    the join, and what fails to cross it
  └─ src/services/screen/      the filters and the ranking
       ↓
src/data/generated/screen.json  committed, versioned, timestamped
       ↓
src/react/                      the interface, which only reads it
```

The three joins are the hard part, and none of the sources share a key: quotes arrive under a
ticker, the listing registry under a four-letter root, and filings under a CNPJ — under whichever
*establishment* of the company happened to file, which is why the join runs on the CNPJ root and
not the full number.

### Layers

`src/domain` is pure: value objects, entities and the filter rules, with no I/O, no React, and no
Node. `src/services` owns every capability that touches the outside world, one folder each.
`src/react` is the interface, and holds no logic that is not about display — the hooks read
services, the components read hooks. An arch test enforces all of it.

## Running it

```bash
npm install
npm run dev          # the site, against the committed dataset
npm run data:build   # rebuild the dataset from the sources (~2 min cold, cached after)
npm run data:verdicts # write the reading briefs for the current portfolio
npm test
npm run build
```

`data:build` downloads about 150 MB of CVM archives on a cold run and caches them in the system
temp directory, so a second run only refetches prices.

## The part that is not arithmetic

The screen answers *what is statistically cheap*. It cannot answer *why*, and the difference
between a bargain and a value trap lives entirely in the second question.

The first run made this concrete at rank one: a company at 0.97× EV/EBIT, whose figures reconcile
exactly to its filing, and whose operating profit tripled in a year because a single
operating-expense line moved by R$ 340 million. That is the shape of a provision reversal, not of
a business that got three times better, and a trailing multiple has no way to tell.

So there is a second, optional layer: a reading of the filings behind each published company,
answering three narrow questions — is the EBIT repeatable, is the balance sheet as stated, is
there a structural reason for the discount. It is produced away from this repository by a language
model, committed as JSON under `src/data/verdicts/`, and shown beside the rank as context. It
never moves the ranking, and a company nobody has read is shown as unread rather than as passing.

`npm run data:verdicts` writes one brief per portfolio company into `docs/briefs/`, each carrying
the numbers, the filing links, the three questions and the exact JSON to write back. The reading
itself is a separate step on purpose: the screen must stay reproducible by anyone with a network
connection and an account nowhere.

## Stack

Vite 8 (Rolldown), React 19, Radix primitives on a palette of this project's own with light, dark
and system themes, TypeScript, Vitest, ESLint, release-please, GitHub Pages.

## Licence

GPL-3.0-or-later.
