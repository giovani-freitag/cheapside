# A estratégia das empresas mais baratas

O que o Clube do Valor chama de *As 20 Ações Mais Baratas da Bolsa*, reconstruída a partir do
material público deles e da literatura de que descende, escrita em detalhe suficiente para ser
implementada.

Nada aqui é recomendação de investimento. É a especificação de uma tela.

## 1. De onde vem

A estratégia é uma implementação brasileira de uma linhagem bem documentada em inglês:

| | | |
| --- | --- | --- |
| Graham (1934) | net-net, P/L baixo | compre barateza estatística, carregue uma cesta, ignore a história |
| Greenblatt (2005) | *Magic Formula* | ordene por earnings yield **e** por retorno sobre capital, some as posições |
| Gray & Carlisle (2012) | *Quantitative Value* | a metade de qualidade adiciona menos do que custa; teste |
| Carlisle (2014) | *The Acquirer's Multiple* | **EV/EBIT sozinho** bate a Magic Formula de dois fatores |

O achado de Carlisle é o que sustenta tudo. Testando os dois componentes da Magic Formula
separadamente sobre dados americanos de 1973 a 2011, a ordenação por barateza (earnings yield)
carregou essencialmente todo o retorno; acrescentar a ordenação por qualidade (ROIC) *reduziu* o
resultado, porque ROIC alto é exatamente o que impede uma ação de ficar barata. A tela de fator
único sobre as 30 menores EV/EBIT acima de USD 1 bi de valor de mercado rendeu 17,9% ao ano desde
1973.

O produto do Clube do Valor é essa tela, rodada na B3, com filtros de segurança e rebalanceamento
trimestral. O backtest brasileiro do analista deles, Gabriel Roman (2000–2020), reporta:

| variante | retorno anual |
| --- | --- |
| Só earnings yield | 29,17% |
| Earnings yield + momentum | 30,66% |
| Ibovespa | 9,68% |

Índice de Sharpe de 0,80 na variante com momentum. O rebalanceamento trimestral testou melhor que o
anual na B3 — o oposto do resultado americano, que é o que se esperaria de um mercado onde a
distorção é maior e reverte mais rápido. A página de vendas deles cita 3.643% acumulados entre 2004
e 2025, algo como seis vezes o Ibovespa, com as quedas de 2008, 2015 e 2020 recuperadas em todos os
casos. O fundo construído sobre a estratégia carrega 20 nomes a 5% cada e é revisado trimestralmente.

Esses números são deles, brutos de impostos e custos de transação, e este projeto não os reproduz.
Estão registrados aqui porque o *formato* da estratégia só é defensável se você souber contra o que
ela foi ajustada.

## 2. A métrica

A ordenação é por **TEV/EBIT** — valor total da firma sobre lucro operacional. Seu recíproco é o
earnings yield, e ordenar o múltiplo de forma crescente é idêntico a ordenar o yield de forma
decrescente.

```
TEV  = valor de mercado (todas as classes de ações)
     + dívida bruta
     - caixa e equivalentes
     - aplicações financeiras de curto prazo

EBIT = lucro operacional antes do resultado financeiro e dos tributos
       (conta 3.05 da CVM, últimos doze meses)

ordem = TEV / EBIT, crescente
```

### Por que este múltiplo e não os outros quatro

O escopo inicial listava P/L, P/VP, EV/EBITDA e P/FCF como leituras concorrentes da palavra
*barato*. Elas não são igualmente boas, e o argumento por EV/EBIT é específico.

**Contra P/L.** O denominador fica abaixo do resultado financeiro, de modo que uma empresa alavancada
e outra sem dívida, com operações idênticas, recebem P/L diferentes puramente pela estrutura de
capital. No Brasil, onde a taxa básica passou a maior parte de duas décadas em dois dígitos, a linha
financeira é frequentemente maior que a operacional, e o P/L vira sobretudo uma leitura da conta de
juros. Pior: o numerador é só o valor do capital próprio, então uma empresa pode parecer barata no
P/L carregando uma dívida que torna o negócio inteiro caro.

