# Cheapside

Finding the ten cheapest companies on the exchange, and being honest about what that sentence
leaves undecided.

## What this is

A screener. It reads listed companies, ranks them by how cheap they are against what they earn or
own, and publishes the ten at the top — with the working shown, so a reader can disagree with the
ranking rather than take it on faith.

## What has to be decided before any of it is written

None of these have answers yet. They are here so the first session spends its time deciding them
rather than rediscovering that they need deciding.

**Which exchange.** B3 is the assumption until it is not. It changes the data source, the
currency, the accounting standard and the tax treatment of what the numbers mean.

**What "cheap" means.** The word carries at least four common readings, and they disagree with
each other on real companies:

| | measures | goes wrong when |
| --- | --- | --- |
| P/E | price against last year's profit | profit is one-off, negative, or heavily accrual-based |
| P/B | price against book equity | assets are intangible, or carried at stale historical cost |
| EV/EBITDA | whole enterprise against operating cash generation | debt is cheap and the capital structure is doing the work |
| P/FCF | price against cash actually left over | capex is lumpy year to year |

A screen on one of them alone is a screen for accounting artefacts. Which combination, and how
weighted, is the first real decision.

**What is excluded, and why.** Banks and insurers do not have comparable EV or EBITDA. Companies
in judicial recovery are cheap for a reason. Illiquid tickers cannot be bought at the price the
screen quotes. Each exclusion is a judgement that has to be written down, not silently applied.

**Where the data comes from.** Licence, refresh rate, and what happens when it is wrong. A screener
is only as good as the fundamentals it reads, and the free sources disagree with each other.

**What the output is.** A table, a dashboard, a scheduled report, an API. This decides the whole
shape of the project and is not yet chosen.

## What this is not

Not investment advice, and not a claim that cheap means good. The cheapest ten on any metric will
include companies that are cheap because they deserve to be. Saying which is which is a different
project, and a harder one.
