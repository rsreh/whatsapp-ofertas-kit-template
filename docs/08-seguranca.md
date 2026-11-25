# 08 · Segurança

## Credenciais

- Tudo em `.env`, nunca no código.
- `.env` está no `.gitignore`; o repositório só tem `.env.example`.
- **Nunca** use prefixo `NEXT_PUBLIC_` para chaves. Tudo com esse prefixo vai
  para o navegador.
- Gere chaves aleatórias:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Guarde em gerenciador de senhas (1Password, Bitwarden, Vault).
- Rotacione se houver suspeita de vazamento:
  1. gere nova chave na Evolution;
  2. atualize o `.env`;
  3. reinicie a aplicação;
  4. revogue a antiga.

## Chaves por ambiente

| Variável | Onde vive | Pode ir para o cliente? |
|---|---|---|
| `EVOLUTION_API_KEY` | servidor | não |
| `SHOPEE_SECRET` | servidor | não |
| `LINK_SECRET` | servidor | não |
| `CRON_SECRET` | servidor | não |
| `ADMIN_TOKEN` | servidor | não |
| `WHATSAPP_TARGET` | servidor | não |
| `PUBLIC_BASE_URL` | servidor | sim (é pública) |

## Endpoints de cron e envio

Proteja com `Authorization: Bearer <segredo>`, comparando em tempo constante:

```ts
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  if (first.length !== second.length) return false;
  return timingSafeEqual(first, second);
}
```

Evite token na query string (`?token=...`): ele vaza em logs de proxy,
histórico e referrer. O kit usa apenas header.

Sem segredo configurado, o endpoint **bloqueia** (não fica aberto).

## SSRF na leitura de URL

O endpoint que busca produtos por URL poderia ser usado para acessar a rede
interna. O kit bloqueia:

- protocolos diferentes de `http`/`https`;
- credenciais na URL;
- portas diferentes de 80/443;
- `localhost` e domínios `.localhost`;
- faixas privadas IPv4/IPv6 (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16,
  `::1`, `fc00::/7`, `fe80::/10`);
- respostas maiores que 512 KB;
- mais de 3 redirecionamentos;
- timeout de 8 segundos.

Limitação: DNS rebinding ainda é possível em teoria. Para ambientes críticos,
resolva o IP e conecte diretamente a ele.

## Validação de entrada

- URL: `http`/`https`, sem credenciais.
- Preço: número positivo; aceite `99,90` e `99.90`.
- Texto: limite de 4096 caracteres.
- IDs: nunca confie em id vindo do cliente sem checar dono.
- JSON: limite de corpo (64 KB no servidor de exemplo).

## Logs

- Nunca logue `apikey`, `Authorization`, `LINK_SECRET` ou corpo completo.
- O logger do kit redige chaves que contenham `api_key`, `secret`, `token`,
  `authorization`, `password`.
- Em produção, prefira logs estruturados e retenção curta.

## LGPD

- Colete o mínimo: dados de produto e destino.
- Não armazene números de membros do grupo.
- Se guardar contatos, tenha base legal e política de exclusão.
- Não use o kit para perseguir, assediar ou spammar.

## Risco de ban (WhatsApp não-oficial)

- Use chip dedicado.
- Não dispare em massa.
- Mantenha intervalo entre mensagens.
- Não envie para listas compradas.
- Tenha um número de reserva.
- Se possível, migre para a API oficial em operações comerciais.

## Checklist rápido

- [ ] `.env` fora do Git
- [ ] chaves fortes e únicas
- [ ] `CRON_SECRET` e `ADMIN_TOKEN` definidos
- [ ] endpoints protegidos por header
- [ ] `LINK_SECRET` com 16+ caracteres
- [ ] HTTPS em produção
- [ ] firewall na Evolution (sem 8080 público)
- [ ] logs sem segredos
- [ ] backup do banco
- [ ] plano B para o número
