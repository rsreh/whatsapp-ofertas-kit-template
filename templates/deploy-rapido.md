# Deploy rápido (template)

Este arquivo resume o caminho mais curto para colocar o kit no ar usando um
template hospedado (Railway/Render) + Evolution API.

## 1. Evolution API (Railway template)

1. Acesse o Railway → **New Project → Deploy Template**.
2. Busque por "Evolution API" e implante.
3. Anote:
   - `EVOLUTION_API_URL` (URL pública do serviço)
   - `EVOLUTION_API_KEY` (chave definida no template)
   - `EVOLUTION_INSTANCE` (crie a instância "ofertas" no manager e leia o QR)

## 2. App (este kit)

### Opção A — Railway (mesmo projeto)

1. No mesmo projeto Railway: **New Service → GitHub Repo** (fork deste repo).
2. Root directory: `recipes/node-cron`.
3. Variables: cole as do `.env.example` e preencha.
4. Healthcheck: `/health`.
5. Gere um domínio e use em `PUBLIC_BASE_URL`.

### Opção B — Render (Blueprint)

1. Fork do repo.
2. Render → **New Blueprint** → aponte para `render.yaml` da raiz.
3. Preencha as variáveis marcadas como `sync: false`.

### Opção C — Vercel (Next.js)

1. Vercel → **New Project** → root directory `recipes/nextjs-site`.
2. Configure as variáveis de ambiente.
3. Use `templates/github-actions-cron.yml` para o cron (GitHub Actions).

## 3. Cron (GitHub Actions)

1. No seu fork: **Settings → Secrets → Actions**.
2. Adicione `SITE_URL` e `CRON_SECRET`.
3. Copie `templates/github-actions-cron.yml` para `.github/workflows/oferta.yml`.
4. Ajuste o horário (UTC).

## 4. Checklist

- [ ] Evolution acessível por HTTPS
- [ ] número conectado
- [ ] grupo no `WHATSAPP_TARGET`
- [ ] `/health` retorna ok
- [ ] teste de envio chegou
- [ ] preview card apareceu (se configurado)
- [ ] cron disparado manualmente com sucesso