**Contra P/VP.** O patrimônio contábil é custo histórico menos depreciação. Ele mede o que foi pago,
não o que se tem. Funciona em balanços feitos de ativos duros e falha nos que são feitos de marcas,
software e contratos. Falha na direção oposta em utilities e concessionárias brasileiras, cujas
bases de ativos regulatórias são reavaliadas por cronogramas que nada têm a ver com valor de mercado.

**Contra EV/EBITDA.** O EBITDA é o numerador correto apenas se a depreciação não for um custo real.
Para um operador de shopping isso é discutivelmente verdade; para uma siderúrgica, uma empresa de
navegação ou uma telecom é uma ficção que favorece justamente as empresas intensivas em capital que
mais precisam do encargo. O EBIT mantém a depreciação e, com ela, mantém honesto o capex de
manutenção — que é por que Greenblatt e Carlisle usaram o EBIT.

**Contra P/FCF.** O fluxo de caixa livre é a medida economicamente mais correta e a mais ruidosa. O
capex é irregular: uma empresa que construiu uma fábrica neste ano parece péssima e uma que adiou
manutenção parece ótima, então a tela estaria ordenando pelo calendário de obras. É uma boa
*conferência* sobre um nome que a tela trouxe e uma péssima *chave de ordenação*.

EV/EBIT é o meio-termo a que a literatura convergiu: neutro à estrutura de capital como o
EV/EBITDA, honesto quanto à depreciação como o P/L, e estável o bastante para ordenar.

### Os múltiplos rejeitados, exibidos assim mesmo

P/L e P/VP não ordenam nada, mas aparecem ao lado de cada posição. Não é contradição: a tela é
transparente sobre o que calcula, e o lugar mais honesto de mostrar que uma métrica foi rejeitada é
ao lado do número que a substituiu, onde o leitor pode ver onde as duas discordam.

A discordância é informativa. `MGLU3` sai a 3,93× de EV/EBIT e 44× de P/L: a operação é barata e o
resultado financeiro come quase todo o lucro. Ler só o P/L esconderia a operação; ler só o EV/EBIT
esconderia a conta de juros. As duas colunas juntas dizem onde a empresa dói.

### O que EV/EBIT ainda erra

Vale dizer, porque a tela vai trazer esses casos e a interface precisa mostrá-los.

- **Picos de ciclo.** Um produtor de commodity no topo do ciclo tem EBIT de pico e portanto múltiplo
  baixo. Está barato contra lucros que não vai repetir. É o modo de falha mais comum na B3, onde
  mineração, siderurgia, celulose e petróleo são fatia grande do mercado.
- **Ganhos não recorrentes dentro da 3.05.** Alienação de ativos, reversão de provisões e vitórias
  judiciais entram acima do resultado financeiro e inflam o EBIT. Um EBIT normalizado os excluiria;
  uma tela não consegue distingui-los sem ler as notas.
- **Equivalência patrimonial.** A conta 3.04.06 está dentro da 3.05, mas não é lucro operacional que
  a controladora comanda, e a dívida da coligada não está no valor da firma da controladora.
- **Holdings e grupos estruturalmente complexos.** O valor da firma pressupõe uma entidade econômica
  consolidada. Uma holding cujo valor é uma participação minoritária em uma listada quebra essa
  premissa no numerador e no denominador.

## 3. O universo e os filtros

Os filtros se aplicam em ordem. Cada um remove empresas por um motivo declarado, e toda remoção é
registrada para que o leitor possa discordar dela em vez de se perguntar para onde um nome foi.

### 3.1 Filtro de listagem — o que conta como empresa

- Fonte: o registro de empresas listadas da B3, unido ao cadastro da CVM pelo CNPJ.
- Uma linha por **empresa**, não por ticker. Uma empresa com classes ON e PN é uma candidata só, e o
  múltiplo usa um único valor de mercado cobrindo ambas, porque o valor da firma é propriedade da
  firma e não de uma classe de ação.
- O ticker citado na posição é a classe mais líquida.
- BDRs, ETFs, FIIs e veículos de renda fixa ficam de fora: não são empresas operacionais com
  demonstração de resultado na CVM.

### 3.2 Exclusão setorial — bancos, seguradoras e tudo que empresta

**Excluídos:** bancos, seguradoras, resseguradoras, corretoras, bolsas, securitizadoras, fintechs de
crédito e holdings cuja demonstração consolidada é uma demonstração financeira.

