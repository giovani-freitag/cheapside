# ALLD3 — ALLIED

Posição 1 da carteira, a 0.97× EV/EBIT.

## O que a tela calculou

| | R$ |
| --- | ---: |
| Valor de mercado | 485.565.388 |
| Dívida bruta | 385.546.000 |
| Caixa e equivalentes | 348.803.000 |
| Aplicações financeiras | 0 |
| **Dívida líquida** | **36.743.000** |
| **Valor da firma** | **522.308.388** |
| **EBIT (12 meses)** | **536.376.000** |

- EV/EBIT: **0.97×** · earnings yield 102.7%
- Dívida líquida / EBIT: 0.07×
- EBIT acumulado até 2026-06-30
- Balanço de 2026-06-30
- CNPJ 20.247.322/0001-47 · classes listadas: ALLD3

## Onde ler

Consulta externa da CVM, por CNPJ: https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx

Documentos que importam: a DFP do último exercício fechado, o ITR mais recente, e dentro deles as
notas explicativas sobre provisões, partes relacionadas, empréstimos e contingências, além do
relatório do auditor independente e do comentário da administração.

## As três perguntas

Responda apenas estas três. Não recomende, não dê preço-alvo e não discorde do ranking: o número
acima é aritmética conferida, e a pergunta aqui é outra.

1. **O EBIT se repete?** O valor de 536.376.000 vem de operação recorrente, ou está
   inflado por venda de ativo, reversão de provisão, ganho judicial, crédito tributário
   extemporâneo ou um pico de ciclo?
2. **O balanço é o que diz ser?** Garantias fora do balanço, recebíveis com partes relacionadas,
   quebra de covenant, ressalva ou parágrafo de ênfase sobre continuidade no relatório do auditor.
3. **Há um motivo estrutural para o desconto?** Conflito com o controlador, fechamento de capital
   em curso, revisão tarifária, litígio relevante, ou um contrato que é a maior parte da receita e
   vence.

## O que gravar

Crie `src/data/verdicts/ALLD3.json` com exatamente esta forma:

```json
{
  "ticker": "ALLD3",
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
