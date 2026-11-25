# 06 · Preview card (o cartão com foto)

## O problema

Quando você cola um link no WhatsApp, ele busca as metatags Open Graph da
página e monta um cartão com imagem, título e descrição.

Links curtos de marketplace (`s.shopee.com.br/...`, `meli.la/...`) redirecionam
para outro domínio. O motor que monta o cartão **não segue** esse
redirecionamento, então o cartão não aparece.

## A solução

Publicar uma página sua, com as metatags já prontas, que redireciona para o
destino:

```
https://seu-site.com/o/<token>
```

O WhatsApp lê essa página, encontra `og:image`, `og:title` e
`og:description`, monta o cartão e o visitante é levado à oferta.

## Token assinado (sem banco)

O token carrega os dados do produto e uma assinatura HMAC-SHA256:

```
base64url(payload).hmac
```

Payload:

```json
{
  "u": "https://destino.com/produto",
  "t": "Título do produto",
  "i": "https://destino.com/foto.jpg",
  "p": 99.9,
  "o": 129.9,
  "d": 23,
  "e": 1764000000000
}
```

Vantagens:

- não precisa de banco para servir o preview;
- ninguém consegue forjar um link com outro destino;
- expira em 7 dias (configurável);
- o token é opaco e curto o suficiente para o WhatsApp.

Ative com:

```env
PUBLIC_BASE_URL="https://seu-site.com"
LINK_SECRET="uma-chave-aleatoria-com-32-caracteres"
```

Sem essas duas variáveis, o kit envia o link direto do produto (funciona, mas
sem cartão em links curtos).

## Metatags geradas

```html
<meta property="og:type" content="product">
<meta property="og:title" content="Título">
<meta property="og:description" content="R$ 99,90 · 23% OFF">
<meta property="og:image" content="https://.../foto.jpg">
<meta property="og:url" content="https://seu-site.com/o/<token>">
<meta name="twitter:card" content="summary_large_image">
```

A página também tem um cartão visível e redireciona com `meta refresh` +
JavaScript.

## Requisitos para funcionar

1. **HTTPS público.** O WhatsApp precisa acessar a URL. `localhost` não serve.
2. **Imagem acessível.** Preferência por JPG/PNG, pelo menos 300×300.
3. **Token novo por envio.** O WhatsApp cacheia metatags por URL; reutilizar o
   mesmo token pode mostrar dados antigos.
4. **Sem `noindex` bloqueando.** O kit usa `noindex` (não queremos a página no
   Google), mas isso não impede o preview.
5. **Resposta rápida.** Evite redirects em cadeia; o kit responde direto.

## Testando

Local:

```bash
# suba a receita
npm run start

# em outro terminal
cloudflared tunnel --url http://localhost:3001
```

Copie a URL do túnel para `PUBLIC_BASE_URL` e reinicie. Depois:

```bash
npm run preview -- --url https://example.com/produto
```

Cole o link `/o/...` no WhatsApp. O cartão deve aparecer.

Inspecionando as metatags:

```bash
curl -s https://seu-site.com/o/<token> | grep -E "og:|twitter:"
```

## Diagnóstico

| Sintoma | Causa provável | Solução |
|---|---|---|
| Sem cartão | URL não é pública | use túnel/HTTPS |
| Cartão sem foto | imagem bloqueada ou pequena | use imagem pública e maior |
| Título antigo | cache do WhatsApp | gere token novo |
| 404 | token expirado/adulterado | gere novo link |
| Preview não configurado | falta `LINK_SECRET` | configure as duas variáveis |
| Redireciona errado | URL de destino inválida | valide o produto |

## Segurança

- O token é assinado; não dá para trocar o destino sem a chave.
- A URL de destino é validada (`http`/`https`) antes de assinar.
- O link é público por natureza: não coloque dados sensíveis no payload.
- Expire tokens antigos; não use como encurtador permanente.
