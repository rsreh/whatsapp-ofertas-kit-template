# Infra: Evolution API com Docker

Sobe a **sua** instância da Evolution API (WhatsApp não-oficial) com Postgres
e Redis. Nada aqui usa credenciais de terceiros.

## Requisitos

- Docker + Docker Compose
- Um número de WhatsApp dedicado (recomendado: chip novo, não o principal)
- 1 GB de RAM livre (2 GB é confortável)

## 1. Configure

```bash
cp .env.example .env
```

Gere uma chave forte para `AUTHENTICATION_API_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o valor no `.env`. **Não commite esse arquivo.**

## 2. Suba

```bash
docker compose up -d
docker compose logs -f evolution
```

A API fica em `http://localhost:8080` e o manager em
`http://localhost:8080/manager`.

## 3. Crie a instância e conecte o número

Pelo manager: **Instance → Create**, nome `ofertas`, integration
`WHATSAPP-BAILEYS`. Leia o QR code com o WhatsApp do número dedicado
(Dispositivos conectados → Conectar dispositivo).

Ou por API:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_CHAVE" \
  -d '{"instanceName":"ofertas","integration":"WHATSAPP-BAILEYS","qrcode":true}'
```

Se o QR expirar:

```bash
curl -H "apikey: SUA_CHAVE" \
  http://localhost:8080/instance/connect/ofertas
```

## 4. Descubra o JID do grupo

```bash
curl -H "apikey: SUA_CHAVE" \
  "http://localhost:8080/group/fetchAllGroups/ofertas?getParticipants=false"
```

O campo `id` do grupo termina em `@g.us`. Use esse valor em
`WHATSAPP_TARGET` (na receita, não aqui).

## 5. Teste o envio

```bash
curl -X POST http://localhost:8080/message/sendText/ofertas \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_CHAVE" \
  -d '{"number":"120363000000000000@g.us","text":"Teste do whatsapp-ofertas-kit","linkPreview":true}'
```

Se a mensagem chegou, a infraestrutura está pronta.

## Produção

- Coloque atrás de HTTPS (Caddy/Nginx/Traefik) e **não** exponha a porta 8080
  crua na internet.
- Restrinja o firewall à sua aplicação.
- Faça backup dos volumes `postgres_data` e `evolution_instances`.
- Use `restart: unless-stopped` (já configurado) e monitore o container.
- Ao atualizar a imagem, leia o changelog da Evolution antes:

```bash
docker compose pull
docker compose up -d
```

## Custos e riscos

- A Evolution API é open-source, mas você paga a VPS.
- É uma integração **não-oficial** (Baileys). Existe risco de banimento do
  número. Use um chip dedicado, sem disparo em massa, e leia `docs/08`.
