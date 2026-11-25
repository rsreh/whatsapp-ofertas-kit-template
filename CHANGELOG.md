# Changelog

Todas as mudanças relevantes deste kit são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-11-22

### Adicionado

- Núcleo TypeScript reutilizável (`packages/core`) com provider Evolution API,
  templates de mensagem, links assinados com metatags Open Graph, fontes de
  produto (Shopee afiliados, Open Graph e lista manual) e trava de envio diário.
- Receita `recipes/node-cron`: script isolado + servidor HTTP mínimo para
  preview, healthcheck e cron.
- Receita `recipes/nextjs-site`: site com painel de preview e envio.
- Infraestrutura `infra/docker-evolution` para subir a sua própria instância.
- Guias em `docs/`, prompts para IA, templates de mensagem e checklists.
- CI com typecheck, testes e build, além de varredura de segredos com gitleaks.

### Segurança

- Nenhuma credencial real no repositório; apenas `.env.example`.
- Endpoints de cron exigem `Authorization: Bearer <segredo>`.
- Leitura de URL externa com bloqueio de endereços privados (SSRF).
