# Cheapside

As vinte empresas mais baratas da B3 por EV/EBIT, com cada número que entrou em cada posição na
mesma página que ela.

**[giovani-freitag.github.io/cheapside](https://giovani-freitag.github.io/cheapside/)**

## O que é

Uma tela quantitativa. Lê todas as companhias listadas na B3 a partir das demonstrações públicas da
CVM, ordena pelo que a empresa inteira custa contra o que ela opera, e publica as vinte do topo —
junto com as quase trezentas que removeu e o motivo de cada remoção.

A estratégia é a que o Clube do Valor publica como *As 20 Ações Mais Baratas da Bolsa*, que por sua
vez é uma implementação brasileira do Acquirer's Multiple de Carlisle. As regras completas, o
argumento de cada limiar e o que a métrica ainda erra estão em
**[docs/estrategia.md](docs/estrategia.md)**.

Não é recomendação de investimento, e não é a afirmação de que barato é bom. As vinte mais baratas
de qualquer métrica incluem empresas que estão baratas por merecerem estar.

## As decisões que o escopo deixou em aberto

A primeira versão deste README listava cinco coisas que precisavam ser decididas antes de qualquer
linha de código. Estão decididas, e cada uma é defendida em `docs/estrategia.md`.

| | decidido | onde |
| --- | --- | --- |
| Qual bolsa | B3 | — |
| O que "barato" quer dizer | EV/EBIT sobre doze meses, e não P/L, P/VP, EV/EBITDA ou P/FCF | §2 |
| O que fica de fora | Financeiras, recuperação judicial, iliquidez, prejuízo, alavancagem, demonstração velha | §3 |
| De onde vêm os dados | Dados abertos da CVM, registro de listadas da B3, cotações da brapi — tudo gratuito, nada exigindo token | §6 |
| Qual é a saída | Um site estático sobre um conjunto de dados reconstruído no CI e commitado | abaixo |

## Como é construído

Nada roda no carregamento da página. O pipeline roda no CI, o resultado é commitado como JSON, e o
site é uma página estática sobre ele. É isso que permite a coisa inteira viver no GitHub Pages e ser
forkada por qualquer um: não há servidor, não há chave de API, e não há requisição que o leitor
precise confiar.

```
scripts/build-screen.ts        o pipeline: buscar, juntar, ordenar, escrever
  └─ src/services/cvm/         dados abertos da CVM — EBIT, caixa, dívida, situação do emissor
  └─ src/services/b3/          o registro de listadas — a ponte do ticker até o CNPJ
  └─ src/services/quotes/      preço, giro e valor de mercado
  └─ src/services/liquidity/   a mediana móvel do valor negociado, um pregão por execução
  └─ src/services/universe/    o join, e o que não consegue atravessá-lo
  └─ src/services/screen/      os filtros e o ranking
       ↓
src/data/generated/screen.json  commitado, versionado, datado
       ↓
src/react/                      a interface, que só lê
```

Os três joins são a parte difícil, e nenhuma das fontes compartilha chave: as cotações chegam sob um
ticker, o registro de listadas sob uma raiz de quatro letras, e as demonstrações sob um CNPJ — sob
qualquer *estabelecimento* da empresa que tenha arquivado, que é o motivo de o join rodar na raiz do
CNPJ e não no número inteiro.

### Camadas

`src/domain` é puro: objetos de valor, entidades e as regras de filtro, sem I/O, sem React e sem
Node. `src/services` é dono de toda capacidade que toca o mundo externo, uma pasta cada.
`src/react` é a interface, e não guarda lógica que não seja de exibição — os hooks leem serviços, os
componentes leem hooks. Um teste de arquitetura garante tudo isso.

Documentação em português; código e comentários inteiramente em inglês.

## Rodando

```bash
npm install
npm run dev           # o site, sobre o conjunto de dados commitado
npm run data:build    # reconstrói os dados a partir das fontes (~2 min a frio, cacheado depois)
npm run data:verdicts # escreve os briefings de leitura da carteira atual
npm test
npm run build
```

`data:build` baixa cerca de 150 MB de arquivos da CVM numa execução fria e os guarda no diretório
temporário do sistema, de modo que a segunda execução só rebusca preços.

## A parte que não é aritmética

A tela responde *o que está estatisticamente barato*. Ela não responde *por quê*, e a diferença entre
uma pechincha e uma armadilha de valor mora inteira na segunda pergunta.

A primeira execução tornou isso concreto já na primeira posição: uma empresa a 0,97× EV/EBIT, cujos
números batem exatamente com o arquivo, e cujo lucro operacional triplicou em um ano porque uma única
linha de despesa operacional se moveu R$ 340 milhões. É o formato de uma reversão de provisão, não o
de um negócio três vezes melhor, e um múltiplo de doze meses não tem como distinguir.

Por isso existe uma segunda camada, opcional: uma leitura das demonstrações de cada empresa
publicada, respondendo três perguntas estreitas — o EBIT se repete, o balanço é o que diz ser, há
motivo estrutural para o desconto. Ela é produzida fora deste repositório por um modelo de
linguagem, commitada como JSON em `src/data/verdicts/`, e exibida ao lado da posição como contexto.
Nunca move o ranking, e uma empresa que ninguém leu aparece como não lida, não como aprovada.

`npm run data:verdicts` escreve um briefing por empresa da carteira em `docs/briefs/`, cada um
carregando os números, os links das demonstrações, as três perguntas e o JSON exato a devolver. A
leitura em si é um passo à parte de propósito: a tela precisa continuar reproduzível por qualquer um
com conexão de rede e conta em lugar nenhum.

## Stack

Vite 8 (Rolldown), React 19, primitivos do Radix sobre uma paleta própria do projeto com temas
claro, escuro e do sistema, TypeScript, Vitest, ESLint, release-please, GitHub Pages.

## Licença

MIT.
