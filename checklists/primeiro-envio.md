# Checklist · Primeiro envio

Objetivo: receber uma mensagem no seu próprio número em menos de 30 minutos.

## Antes de começar

- [ ] Tenho um número dedicado (não o principal)
- [ ] Tenho Docker instalado (ou uma instância Evolution já rodando)
- [ ] Sei o nome da instância e a chave da API
- [ ] Estou no grupo de teste (ou vou usar meu número)

## Infra

- [ ] `cp infra/docker-evolution/.env.example .env`
- [ ] Gerei `AUTHENTICATION_API_KEY` com 32 bytes aleatórios
- [ ] `docker compose up -d`
- [ ] `http://localhost:8080/manager` abre
- [ ] Criei a instância `ofertas`
- [ ] Li o QR code com o número dedicado
- [ ] `connectionStatus` está `open`

## Receita

- [ ] `cd recipes/node-cron && cp .env.example .env`
- [ ] `EVOLUTION_API_URL` aponta para a instância
- [ ] `EVOLUTION_API_KEY` é a mesma do compose
- [ ] `EVOLUTION_INSTANCE` é `ofertas`
- [ ] `WHATSAPP_TARGET` é meu número em E.164 ou o JID do grupo
- [ ] `PRODUCTS_FILE` aponta para um JSON válido
- [ ] `npm install`

## Teste

- [ ] `npm run preview -- --url https://example.com/produto` monta a mensagem
- [ ] O link aparece sozinho em uma linha
- [ ] `npm run send -- --url https://example.com/produto` retorna sucesso
- [ ] A mensagem chegou no destino
- [ ] O texto está legível no celular
- [ ] Nenhum segredo apareceu no console

## Se falhou

| Onde parou | Vá para |
|---|---|
| Docker não sobe | `docs/02-evolution-api.md` |
| 401/404 na Evolution | `docs/10-manutencao.md` |
| Mensagem não chega | `docs/10-manutencao.md` |
| Erro de configuração | leia a lista de variáveis faltantes |

## Depois

- [ ] Configurei `LINK_SECRET` e `PUBLIC_BASE_URL`
- [ ] O cartão de preview apareceu
- [ ] Defini `CRON_SECRET`
- [ ] Testei o agendamento
- [ ] Guardei as chaves no gerenciador de senhas
