# Cheapside

Uma tela quantitativa sobre a B3. O projeto é exclusivo da bolsa brasileira.

## Idioma

- **Documentação em português.** README, `docs/`, e qualquer texto escrito para um leitor.
- **Código e comentários inteiramente em inglês.** Nomes de identificadores, docblocks, comentários
  inline, mensagens de commit. Sem exceção.
- Strings voltadas ao usuário na interface são português, porque são conteúdo e não código.

## Aviso de não recomendação

- O aviso de que isto não é recomendação de investimento é repetido de propósito em quatro
  superfícies: o bloco de citação do README, a abertura de `docs/estrategia.md`, a seção *O que isto
  não é* de `method-view.tsx`, e o rodapé do `app-shell.tsx`.
- Tirar o aviso de qualquer uma delas nunca é deduplicação. Um leitor do repositório e um visitante
  do site são pessoas diferentes, e cada um precisa do seu.
- A forma longa canônica é a de `method-view.tsx`, e o bloco do README acompanha essa redação:
  mexer em uma é mexer na outra.

## Camadas

- `src/domain` é puro: objetos de valor, entidades e regras. Sem I/O, sem React, sem `node:`.
- `src/services/<domínio>/<domínio>-service.ts` é dono de cada capacidade que toca o mundo externo.
  Uma biblioteca de I/O só é importada dentro da pasta do serviço que a embrulha.
- `src/react` só exibe. Hooks leem serviços, componentes leem hooks.
- `tests/arch/layering.test.ts` garante tudo isso; se quebrar, a camada está errada, não o teste.

## Dados

O pipeline tem duas metades, e a separação é deliberada:

- `npm run data:capture` lê as fontes, faz o join e grava `snapshot.json` — **sem aplicar filtro
  nenhum**. É a metade que custa rede.
- `npm run data:screen` recalcula `screen.json` só a partir do snapshot. É a metade que decide, e
  não toca na rede.

Mexer em filtro, limiar ou ordenação é trabalho da segunda metade: rode `data:screen`, nunca
`data:capture`. Toda requisição passa pelo `HttpCacheService`, com prazo por fonte.

O site nunca chama uma API e nunca carrega um token — é o que permite ele ser estático e forkável.
Nenhuma fonte nova deve exigir autenticação.