O motivo não é prudência, é aritmética. Para uma empresa financeira a dívida *é* a matéria-prima.
Depósitos e linhas de captação não são uma reivindicação sobre a firma do jeito que os empréstimos
de uma fábrica são — são o estoque dela. Somá-los ao valor de mercado produz um valor de firma que
não significa nada.

A detecção é estrutural, e não pelo rótulo de setor — mas não do jeito que este documento supunha
antes da primeira execução. Ver §8.

Bancos ainda podem estar baratos. Ordená-los pede P/VP contra ROE, que é outra tela, e misturar as
duas numa lista só seria desonesto sobre o que o número quer dizer.

### 3.3 Exclusão por continuidade — recuperação judicial

**Excluídos:** todo emissor cuja situação no cadastro da CVM (`SIT_EMISSOR`) seja *EM RECUPERAÇÃO
JUDICIAL OU EQUIVALENTE*, *FALIDA* ou *LIQUIDAÇÃO EXTRAJUDICIAL*.

Uma empresa em recuperação judicial está barata porque seu capital próprio pode não valer nada, e a
tela não consegue precificar a probabilidade de o plano dar certo. Incluí-la colocaria os piores
desfechos da tela no topo da própria lista. Registros suspensos e cancelados também saem — não têm
demonstração corrente para ler.

### 3.4 Filtro de rentabilidade — EBIT negativo

**Excluídos:** EBIT dos últimos doze meses menor ou igual a zero.

Um denominador negativo produz múltiplo negativo, que ordena *abaixo* de toda empresa genuinamente
barata e encheria o topo da lista com os piores negócios da bolsa. Não é um juízo de que empresas
com prejuízo sejam maus investimentos; é que a função de ordenação não tem sentido para elas.

### 3.5 Filtro de liquidez

**Excluídos:** valor negociado mediano diário abaixo de **R$ 1.000.000** ao longo dos pregões
registrados.

O piso publicado pelo Clube do Valor é de R$ 200 mil por dia. Esse é um piso para um investidor
pessoa física com posição pequena, e é baixo demais para ser honesto aqui: uma tela que cita um
preço que ninguém consegue executar está citando uma ficção. O piso mais alto custa alguns micro
caps genuinamente baratos e compra uma lista que de fato pode ser comprada. É um parâmetro, e está
exposto como tal.

Mediana e não média, porque um único negócio em bloco não deve qualificar uma ação por dois meses.

**A janela é menor que sessenta, e diz isso.** A fonte gratuita de cotações publica o giro de um
pregão, não um histórico. Em vez de chamar um único dia de mediana, o pipeline registra cada pregão
em que roda e tira a mediana dos que tem — um no começo, sessenta com o tempo, com a contagem
carregada ao lado do número para que ninguém confunda uma medição fina com uma grossa. Com
reconstruções semanais, a janela chega a um trimestre de cobertura real em cerca de três meses.

### 3.6 Filtro de alavancagem

**Excluídos:** dívida líquida sobre **EBIT** acima de 4,0, quando a dívida líquida é positiva.

Uma empresa pode chegar a um EV/EBIT baixo por estar barata ou por estar perto de quebrar — no
segundo caso o múltiplo baixo é o mercado precificando o capital próprio como uma opção de
sobrevivência. O covenant convencional nas debêntures brasileiras é de três vezes o EBITDA, e é essa
a razão que este filtro persegue.

Não é a razão que ele usa. Depreciação e amortização não são conta fixa no plano de contas da CVM:
aparecem na demonstração de fluxo de caixa sob descrições que cada empresa escreve por si, então
reconstruir o EBITDA para dois mil emissores significa casar texto livre e errar em silêncio com
alguns deles. O EBIT é um número publicado. Como o EBIT é menor que o EBITDA, o mesmo rigor pede um
teto mais frouxo, e quatro vezes é aproximadamente onde três vezes o EBITDA cai para uma industrial
típica. Uma razão defensável sobre um número que a fonte publica é melhor que uma razão melhor sobre
um número inferido.

Empresas com caixa líquido passam automaticamente.

### 3.7 Filtro de atualidade

**Excluídos:** nenhuma demonstração consolidada com data de referência dentro dos últimos 8 meses.

