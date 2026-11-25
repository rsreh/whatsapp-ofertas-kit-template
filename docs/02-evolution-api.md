# 02 · Subindo a sua Evolution API

Este guia usa o compose de `infra/docker-evolution`. Ele sobe a Evolution, o
Postgres e o Redis. Tudo local, com dados seus.

## Pré-requisitos

- Docker e Docker Compose instalados.
- Um número dedicado (chip novo ou número secundário).
- Acesso ao grupo de destino.

## Passo a passo

### 1. Configure o ambiente

```bash
cd infra/docker-evolution
cp .env.example .env
```

Gere a chave:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole em `AUTHENTICATION_API_KEY`. Esse valor será o `EVOLUTION_API_KEY` das
receitas. Guarde em um gerenciador de senhas.

### 2. Suba os containers

```bash
docker compose up -d
docker compose logs -f evolution
```

A API responde em `http://localhost:8080`. O manager fica em
`http://localhost:8080/manager`.

### 3. Crie a instância

Pelo manager: **Instance → Create**, nome `ofertas`, integration
`WHATSAPP-BAILEYS`, QR code habilitado.

Ou por API:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_CHAVE" \
  -d '{"instanceName":"ofertas","integration":"WHATSAPP-BAILEYS","qrcode":true}'
```

### 4. Conecte o número

No celular do número dedicado: **WhatsApp → Dispositivos conectados →
Conectar dispositivo** e leia o QR.

Se o QR expirar:

```bash
curl -H "apikey: SUA_CHAVE" \
  http://localhost:8080/instance/connect/ofertas
```

Confira o estado:

```bash
curl -H "apikey: SUA_CHAVE" \
  http://localhost:8080/instance/fetchInstances
```

O campo `connectionStatus` deve estar `open`.

### 5. Entre no grupo

Adicione o número dedicado ao grupo de ofertas. Depois liste os grupos:

```bash
curl -H "apikey: SUA_CHAVE" \
  "http://localhost:8080/group/fetchAllGroups/ofertas?getParticipants=false"
```

Copie o `id` do grupo (termina em `@g.us`). Esse é o `WHATSAPP_TARGET`.

### 6. Teste o envio

```bash
curl -X POST http://localhost:8080/message/sendText/ofertas \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_CHAVE" \
  -d '{"number":"SEU_JID_AQUI","text":"Teste","linkPreview":true}'
```

## Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `401 Unauthorized` | `apikey` errada | confira `AUTHENTICATION_API_KEY` |
| `404 instance not found` | nome da instância errado | use o mesmo de `EVOLUTION_INSTANCE` |
| QR não aparece | instância já conectada | `fetchInstances` e reconecte |
| Grupo não encontrado | número fora do grupo | adicione e liste de novo |
| Mensagem não chega | número desconectado | leia o QR novamente |
| Container reinicia | banco indisponível | `docker compose logs postgres` |

## Produção

- Coloque atrás de HTTPS (Caddy, Nginx ou Traefik).
- Não exponha `8080` direto na internet.
- Restrinja o firewall à aplicação que envia.
- Faça backup de `postgres_data` e `evolution_instances`.
- Monitore o container e o status da conexão.

Exemplo de Caddy:

```caddyfile
evolution.seudominio.com {
  reverse_proxy localhost:8080
}
```

Depois ajuste `SERVER_URL` e `EVOLUTION_API_URL` para a URL pública.

## Atualização

```bash
docker compose pull
docker compose up -d
```

Leia o changelog da Evolution antes de atualizar. Mudanças de versão podem
exigir ajustes no `.env`.
