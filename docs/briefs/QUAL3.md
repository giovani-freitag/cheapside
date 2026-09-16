# QUAL3 — QUALICORP

Posição 9 da carteira, a 4.07× EV/EBIT.

## O que a tela calculou

| | R$ |
| --- | ---: |
| Valor de mercado | 416.428.802 |
| Dívida bruta | 1.210.528.000 |
| Caixa e equivalentes | 306.515.000 |
| Aplicações financeiras | 107.807.000 |
| **Dívida líquida** | **796.206.000** |
| **Valor da firma** | **1.212.634.802** |
| **EBIT (12 meses)** | **297.971.000** |

- EV/EBIT: **4.07×** · earnings yield 24.6%
- Dívida líquida / EBIT: 2.67×
- EBIT acumulado até 2026-06-30
- Balanço de 2026-06-30
- CNPJ 11.992.680/0001-93 · classes listadas: QUAL3

## Onde ler

Consulta externa da CVM, por CNPJ: https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx

Documentos que importam: a DFP do último exercício fechado, o ITR mais recente, e dentro deles as
notas explicativas sobre provisões, partes relacionadas, empréstimos e contingências, além do
relatório do auditor independente e do comentário da administração.

## As três perguntas

Responda apenas estas três. Não recomende, não dê preço-alvo e não discorde do ranking: o número
acima é aritmética conferida, e a pergunta aqui é outra.

1. **O EBIT se repete?** O valor de 297.971.000 vem de operação recorrente, ou está
   inflado por venda de ativo, reversão de provisão, ganho judicial, crédito tributário
   extemporâneo ou um pico de ciclo?
2. **O balanço é o que diz ser?** Garantias fora do balanço, recebíveis com partes relacionadas,
   quebra de covenant, ressalva ou parágrafo de ênfase sobre continuidade no relatório do auditor.
3. **Há um motivo estrutural para o desconto?** Conflito com o controlador, fechamento de capital
   em curso, revisão tarifária, litígio relevante, ou um contrato que é a maior parte da receita e
   vence.

## O que gravar

Crie `src/data/verdicts/QUAL3.json` com exatamente esta forma:

```json
{
  "ticker": "QUAL3",
  "model": "<o modelo que leu>",
  "reviewedAt": "<AAAA-MM-DD>",
  "earningsThrough": "2026-06-30",
  "answers": [
    {
      "question": "earnings-repeatable",
      "finding": "<algumas frases, em português, sobre o que as demonstrações dizem>",
      "citation": "<documento, nota e número — p. ex. 'DFP 2025, nota 24'>",
      "weight": "clear | caution | flag"
    },
    {
      "question": "balance-sheet-as-stated",
      "finding": "<algumas frases, em português, sobre o que as demonstrações dizem>",
      "citation": "<documento, nota e número — p. ex. 'DFP 2025, nota 24'>",
      "weight": "clear | caution | flag"
    },
    {
      "question": "structural-discount",
      "finding": "<algumas frases, em português, sobre o que as demonstrações dizem>",
      "citation": "<documento, nota e número — p. ex. 'DFP 2025, nota 24'>",
      "weight": "clear | caution | flag"
    }
  ]
}
```

`weight` é `clear` quando nada foi encontrado, `caution` quando há algo a observar e `flag`
quando há algo que muda a leitura do múltiplo. Nunca é uma nota, e nunca move o ranking.
