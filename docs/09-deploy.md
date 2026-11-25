# 09 · Deploy

## Visão geral

Você precisa de dois serviços:

1. **Evolution API** — pode ficar na mesma VPS ou em outra.
2. **Sua aplicação** — receita `node-cron` (VPS) ou `nextjs-site`
   (VPS/Vercel).

## VPS com Docker (recomendado)

### 1. Suba a Evolution

```bash
cd infra/docker-evolution
cp .env.example .env
# edite AUTHENTICATION_API_KEY e SERVER_URL
docker compose up -d
```

### 2. Suba a aplicação

```bash
cd recipes/node-cron
cp .env.example .env
# edite Evolution, destino e segredos
npm ci
npm run start
```

Mantenha vivo com `systemd`:

```ini
# /etc/systemd/system/whatsapp-ofertas.service
[Unit]
Description=whatsapp-ofertas
After=network.target

[Service]
WorkingDirectory=/opt/whatsapp-ofertas/recipes/node-cron
ExecStart=/usr/bin/npm run start
EnvironmentFile=/opt/whatsapp-ofertas/recipes/node-cron/.env
Restart=always
RestartSec=5
User=ofertas

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now whatsapp-ofertas
sudo journalctl -u whatsapp-ofertas -f
```

> Use `npm ci` (com devDependencies) porque a receita roda TypeScript via
> `tsx`. Se preferir produção enxuta, compile para JavaScript antes.

### 3. HTTPS

Caddy na frente da aplicação e da Evolution:

```caddyfile
ofertas.seudominio.com {
  reverse_proxy localhost:3001
}

evolution.seudominio.com {
  reverse_proxy localhost:8080
}
```

Atualize `PUBLIC_BASE_URL`, `SERVER_URL` e `EVOLUTION_API_URL` para as URLs
públicas.

## Railway (recomendado para Evolution + app juntos)

O Railway tem template oficial da Evolution API. O fluxo mais rápido:

1. Crie a Evolution a partir do template do Railway (pesquise "Evolution API"
   no catálogo de templates do Railway). Anote a URL pública e a chave.
2. Faça fork deste repositório na sua conta.
3. No Railway, **New Project → Deploy from GitHub repo** e selecione a pasta
   `recipes/node-cron` (root directory). O `railway.json` e o `Dockerfile` da
   pasta já configuram o build.
4. Em **Variables**, preencha as variáveis mínimas (ver abaixo).
5. Em **Settings → Healthcheck**, use `/health`.
6. Gere um domínio público (Settings → Domains) e use-o em `PUBLIC_BASE_URL`.

Dica: se quiser tudo em um só projeto Railway, crie dois serviços no mesmo
projeto: um para a Evolution (via template) e outro para este kit (via GitHub).

## Render

1. Faça fork do repositório.
2. No Render, **New → Blueprint** e aponte para o `render.yaml` da raiz.
3. O Blueprint cria o serviço `whatsapp-ofertas-node-cron` com as variáveis
   marcadas como `sync: false` para você preencher no painel.
4. O plano free dorme após inatividade; use um monitor (UptimeRobot) batendo
   em `/health` a cada 5 minutos para manter acordado, ou use o cron do GitHub
   Actions (que também acorda o serviço).

## Fly.io

```bash
cd recipes/node-cron
fly launch --no-deploy   # aceite o fly.toml existente
fly secrets set EVOLUTION_API_URL=... EVOLUTION_API_KEY=... EVOLUTION_INSTANCE=... WHATSAPP_TARGET=... CRON_SECRET=... ADMIN_TOKEN=...
fly deploy
```

## Vercel (Next.js)

1. Importe o repositório e defina o root directory como
   `recipes/nextjs-site`.
2. Configure as variáveis de ambiente no painel.
3. `PUBLIC_BASE_URL` = URL de produção.
4. Adicione `vercel.json` com o cron (veja `docs/07`).
5. A Vercel envia `Authorization: Bearer $CRON_SECRET` no cron.

Cuidados:

- `MemoryStorage` não persiste entre instâncias; para deduplicação real use
  Redis/Upstash.
- O preview `/o/:token` funciona normalmente.
- O envio precisa que a Evolution esteja acessível publicamente (com HTTPS e
  chave).

## Hostinger (Web App Node.js)

- O painel roda o build e reinicia no push.
- Não há SSH/PM2: use o agendador interno ou cron externo.
- Variáveis de ambiente ficam no painel, não no `.env` commitado.
- Se usar MySQL, rode os SQLs no phpMyAdmin (não é o caso deste kit, que não
  exige banco).

## Variáveis mínimas em produção

```env
EVOLUTION_API_URL="https://evolution.seudominio.com"
EVOLUTION_API_KEY="..."
EVOLUTION_INSTANCE="ofertas"
WHATSAPP_TARGET="120363...@g.us"
PUBLIC_BASE_URL="https://ofertas.seudominio.com"
LINK_SECRET="..."
CRON_SECRET="..."
ADMIN_TOKEN="..."
TIMEZONE="America/Sao_Paulo"
SEND_HOUR="9"
```

## Plataformas gratuitas (resumo)

| Plataforma | Free tier | Dorme? | Bom para |
|---|---|---|---|
| Railway | US$ 5 de crédito/mês | não (com crédito) | Evolution + app no mesmo projeto |
| Render | 750h/mês web | sim (15 min inativo) | app pequeno com cron externo |
| Fly.io | 3 VMs compartilhadas | sim (auto-stop) | app pequeno, baixa latência |
| Vercel | hobby ilimitado (com limites) | n/a (serverless) | Next.js + preview card |
| Koyeb | free tier | sim | alternativa simples |

Para quem quer **praticidade máxima**: Railway (template Evolution + este kit no
mesmo projeto, com domínio HTTPS automático). Para **custo zero real**:
Render/Vercel + cron do GitHub Actions acordando o serviço.

> Aviso: em plano free com sleep, o agendador interno não roda enquanto o
> serviço dorme. Use o cron do GitHub Actions (`templates/github-actions-cron.yml`)
> para disparar `/cron` ou `/api/cron` no horário desejado.

## Healthcheck

- `GET /health` (node-cron)
- `GET /api/health` (Next)

Ambos retornam flags sem expor segredos. Use no monitoramento (UptimeRobot,
Better Stack, etc.) e alerte se retornar erro.

## Backup

- `postgres_data` (instâncias e mensagens da Evolution)
- `evolution_instances` (sessões)
- `.data/state.json` (trava diária; perder só permite reenvio)

```bash
docker run --rm -v evolution_postgres_data:/data -v "$PWD":/backup \
  alpine tar czf /backup/postgres-$(date +%F).tgz -C /data .
```

## Logs

- Aplicação: `journalctl` ou logs do provedor.
- Evolution: `docker compose logs -f evolution`.
- Nunca inclua segredos nos logs.

## Atualização

```bash
git pull
npm ci
npm run sync-core
npm run typecheck
npm test
sudo systemctl restart whatsapp-ofertas
```

Na Vercel, o deploy é automático no push.

## Checklist de go-live

- [ ] Evolution acessível por HTTPS
- [ ] número conectado (`connectionStatus: open`)
- [ ] grupo no `WHATSAPP_TARGET`
- [ ] teste de envio chegou
- [ ] preview card apareceu (se configurado)
- [ ] cron protegido e testado
- [ ] healthcheck monitorado
- [ ] backup configurado
- [ ] logs sem segredos
