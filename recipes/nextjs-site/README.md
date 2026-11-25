# Receita: site Next.js

Painel mínimo para colar a URL de um produto, ver a mensagem e enviar.

## 1. Suba a sua Evolution API

```bash
cd ../../infra/docker-evolution
cp .env.example .env
docker compose up -d
```

Crie a instância no manager (`http://localhost:8080/manager`), leia o QR
code e conecte o número. Pegue o JID do grupo com:

```bash
curl -H "apikey: SUA_CHAVE" \
  "http://localhost:8080/group/fetchAllGroups/ofertas?getParticipants=false"
```

## 2. Configure

```bash
cp .env.example .env
```

Preencha `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `WHATSAPP_TARGET`.
Para o preview card, defina `PUBLIC_BASE_URL` (a URL pública do site) e um
`LINK_SECRET` de pelo menos 16 caracteres.

## 3. Rode

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, cole uma URL e clique em **Pré-visualizar**.
Depois, **Enviar para o WhatsApp**.

## 4. Agende (opcional)

`GET /api/cron` executa o ciclo diário. Proteja com `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://seu-site.com/api/cron
```

Na Vercel, adicione `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 12 * * *"
    }
  ]
}
```

> A Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando a
> variável `CRON_SECRET` existe no projeto.

## Endpoints

| Método | Rota | Proteção |
|---|---|---|
| GET | `/` | pública |
| GET | `/o/:token` | assinatura HMAC |
| GET | `/api/health` | pública (sem segredos) |
| GET | `/api/cron` | `Authorization: Bearer $CRON_SECRET` |

## Estrutura

```
app/
  page.tsx            painel
  DealForm.tsx        formulário (client)
  actions.ts          server action de preview/envio
  o/[token]/route.ts  preview card
  api/cron/route.ts   ciclo diário
  api/health/route.ts diagnóstico
lib/source.ts         escolha da fonte de produtos
src/core/             cópia do núcleo (não edite aqui)
```

Para atualizar o núcleo:

```bash
npm run sync-core
```
