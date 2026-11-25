# whatsapp-ofertas-kit (English)

A guide + reference code to build **your own** WhatsApp deals automation: fetch
products, compose the message, generate a link preview card and post to a group
or number you control.

No hosted bot. No third-party credentials. No phone-number lists. You run your
own Evolution API instance, connect your own number and use your own keys.

> Full documentation is in Portuguese (pt-BR). This file is a summary.

## Golden path (about 5 commands)

```bash
cd infra/docker-evolution
cp .env.example .env          # set AUTHENTICATION_API_KEY
docker compose up -d

# open http://localhost:8080/manager, create instance "ofertas", scan the QR

cd ../../recipes/node-cron
cp .env.example .env          # set EVOLUTION_* and WHATSAPP_TARGET
npm install
npm run preview -- --url https://example.com/produto
npm run send    -- --url https://example.com/produto
```

## What's inside

| Path | What it is |
|---|---|
| `packages/core` | TypeScript core: provider, message, signed preview links, sources, storage |
| `recipes/node-cron` | golden path: CLI + tiny HTTP server + scheduler |
| `recipes/nextjs-site` | Next.js panel to preview and send |
| `infra/docker-evolution` | Evolution API + Postgres + Redis compose |
| `docs/` | numbered guides (pt-BR) |
| `prompts/` | ready-to-paste prompts for AI agents |
| `templates/` | messages, products, cron, systemd |
| `checklists/` | first send, security, go-live |

Recipes are self-contained: each one has a copy of the core in `src/core`, no
workspace, no symlink. Copy a recipe folder to another project and it still
works.

## Product sources

1. **Manual JSON** (`products.json`) — always works, no external API.
2. **Open Graph** (`PRODUCT_URLS` or `--url`) — extracts title, image and price
   with SSRF protection.
3. **Shopee affiliate API** (`SHOPEE_*`) — requires program approval.

Priority: Shopee > JSON > URLs.

## Preview card

Short marketplace links often fail to render a WhatsApp card because the crawler
does not follow redirects. The kit serves its own page
`https://your-site/o/<token>` with Open Graph tags and an HMAC-signed token — no
database needed.

Enable with `PUBLIC_BASE_URL` and `LINK_SECRET` (16+ chars). Without them, the
kit sends the product link directly.

## Repository commands

```bash
npm run sync-core     # copy packages/core/src into the recipes
npm run typecheck     # core + node-cron + next
npm test              # core tests
npm run check         # sync + typecheck + tests
```

Requires Node 20.9+. Docker for the infra.

## Security

- No real credentials in the repo, only `.env.example`.
- Secrets never use the `NEXT_PUBLIC_` prefix.
- `/cron` and `/send` require `Authorization: Bearer` with constant-time
  comparison. With no secret configured, the endpoint blocks.
- External URL fetching blocks localhost, private ranges, unusual ports, large
  responses and redirects into the private network (SSRF).
- Logs redact keys.
- CI runs typecheck, tests, build and gitleaks.

See `docs/08-seguranca.md` (pt-BR).

## Scope and ethics

For **your own groups/channels with opt-in**. It does not and will not do bulk
messaging to number lists, DMs to strangers, group scraping, ban evasion, or
hosting instances for others.

Evolution API uses the unofficial WhatsApp Web protocol (Baileys). There is a
real ban risk. Use a dedicated SIM, keep gaps between messages and have a plan
B. For commercial operations, consider the official Meta Cloud API
(`docs/03-alternativas.md`).

## License

[MIT](LICENSE).
