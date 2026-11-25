# whatsapp-ofertas-kit

Guia + código de referência para montar **a sua** automação de ofertas no
WhatsApp: buscar produtos, montar a mensagem, gerar o cartão de preview e
publicar em um grupo ou número que você controla.

Sem bot hospedado, sem credenciais de terceiros, sem lista de números. Você
sobe a sua instância da Evolution API, conecta o seu número e usa as suas
chaves.

```
produtos  →  normalizar  →  mensagem  →  link de preview  →  Evolution API  →  grupo
```

## Comece por aqui

Caminho de ouro: **5 comandos** até a primeira mensagem.

```bash
# 1. Suba a sua Evolution API
cd infra/docker-evolution
cp .env.example .env          # edite AUTHENTICATION_API_KEY
docker compose up -d

# 2. Conecte o número em http://localhost:8080/manager
#    Instance → Create → nome "ofertas" → leia o QR code

# 3. Configure a receita
cd ../../recipes/node-cron
cp .env.example .env          # edite EVOLUTION_* e WHATSAPP_TARGET
npm install

# 4. Veja a mensagem sem enviar
npm run preview -- --url https://example.com/produto

# 5. Envie
npm run send -- --url https://example.com/produto
```

Se a mensagem chegou, está pronto. O passo a passo detalhado, com o JID do
grupo e os erros comuns, está em [`docs/02-evolution-api.md`](docs/02-evolution-api.md)
e no [`checklists/primeiro-envio.md`](checklists/primeiro-envio.md).

> Tempo realista na primeira vez: 30–60 minutos, quase tudo lendo o QR code e
> descobrindo o JID do grupo.

## O que tem aqui

| Pasta | O que é |
|---|---|
| [`packages/core`](packages/core) | núcleo TypeScript: provider, mensagem, links, fontes, storage |
| [`recipes/node-cron`](recipes/node-cron) | **caminho de ouro**: script + servidor mínimo + agendador |
| [`recipes/nextjs-site`](recipes/nextjs-site) | painel Next.js para pré-visualizar e enviar |
| [`infra/docker-evolution`](infra/docker-evolution) | compose da Evolution + Postgres + Redis |
| [`docs`](docs) | guias numerados, do conceito ao deploy |
| [`prompts`](prompts) | prompts prontos para uma IA montar/adaptar/auditar |
| [`templates`](templates) | mensagens, produtos, cron, systemd |
| [`checklists`](checklists) | primeiro envio, segurança, go-live |

As receitas são **autocontidas**: cada uma tem a sua cópia do núcleo em
`src/core`, sem workspace e sem link simbólico. Dá para copiar a pasta inteira
para outro projeto.

## Dois caminhos

### 1. Node + cron (recomendado para começar)

Roda em qualquer VPS ou máquina com Node. Sem banco, sem framework, sem build.

```bash
cd recipes/node-cron
npm run preview -- --url https://example.com/produto   # não envia
npm run send    -- --url https://example.com/produto   # envia agora
npm run once    -- --force                             # ciclo diário
npm run start                                          # servidor + agendador
```

Endpoints: `/health`, `/o/:token` (preview), `/cron` (Bearer), `/send` (Bearer).
Detalhes em [`recipes/node-cron/README.md`](recipes/node-cron/README.md).

### 2. Site Next.js

Painel para colar a URL, revisar a mensagem e enviar. Também serve como
hospedagem do preview card.

```bash
cd recipes/nextjs-site
npm install
npm run dev
```

Rotas: `/`, `/o/:token`, `/api/health`, `/api/cron`. Detalhes em
[`recipes/nextjs-site/README.md`](recipes/nextjs-site/README.md).

## Fontes de produto

1. **Lista manual** (`products.json`) — funciona sempre, sem API externa.
2. **Open Graph** (`PRODUCT_URLS` ou `--url`) — extrai título, imagem e preço da
   página, com proteção SSRF.
3. **Shopee afiliados** (`SHOPEE_*`) — requer aprovação no programa.

A prioridade é Shopee > JSON > URLs. Veja [`docs/04-produtos.md`](docs/04-produtos.md).

## Preview card

Links curtos de marketplace não geram cartão no WhatsApp porque o motor não
segue o redirecionamento. O kit publica uma página própria `https://seu-site/o/<token>`
com as metatags Open Graph e um token HMAC assinado, sem banco.

Ative com:

```env
PUBLIC_BASE_URL="https://seu-site.com"
LINK_SECRET="uma-chave-aleatoria-com-32-caracteres"
```

Sem essas variáveis, o kit envia o link direto do produto. Veja
[`docs/06-preview-card.md`](docs/06-preview-card.md).

## Documentação

| # | Guia |
|---|---|
| 00 | [Qual caminho seguir](docs/00-decisao.md) |
| 01 | [Conceitos: JID, preview, limites, opt-in](docs/01-conceitos.md) |
| 02 | [Subindo a sua Evolution API](docs/02-evolution-api.md) |
| 03 | [Alternativas de provedor](docs/03-alternativas.md) |
| 04 | [Buscando produtos](docs/04-produtos.md) |
| 05 | [Mensagens e templates](docs/05-mensagem.md) |
| 06 | [Preview card](docs/06-preview-card.md) |
| 07 | [Agendamento e idempotência](docs/07-agendamento.md) |
| 08 | [Segurança](docs/08-seguranca.md) |
| 09 | [Deploy](docs/09-deploy.md) |
| 10 | [Manutenção e troubleshooting](docs/10-manutencao.md) |

