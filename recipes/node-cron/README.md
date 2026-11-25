# Receita: Node + cron (caminho de ouro)

Script isolado em TypeScript, com um servidor HTTP mínimo para:

- `GET /o/:token` — página de preview com metatags Open Graph;
- `GET /health` — diagnóstico;
- `GET /cron` — executa o ciclo diário (protegido);
- `POST /send` — envia uma oferta agora (protegido).

É o caminho mais curto: sem banco, sem framework, sem build.

## 1. Suba a sua Evolution API

```bash
cd ../../infra/docker-evolution
cp .env.example .env
docker compose up -d
```

Abra `http://localhost:8080/manager`, crie a instância `ofertas`, leia o QR
code e conecte o número. Depois pegue o JID do grupo:

```bash
curl -H "apikey: SUA_CHAVE" \
  "http://localhost:8080/group/fetchAllGroups/ofertas?getParticipants=false"
```

## 2. Configure

```bash
cp .env.example .env
```

Preencha `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `WHATSAPP_TARGET`.
Para testar sem grupo, use o seu próprio número em E.164 (`5511999999999`).

## 3. Instale e rode

```bash
npm install
npm run preview -- --url https://example.com/produto
npm run send -- --url https://example.com/produto
```

Se a mensagem chegou, o caminho está pronto.

## 4. Agende

```bash
npm run start
```

O processo verifica a cada minuto se já passou de `SEND_HOUR` no fuso
`TIMEZONE` e envia uma oferta por dia, com trava em `STATE_FILE`.

Para usar cron do sistema em vez do agendador interno:

```cron
0 9 * * * cd /caminho/do/projeto && npm run once >> /var/log/ofertas.log 2>&1
```

## 5. Preview card (opcional)

O cartão com foto só aparece se o WhatsApp conseguir acessar a URL pública.
Para testar localmente, suba um túnel:

```bash
cloudflared tunnel --url http://localhost:3001
```

Copie a URL gerada para `PUBLIC_BASE_URL` e defina um `LINK_SECRET` com pelo
menos 16 caracteres. Depois:

```bash
npm run preview -- --url https://example.com/produto
```

O link `.../o/<token>` deve abrir a página e, ao colar no WhatsApp, gerar o
cartão.

## Endpoints

| Método | Rota | Proteção |
|---|---|---|
| GET | `/` | pública |
| GET | `/health` | pública (sem segredos) |
| GET | `/o/:token` | assinatura HMAC |
| GET | `/cron` | `Authorization: Bearer $CRON_SECRET` |
| POST | `/send` | `Authorization: Bearer $ADMIN_TOKEN` |

## Estrutura

```
src/
  app.ts       monta config, provider, fonte e storage
  cli.ts       preview / send / once
  server.ts    HTTP + agendador
  core/        cópia do núcleo (não edite aqui)
```

O núcleo é a fonte da verdade em `packages/core`. Para atualizar a cópia:

```bash
npm run sync-core
```
