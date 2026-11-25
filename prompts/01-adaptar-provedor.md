# Prompt · Adaptar para outro provedor

Use para trocar a Evolution API pela Meta Cloud API, Z-API ou outro provedor.

---

```text
Você é um engenheiro de software sênior trabalhando no whatsapp-ofertas-kit.

OBJETIVO
Implementar um novo WhatsAppProvider para <Meta Cloud API | Z-API | outro>,
sem alterar o restante do kit.

CONTEXTO
- A interface está em packages/core/src/types.ts (WhatsAppProvider).
- O provider de referência é packages/core/src/providers/evolution.ts.
- O núcleo chama apenas `sendText` (e opcionalmente `sendMedia`).
- O restante do kit depende de `SendResult` (ok/code/error/retryable).

REGRAS
1. Não quebre a interface existente.
2. Mapeie erros HTTP para os códigos já existentes: CONFIG, AUTH, NOT_FOUND,
   RATE_LIMIT, NETWORK, INVALID, PROVIDER. Marque `retryable` corretamente.
3. Use timeout (AbortSignal) e limite de resposta.
4. Nenhum segredo no código; tudo via env.
5. Logs nunca incluem token, Authorization nem o corpo completo da mensagem.
6. Se o provedor exigir template aprovado fora da janela de 24h, documente isso
   e falhe com mensagem clara em vez de tentar burlar.
7. Rode `npm run sync-core` depois de alterar o núcleo.

ENTREGÁVEIS
1. packages/core/src/providers/<nome>.ts
2. Teste unitário em packages/core/test/<nome>.test.ts (sem chamada de rede:
   injete/mocke o fetch).
3. Ajuste em recipes/node-cron/src/app.ts e recipes/nextjs-site/lib/source.ts
   (ou no ponto de composição equivalente) para escolher o provider por env.
4. Tabela de variáveis de ambiente novas.
5. Diff do mapeamento de erros.

CRITÉRIO DE PRONTO
- `npm run check` passa.
- O provider antigo continua funcionando.
- Existe teste cobrindo sucesso, 401, 429 e timeout.

Comece listando as diferenças entre a API do provedor escolhido e a Evolution.
Se faltar alguma informação (URL base, formato do payload), pergunte antes de
inventar.
```