Para IA: [`AGENTS.md`](AGENTS.md) e [`llms.txt`](llms.txt).

## Deploy em 1 clique (opcional)

Se você não quer clonar e configurar manualmente, use os botões abaixo. Eles
criam uma cópia do repositório na sua conta e abrem o painel do provedor com
as variáveis de ambiente para você preencher.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/SEU-USUARIO-GITHUB/whatsapp-ofertas-kit&envs=EVOLUTION_API_URL,EVOLUTION_API_KEY,EVOLUTION_INSTANCE,WHATSAPP_TARGET,PUBLIC_BASE_URL,LINK_SECRET,CRON_SECRET,ADMIN_TOKEN,TIMEZONE,SEND_HOUR&optionalEnvs=PUBLIC_BASE_URL,LINK_SECRET,CRON_SECRET,ADMIN_TOKEN)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SEU-USUARIO-GITHUB/whatsapp-ofertas-kit)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SEU-USUARIO-GITHUB/whatsapp-ofertas-kit&root-directory=recipes%2Fnextjs-site&env=EVOLUTION_API_URL,EVOLUTION_API_KEY,EVOLUTION_INSTANCE,WHATSAPP_TARGET,PUBLIC_BASE_URL,LINK_SECRET,CRON_SECRET,ADMIN_TOKEN)

> Substitua `seu-usuario` pelo seu usuário/org do GitHub antes de publicar.

## Setup interativo

Para quem não quer editar `.env` manualmente:

```bash
npm run setup -- node-cron      # gera recipes/node-cron/.env
npm run setup -- nextjs-site    # gera recipes/nextjs-site/.env
```

O script pergunta as variáveis e preserva os comentários do `.env.example`.

## Comandos do repositório

```bash
npm run sync-core     # copia packages/core/src para as receitas
npm run typecheck     # core + node-cron + next
npm test              # testes do núcleo
npm run check         # sync + typecheck + testes
```

Requisitos: Node 20.9+ e, para a infra, Docker + Docker Compose.

## Segurança

- Nenhuma credencial real no repositório; só `.env.example`.
- Segredos nunca usam `NEXT_PUBLIC_`.
- `/cron` e `/send` exigem `Authorization: Bearer` com comparação em tempo
  constante. Sem segredo configurado, o endpoint bloqueia.
- Leitura de URL externa bloqueia `localhost`, faixas privadas, portas
  incomuns, respostas grandes e redirects para a rede interna (SSRF).
- Logs redigem chaves.
- CI roda typecheck, testes, build e `gitleaks`.

Leia [`docs/08-seguranca.md`](docs/08-seguranca.md) e o
[`checklists/seguranca.md`](checklists/seguranca.md).

## Escopo e ética

Este kit é para **grupos e canais próprios, com opt-in**. Ele não faz e não vai
fazer:

- disparo em massa para listas de números;
- DM para desconhecidos;
- scraping de grupos ou membros;
- contorno de bloqueio/banimento;
- hospedagem de instância ou empréstimo de credenciais.

A Evolution API usa o protocolo não-oficial do WhatsApp Web (Baileys). Existe
risco real de banimento. Use um chip dedicado, mantenha intervalo entre envios e
tenha um plano B. Para operação comercial, considere a API oficial da Meta
([`docs/03-alternativas.md`](docs/03-alternativas.md)).

## Personalizando

- **Outro provedor**: implemente `WhatsAppProvider` em `packages/core/src/providers/`
  e rode `npm run sync-core`. Prompt em [`prompts/01-adaptar-provedor.md`](prompts/01-adaptar-provedor.md).
- **Outra fonte**: implemente `ProductSource` em `packages/core/src/sources/`.
- **Outro storage**: implemente `Storage` (há `MemoryStorage` e `FileStorage`;
  Redis em [`docs/07-agendamento.md`](docs/07-agendamento.md)).
- **Outro texto**: edite `packages/core/src/message/deal.ts` ou passe `headline`,
  `cta` e `link` nas opções.

Regra de ouro: `packages/core` é a fonte da verdade. Nunca edite
`recipes/*/src/core` diretamente.

## FAQ

**Preciso de número novo?** Sim, recomendado. Não use o principal.

**Funciona sem Docker?** Sim, se você já tiver uma instância Evolution (ou outro
provedor) acessível por HTTP.

**Preciso de banco?** Não. A trava diária usa arquivo (ou memória). Para várias
instâncias, use Redis.

**O cartão não aparece. O que é?** Provavelmente falta `PUBLIC_BASE_URL` HTTPS
ou `LINK_SECRET`. Veja [`docs/06-preview-card.md`](docs/06-preview-card.md).

**Posso usar na Vercel?** Sim, a receita Next.js. Mas `MemoryStorage` não
persiste entre instâncias — use Redis/Upstash para deduplicação real.

**É oficial?** A Evolution não é. A Meta Cloud API é. Veja
[`docs/03-alternativas.md`](docs/03-alternativas.md).

## Contribuindo

Issues e PRs são bem-vindos. Leia [`CONTRIBUTING.md`](CONTRIBUTING.md) e rode
`npm run check` antes de abrir o PR. Vulnerabilidades: [`SECURITY.md`](SECURITY.md).

## Licença

[MIT](LICENSE). Use, copie, adapte e publique mantendo o aviso de copyright.

English summary: [`README.en.md`](README.en.md).