Atraso no arquivamento se correlaciona com tudo o que os outros filtros tentam evitar.

## 4. Montando a carteira

| decisão | valor | por quê |
| --- | --- | --- |
| posições | 20 | Greenblatt usou 30, Carlisle 30, Clube do Valor 20. Abaixo de ~15 um único desastre domina; acima de ~30 a tela se dilui no índice. |
| pesos | iguais, 5% cada | A tela não tem opinião sobre qual das escolhas é a melhor. Qualquer outro peso contrabandeia uma. |
| rebalanceamento | trimestral | Segue o backtest brasileiro, e acompanha o calendário dos ITRs, de modo que os fundamentos de fato mudam entre um rebalanceamento e outro. |
| giro | rotação total | A tela é recalculada do zero e a carteira vira as novas vinte do topo. Um nome que continua no topo é simplesmente mantido. |
| gatilho de venda | sair das vinte primeiras | Sem stop, sem preço-alvo, sem saída discricionária. Acrescentar uma tornaria a estratégia discricionária, que é justamente o que ela foi construída para evitar. |

Rebalancear no primeiro pregão do mês seguinte a cada prazo de ITR/DFP permite que os arquivos
cheguem antes de a tela os ler.

### A sobreposição de momentum

A variante brasileira melhor ordena as candidatas baratas por momentum de doze meses (excluindo o
mês mais recente) e leva as 20 primeiras das ~40 mais baratas. Ela captura a interação documentada
entre valor e momentum: barato-e-ainda-caindo é onde moram as armadilhas de valor, barato-e-se-
recuperando é onde estão os retornos.

Valeu 1,5 ponto percentual de retorno anual no teste deles. Este projeto a implementa como um
segundo critério **opcional e desligado por padrão**, porque uma vantagem de 1,5 p.p. medida uma vez,
em um mercado, sobre um período, está dentro da faixa em que a resposta honesta é que pode ser o
ajuste e não o efeito.

## 5. O que a tela não consegue fazer

O escopo inicial estava certo ao dizer que as mais baratas conterão empresas que estão baratas por
merecerem estar, e que separá-las é trabalho mais difícil. Errou ao concluir que seria trabalho de
outro projeto: é deste, e é a segunda camada descrita abaixo. O limite não é de escopo, é de
matéria — a tela lê números, e a resposta está escrita em prosa.

A tela responde *o que está estatisticamente barato*. Ela não responde *por quê*. O porquê mora no
comentário da administração, nos fatores de risco, nas notas sobre contingências, nas transações com
partes relacionadas e no relatório do auditor — prosa, não números.

É essa lacuna que dá a um modelo de linguagem um lugar neste projeto, e nenhum outro. A função dele
não é escolher ações nem mexer no ranking. É ler as demonstrações de um nome que a tela trouxe e
responder três perguntas estreitas:

1. **O EBIT se repete?** O número de doze meses está inflado por alienações, reversões de provisão,
   ganhos judiciais ou um pico de ciclo?
2. **O balanço é o que diz ser?** Garantias fora do balanço, recebíveis com partes relacionadas,
   quebra de covenant, linguagem de continuidade no relatório do auditor.
3. **Há um motivo estrutural para o desconto?** Conflito com o controlador, fechamento de capital em
   curso, negócio regulado diante de revisão tarifária, contrato que é a maior parte da receita e
   vence.

Cada resposta é um trecho curto com citação ao documento, produzido fora do site, commitado no
repositório e exibido ao lado da posição como *contexto* — nunca como nota, nunca como filtro. Uma
empresa sem leitura aparece como não lida, não como aprovada.

## 6. Fontes de dados

Todas gratuitas, nenhuma exige token, e todas são lidas em tempo de build e não pelo navegador.

