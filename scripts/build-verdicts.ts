import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { RankedRow, ScreenDataset } from '@/data/schema.ts';
import { VERDICT_QUESTIONS } from '@/data/verdict.ts';
import dataset from '@/data/generated/screen.json';

const here = dirname(fileURLToPath(import.meta.url));
const briefs = join(here, '..', 'docs', 'briefs');

const CVM_SEARCH = 'https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx';

/**
 * Writes one brief per published company, for a model to read the filings against.
 *
 * The reading itself happens away from this repository and its output is committed by hand or by
 * a scheduled agent. Keeping the two apart is deliberate: the screen must be reproducible by
 * anyone with a network connection and no account anywhere, and a step that needs an API key
 * would take that away from every fork. What this script produces is the part that can be
 * generated — the numbers, the questions, and the exact shape of the answer.
 */
async function main(): Promise<void> {
    const screen = dataset as ScreenDataset;

    await mkdir(briefs, { recursive: true });
    await clear(briefs);

    for (const row of screen.portfolio) {
        await writeFile(join(briefs, `${row.ticker}.md`), brief(row), 'utf8');
    }

    console.log(`briefings escritos: ${String(screen.portfolio.length)} em docs/briefs/`);
    console.log('Cada um traz os números, as três perguntas e o JSON a ser gravado em');
    console.log('src/data/verdicts/<TICKER>.json. A leitura em si é um passo à parte.');
}

async function clear(folder: string): Promise<void> {
    for (const entry of await readdir(folder).catch(() => [])) {
        if (entry.endsWith('.md')) await unlink(join(folder, entry));
    }
}

function brief(row: RankedRow): string {
    return `# ${row.ticker} — ${row.name}

Posição ${String(row.rank)} da carteira, a ${row.multiple.toFixed(2)}× EV/EBIT.

## O que a tela calculou

| | R$ |
| --- | ---: |
| Valor de mercado | ${money(row.marketCapitalisation)} |
| Dívida bruta | ${money(row.grossDebt)} |
| Caixa e equivalentes | ${money(row.cashAndEquivalents)} |
| Aplicações financeiras | ${money(row.shortTermInvestments)} |
| **Dívida líquida** | **${money(row.netDebt)}** |
| **Valor da firma** | **${money(row.enterpriseValue)}** |
| **EBIT (12 meses)** | **${money(row.trailingEbit)}** |

- EV/EBIT: **${row.multiple.toFixed(2)}×** · earnings yield ${(row.earningsYield * 100).toFixed(1)}%
- Dívida líquida / EBIT: ${row.netDebtToEbit.toFixed(2)}×
- EBIT acumulado até ${row.earningsThrough}${row.interimAdjusted ? '' : ' (exercício fechado, sem trimestre posterior)'}
- Balanço de ${row.balanceSheetAt}
- CNPJ ${row.cnpj} · classes listadas: ${row.tickers.join(', ')}

## Onde ler

Consulta externa da CVM, por CNPJ: ${CVM_SEARCH}

Documentos que importam: a DFP do último exercício fechado, o ITR mais recente, e dentro deles as
notas explicativas sobre provisões, partes relacionadas, empréstimos e contingências, além do
relatório do auditor independente e do comentário da administração.

## As três perguntas

Responda apenas estas três. Não recomende, não dê preço-alvo e não discorde do ranking: o número
acima é aritmética conferida, e a pergunta aqui é outra.

1. **O EBIT se repete?** O valor de ${money(row.trailingEbit)} vem de operação recorrente, ou está
   inflado por venda de ativo, reversão de provisão, ganho judicial, crédito tributário
   extemporâneo ou um pico de ciclo?
2. **O balanço é o que diz ser?** Garantias fora do balanço, recebíveis com partes relacionadas,
   quebra de covenant, ressalva ou parágrafo de ênfase sobre continuidade no relatório do auditor.
3. **Há um motivo estrutural para o desconto?** Conflito com o controlador, fechamento de capital
   em curso, revisão tarifária, litígio relevante, ou um contrato que é a maior parte da receita e
   vence.

## O que gravar

Crie \`src/data/verdicts/${row.ticker}.json\` com exatamente esta forma:

\`\`\`json
{
  "ticker": "${row.ticker}",
  "model": "<o modelo que leu>",
  "reviewedAt": "<AAAA-MM-DD>",
  "earningsThrough": "${row.earningsThrough}",
  "answers": [
${VERDICT_QUESTIONS.map(
    (question) => `    {
      "question": "${question}",
      "finding": "<algumas frases, em português, sobre o que as demonstrações dizem>",
      "citation": "<documento, nota e número — p. ex. 'DFP 2025, nota 24'>",
      "weight": "clear | caution | flag"
    }`,
).join(',\n')}
  ]
}
\`\`\`

\`weight\` é \`clear\` quando nada foi encontrado, \`caution\` quando há algo a observar e \`flag\`
quando há algo que muda a leitura do múltiplo. Nunca é uma nota, e nunca move o ranking.
`;
}

function money(amount: number): string {
    return amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

await main();
