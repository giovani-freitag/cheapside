# GOAU4 — GERDAU MET

Posição 14 da carteira, a 4.43× EV/EBIT.

## O que a tela calculou

| | R$ |
| --- | ---: |
| Valor de mercado | 14.168.147.194 |
| Dívida bruta | 13.558.089.000 |
| Caixa e equivalentes | 5.185.953.000 |
| Aplicações financeiras | 285.262.000 |
| **Dívida líquida** | **8.086.874.000** |
| **Valor da firma** | **22.255.021.194** |
| **EBIT (12 meses)** | **5.023.634.000** |

- EV/EBIT: **4.43×** · earnings yield 22.6%
- Dívida líquida / EBIT: 1.61×
- EBIT acumulado até 2026-06-30
- Balanço de 2026-06-30
- CNPJ 92.690.783/0001-09 · classes listadas: GOAU3, GOAU4

## Onde ler

Consulta externa da CVM, por CNPJ: https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx

Documentos que importam: a DFP do último exercício fechado, o ITR mais recente, e dentro deles as
notas explicativas sobre provisões, partes relacionadas, empréstimos e contingências, além do
relatório do auditor independente e do comentário da administração.

## As três perguntas

Responda apenas estas três. Não recomende, não dê preço-alvo e não discorde do ranking: o número
acima é aritmética conferida, e a pergunta aqui é outra.

1. **O EBIT se repete?** O valor de 5.023.634.000 vem de operação recorrente, ou está
   inflado por venda de ativo, reversão de provisão, ganho judicial, crédito tributário
   extemporâneo ou um pico de ciclo?
2. **O balanço é o que diz ser?** Garantias fora do balanço, recebíveis com partes relacionadas,
   quebra de covenant, ressalva ou parágrafo de ênfase sobre continuidade no relatório do auditor.
3. **Há um motivo estrutural para o desconto?** Conflito com o controlador, fechamento de capital
   em curso, revisão tarifária, litígio relevante, ou um contrato que é a maior parte da receita e
   vence.

## O que gravar

Crie `src/data/verdicts/GOAU4.json` com exatamente esta forma:

```json
{
  "ticker": "GOAU4",
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
