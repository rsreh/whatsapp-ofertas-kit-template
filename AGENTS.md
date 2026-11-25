# AGENTS.md

Instruções para agentes de código (Claude Code, Codex, Cursor, Copilot,
OpenCode...) que trabalham neste repositório. Leia antes de editar.

## O que é este repositório

Um kit público (MIT) para montar uma automação de ofertas no WhatsApp usando a
**instância e as credenciais do próprio usuário**. Não é um bot hospedado.

Princípios:

1. **Autocontido.** Cada receita funciona copiada sozinha, sem workspace.
2. **AI-first.** Guias numerados, prompts e `llms.txt` existem para agentes.
3. **Sem credenciais.** Só placeholders. Nada de `.env` real.
4. **Escopo ético.** Apenas grupos/canais próprios, com opt-in.
5. **Seguro por padrão.** Endpoints autenticados, SSRF bloqueado, logs redigidos.

## Mapa

```
packages/core/src       fonte da verdade do núcleo (TypeScript)
packages/core/test      testes (Vitest)
recipes/node-cron       caminho de ouro: CLI + servidor + agendador
recipes/nextjs-site     painel Next.js (App Router)
recipes/*/src/core      CÓPIA gerada de packages/core/src — não editar
infra/docker-evolution  compose da Evolution + Postgres + Redis
docs/                   guias 00–10 em pt-BR
prompts/                prompts prontos para IA
templates/              mensagens, produtos, cron, systemd
checklists/             primeiro envio, segurança, go-live
scripts/sync-core.mjs   sincroniza o núcleo para as receitas
```

## Comandos

```bash
npm run sync-core     # packages/core/src → recipes/*/src/core
npm run typecheck     # core + node-cron + nextjs
npm test              # Vitest do núcleo
npm run check         # sync + typecheck + testes (use antes de concluir)
```

Instalação por pasta (não há workspace):

```bash
npm ci --prefix packages/core
npm ci --prefix recipes/node-cron
npm ci --prefix recipes/nextjs-site
```

Build do Next: `npm --prefix recipes/nextjs-site run build`.

## Invariantes (não quebre)

1. `packages/core` é a fonte da verdade. Depois de alterar, rode
   `npm run sync-core` e commite as cópias.
2. `recipes/*/src/core` é gerado. Nunca edite manualmente.
3. `packages/core` não importa nada de `recipes/`.
4. Nenhum segredo no código, em exemplo ou em teste. Só placeholders.
5. Nada de `NEXT_PUBLIC_` para segredo.
6. Endpoints de cron/envio: `Authorization: Bearer`, comparação com
   `timingSafeEqual`, bloqueio quando o segredo não está configurado.
7. Toda URL externa passa por `assertPublicUrl`/`fetchHtml` (SSRF).
8. Mensagem final usa `clampMessage` (limite 4096).
9. O link do produto fica sozinho em uma linha (preview card).
10. Não adicione dependência sem justificar. O núcleo usa só a stdlib do Node.
11. Não implemente envio em massa, DM para desconhecidos, scraping de grupos ou
    contorno de ban. Recuse e explique.

## Convenções

- Código e identificadores em inglês; comentários, docs e mensagens de erro em
  pt-BR.
- TypeScript estrito, ESM, sem `any` desnecessário.
- Funções pequenas e puras quando possível; efeitos colaterais explícitos.
- Erros como `Error` com mensagem acionável, sem vazar segredo.
- Testes em `packages/core/test/*.test.ts`, sem rede (mocke `fetch`).
- Nomes de arquivo em kebab-case ou `camelCase` conforme a pasta.

## Como estender

### Novo provedor

1. Crie `packages/core/src/providers/<nome>.ts` implementando
   `WhatsAppProvider` (`sendText` obrigatório, `sendMedia` opcional).
2. Mapeie erros para `SendErrorCode` e defina `retryable`.
3. Use `AbortSignal.timeout` e limite de resposta.
4. Adicione teste sem rede.
5. Exporte em `packages/core/src/index.ts`.
6. Ligue no ponto de composição (`recipes/node-cron/src/app.ts`,
   `recipes/nextjs-site/lib/source.ts` ou equivalente).
7. `npm run sync-core && npm run check`.

### Nova fonte de produto

1. Crie `packages/core/src/sources/<nome>.ts` implementando `ProductSource`.
2. Valide `url` como `http(s)`; preço numérico positivo.
3. Exporte em `index.ts` e registre em `createSource`.
4. Teste com dados fixos.

### Novo storage

Implemente `Storage` (`claim`, `get`, `set`, `delete`). `claim` precisa ser
atômico. Documente o limite (processo único, instância única, distribuído).

## Variáveis de ambiente

Validação central em `packages/core/src/config.ts`. Ao adicionar uma variável:

1. leia com `read`/`readNumber`;
2. adicione a mensagem de erro em `missing` quando obrigatória;
3. atualize `.env.example` da(s) receita(s);
4. documente em `docs/` e no README da receita.

Nunca torne uma variável obrigatória para o modo `preview` (ele deve funcionar
sem provider).

## Testes

- `npm test` roda o núcleo.
- Cubra: parsing, formatação, assinatura, SSRF, storage, planner, erros HTTP.
- Não faça chamada de rede real. Injete dados ou mocke `fetch`.
- Tempo: use `vi.useFakeTimers` e restaure em `afterEach`.

## Definição de pronto

- `npm run check` passa.
- `npm --prefix recipes/nextjs-site run build` passa (se mexeu no Next).
- Cópias em `recipes/*/src/core` sincronizadas e commitadas.
- Docs/exemplos atualizados quando o comportamento muda.
- Nenhum segredo no diff (`gitleaks detect`).
- Mensagem de commit no imperativo, curta, em pt-BR ou inglês consistente.

## Não faça

- Não crie `.env`, nem copie credenciais de outro projeto.
- Não adicione dados reais de clientes, números ou grupos.
- Não use marca de terceiros nos exemplos (use `example.com`).
- Não remova a proteção SSRF "para simplificar".
- Não desative autenticação de endpoint em produção.
- Não faça o kit depender de um serviço pago para o caminho básico.
