# Cheapside

Uma tela quantitativa sobre a B3. O projeto é exclusivo da bolsa brasileira.

## Idioma

- **Documentação em português.** README, `docs/`, e qualquer texto escrito para um leitor.
- **Código e comentários inteiramente em inglês.** Nomes de identificadores, docblocks, comentários
  inline, mensagens de commit. Sem exceção.
- Strings voltadas ao usuário na interface são português, porque são conteúdo e não código.

## Camadas

- `src/domain` é puro: objetos de valor, entidades e regras. Sem I/O, sem React, sem `node:`.
- `src/services/<domínio>/<domínio>-service.ts` é dono de cada capacidade que toca o mundo externo.
  Uma biblioteca de I/O só é importada dentro da pasta do serviço que a embrulha.
- `src/react` só exibe. Hooks leem serviços, componentes leem hooks.
- `tests/arch/layering.test.ts` garante tudo isso; se quebrar, a camada está errada, não o teste.

## Dados

O pipeline (`npm run data:build`) roda no CI e o resultado é commitado em `src/data/generated/`. O
site nunca chama uma API e nunca carrega um token — é o que permite ele ser estático e forkável.
Nenhuma fonte nova deve exigir autenticação.