| o quê | fonte | observações |
| --- | --- | --- |
| Demonstrações | [Dados abertos da CVM](https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/), ITR e DFP | Oficiais e padronizadas. EBIT é 3.05; caixa é 1.01.01 + 1.01.02; dívida é 2.01.04 + 2.02.01; patrimônio é 2.03. Latin-1, delimitado por ponto e vírgula, um zip por ano. |
| Cadastro de emissores | [`cad_cia_aberta.csv` da CVM](https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/) | Carrega `SIT_EMISSOR`, a marca de recuperação judicial, e o setor de atividade. |
| Ticker ↔ CNPJ | Registro de empresas listadas da B3 | A ponte entre o mundo contábil (CNPJ, código CVM) e o mundo de mercado (tickers). |
| Preço, giro, valor de mercado | [brapi.dev](https://brapi.dev) `/api/quote/list` | O endpoint de lista responde sem token; o de fundamentos por ticker não, e não é necessário. |

Um token teria de viajar dentro do bundle para ser alcançável por um navegador, e é essa a razão de
o pipeline rodar no CI e o resultado ser commitado. A tela é um site estático sobre um conjunto de
dados com uma data carimbada.

## 7. Parâmetros, reunidos

Todos os limiares acima em um lugar só, porque são escolhas e não descobertas.

```
posições                  20
pesos                     iguais (5% cada)
rebalanceamento           trimestral
ordenação                 TEV / EBIT (12 meses), crescente
sobreposição de momentum  desligada
piso de liquidez          R$ 1.000.000 mediano diário, sobre até 60 pregões registrados
teto dívida líquida/EBIT  4,0
EBIT mínimo               maior que zero
demonstração mais antiga  8 meses
excluídos                 financeiras, recuperação judicial, veículos não operacionais
```

## 8. O que a primeira execução encontrou

A saída da própria tela é o melhor teste das ressalvas acima, e a primeira execução tornou uma delas
concreta na hora.

A empresa mais barata da bolsa saiu a **0,97× EV/EBIT** — a firma inteira por menos de um ano de
lucro operacional. A aritmética está certa: os números batem com o arquivo até o último milhar de
reais. O que produziu isso é que a linha de *Despesas/Receitas Operacionais* da empresa se moveu
cerca de R$ 340 milhões entre dois exercícios, triplicando o lucro operacional sem que a receita se
movesse. Esse é o formato de uma reversão de provisão ou de uma alienação, não o de um negócio que
ficou três vezes melhor, e o múltiplo de doze meses não tem como saber a diferença.

É exatamente o segundo modo de falha da §2, chegando à primeira posição na primeira execução. A tela
não erra ao publicá-la; publicá-la e não dizer nada sobre o porquê seria o erro. É essa a função que
a leitura da §5 existe para cumprir, e a interface marca como não lida uma empresa não lida em vez
de deixar em branco o espaço onde a leitura ficaria.

Bancos, seguradoras e corretoras foram a outra coisa que a primeira execução ensinou. O plano da §3.2
era detectá-los pela ausência da conta 3.05 — e todos eles arquivam uma 3.05. A CVM fixa o código e
não o layout: uma industrial põe *Resultado Antes do Resultado Financeiro e dos Tributos* ali, um
banco põe *Resultado Antes dos Tributos sobre o Lucro*, que é o mesmo código guardando um número
apurado depois do resultado financeiro e não antes dele, e uma seguradora põe uma linha operacional
residual. Ordenar só pelo código colocou Santander e Banco BMG na carteira e empurrou Itaú e Banco do
Brasil para o balde de alavancadas, que é o disparate aritmético que a §3.2 previa, chegando por uma
porta que ela não havia pensado em vigiar. O layout passou a ser lido pela descrição da linha.

## Fontes

- [As 20 Ações Mais Baratas da Bolsa — Clube do Valor](https://clubedovalor.com.br/20-acoes-mais-baratas/)
- [Como Comprar Ações Baratas e Vender as Caras — Clube do Valor](https://clubedovalor.com.br/blog/acoes-baratas/)
- [Magic Formula: o método dos maiores investidores do mundo — Clube do Valor](https://clubedovalor.com.br/blog/magic-formula/)
- [Magic Formula de Joel Greenblatt: como aplicar no Brasil — brapi.dev](https://brapi.dev/blog/magic-formula-joel-greenblatt-brasil-2026)
- [Clube do Valor Ações Baratas FIF — Mais Retorno](https://maisretorno.com/fundo/clube-do-valor-acoes-baratas-fif)
- [The Acquirer's Multiple — Tobias Carlisle](https://acquirersmultiple.com/)
- [Portal de Dados Abertos da CVM](https://dados.cvm.gov.br/dataset/cia_aberta-doc-itr)
