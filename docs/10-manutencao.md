# 10 · Manutenção e troubleshooting

## Versões testadas

| Componente | Versão |
|---|---|
| Node.js | 20.9+ (CI usa 22) |
| Next.js | 16.4.5 |
| React | 19.3.0 |
| TypeScript | 5.7 |
| Vitest | 2.1.9 |
| Evolution API | v2.3.7 |
| Postgres | 16 |
| Redis | 7 |

Atualize esta tabela junto com o `CHANGELOG.md` sempre que validar uma versão
nova.

## Atualizando a Evolution

1. Leia o changelog oficial.
2. Faça backup dos volumes.
3. `docker compose pull && docker compose up -d`.
4. Confira `connectionStatus`.
5. Envie uma mensagem de teste.
6. Se algo quebrar, volte a tag anterior no compose.

## Atualizando o Next.js

1. `npm install next@latest react@latest react-dom@latest`.
2. `npm run typecheck && npm run build`.
3. Teste o painel, o preview e o cron.
4. Rode `npm run sync-core` se o núcleo mudou.

## Sincronizando o núcleo

O núcleo é a fonte da verdade em `packages/core`. As receitas têm uma cópia.

```bash
npm run sync-core
```

Nunca edite `recipes/*/src/core` diretamente: a próxima sincronização
sobrescreve.

## Troubleshooting

| Sintoma | Onde olhar | Correção |
|---|---|---|
| `Configuração incompleta` | `.env` | preencha as variáveis listadas |
| `401` na Evolution | chave | confira `EVOLUTION_API_KEY` |
| `404` na Evolution | instância | confira `EVOLUTION_INSTANCE` |
| mensagem não chega | `connectionStatus` | reconecte o QR |
| grupo não encontrado | JID | liste os grupos de novo |
| sem preview card | `PUBLIC_BASE_URL`/HTTPS | use túnel/HTTPS e token novo |
| cartão com título antigo | cache | gere novo token |
| envio duplicado | storage | use Redis/banco em múltiplas instâncias |
| horário errado | `TIMEZONE` | use `America/Sao_Paulo` |
| `RATE_LIMIT` | intervalo | aumente `SEND_GAP_MS` |
| URL bloqueada | SSRF | use domínio público |
| `Nenhuma fonte configurada` | `PRODUCTS_FILE`/`SHOPEE_*` | configure uma fonte |

## Diagnóstico rápido

```bash
# saúde da aplicação
curl -s http://localhost:3001/health | jq

# instâncias da Evolution
curl -s -H "apikey: $EVOLUTION_API_KEY" \
  http://localhost:8080/instance/fetchInstances | jq

# preview de uma mensagem (não envia)
npm run preview -- --url https://example.com/produto

# ciclo diário forçado
npm run once -- --force
```

## Como contribuir

1. Abra uma issue descrevendo o problema/cenário.
2. Faça um fork e uma branch.
3. Rode `npm run check` (sync, typecheck e testes).
4. Abra o PR com uma descrição curta e o que foi testado.

## Escopo

O kit é um ponto de partida, não um produto com suporte 24/7. Issues são
bem-vindas; prazos não são garantidos.

## Licença

MIT. Use, copie, adapte e publique, mantendo o aviso de copyright.
