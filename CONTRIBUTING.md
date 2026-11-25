# Contribuindo

Obrigado pelo interesse. Este é um kit de referência, mantido em ritmo de
projeto aberto: issues e PRs são bem-vindos, prazos não são garantidos.

## Antes de abrir uma issue

- Leia [`docs/10-manutencao.md`](docs/10-manutencao.md) (troubleshooting).
- Procure issues existentes.
- Se for bug, inclua: sistema, versão do Node, receita, passos, saída de erro
  **sem segredos**.

## PRs

1. Abra uma issue ou descreva bem o problema no PR.
2. Faça fork e crie uma branch curta (`fix/preview-token`, `feat/zapi`).
3. Rode:

```bash
npm ci --prefix packages/core
npm ci --prefix recipes/node-cron
npm ci --prefix recipes/nextjs-site
npm run check
npm --prefix recipes/nextjs-site run build
```

4. Se alterou o núcleo, rode `npm run sync-core` e inclua as cópias no commit.
5. Atualize docs, `.env.example` e `CHANGELOG.md` quando o comportamento mudar.
6. Descreva o que testou e o que não testou.

## Estilo

- TypeScript estrito, ESM.
- Código/identificadores em inglês; docs/comentários em pt-BR.
- Sem dependência nova sem justificativa.
- Sem `any` desnecessário, sem `console.log` esquecido.
- Mensagens de erro acionáveis e sem segredo.
- Exemplos usam `example.com`, nunca marcas reais.

## Escopo

Aceitamos:

- novos provedores (Meta Cloud API, Z-API...);
- novas fontes de produto que respeitem os termos de uso;
- storages distribuídos (Redis, Postgres);
- melhorias de acessibilidade, testes e documentação;
- correções de segurança.

Não aceitamos:

- envio em massa, listas de números, DM para desconhecidos;
- scraping de grupos ou membros;
- contorno de banimento ou de limites do WhatsApp;
- código que exija credenciais de terceiros para o caminho básico;
- remoção das proteções de segurança (SSRF, Bearer, limite de mensagem).

## Segurança

Não abra issue pública para vulnerabilidade. Veja [`SECURITY.md`](SECURITY.md).

## Licença

Ao contribuir, você concorda que sua contribuição é licenciada sob a MIT deste
repositório.
