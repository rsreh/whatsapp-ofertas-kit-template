# 04 · Buscando produtos

O kit aceita três fontes. Todas produzem o mesmo formato:

```ts
type Product = {
  title: string;          // obrigatório
  url: string;            // obrigatório, http(s)
  price?: number | null;
  originalPrice?: number | null;
  discountRate?: number;  // 0–99
  imageUrl?: string | null;
  shopName?: string;
  note?: string | null;   // cupom, frete...
};
```

## 1. Lista manual (JSON)

A fonte mais simples e a única que não depende de API externa.

`products.json`:

```json
[
  {
    "title": "Produto de exemplo",
    "url": "https://example.com/produto",
    "price": 89.9,
    "originalPrice": 129.9,
    "discountRate": 31,
    "imageUrl": "https://example.com/foto.jpg",
    "shopName": "Loja Exemplo",
    "note": "Cupom FRETE10"
  }
]
```

Ative com `PRODUCTS_FILE="products.json"`.

Aceita também `{ "products": [ ... ] }`. Preços podem vir como número ou
string (`"89,90"`).

## 2. Open Graph (URL)

Informe uma ou mais URLs em `PRODUCT_URLS` (separadas por vírgula) ou use
`--url` no CLI. O kit busca a página e extrai:

- `og:title` / `<title>`
- `og:image`
- `og:description`
- `product:price:amount`, `og:price:amount` ou JSON-LD

Exemplo:

```bash
npm run preview -- --url https://example.com/produto
```

Limitações:

- páginas que exigem login ou bloqueiam bots não funcionam;
- preço pode vir errado em páginas com várias variações;
- sempre revise a prévia antes de enviar.

### Proteção SSRF

A leitura de URL é restrita a `http`/`https`, sem credenciais, sem portas
incomuns, sem hosts locais/privados, com timeout, limite de 512 KB e no máximo
3 redirecionamentos. Isso evita que alguém use o endpoint para acessar a rede
interna do servidor.

## 3. Shopee afiliados

A API oficial de afiliados exige aprovação no programa. Sem aprovação, use a
lista manual.

Variáveis:

```env
SHOPEE_APP_ID="..."
SHOPEE_SECRET="..."
SHOPEE_KEYWORDS="filamento pla,resina"
SHOPEE_MIN_DISCOUNT="10"
```

A assinatura segue o formato:

```
SHA256 Credential=<app_id>, Timestamp=<segundos>, Signature=<sha256(app_id + timestamp + payload + secret)>
```

O kit consulta `productOfferV2`, normaliza preço/desconto, remove duplicados e
ordena por qualidade (desconto + avaliação + vendas).

Cuidados:

- a API devolve resultados frouxos; filtre por palavra-chave no título se
  necessário;
- `sales` costuma vir baixo (volume recente), não use como corte rígido;
- links de afiliado devem ser divulgados como tal.

## Criando uma nova fonte

Implemente a interface:

```ts
import type { Product, ProductSource } from "../types";

export class MinhaFonte implements ProductSource {
  readonly name = "minha-fonte";

  async list(options: { limit?: number } = {}): Promise<Product[]> {
    return [];
  }
}
```

Depois registre em `src/app.ts` (node-cron) ou `lib/source.ts` (Next).

## Boas práticas

- Sempre valide `url` com `http(s)`.
- Prefira `price` numérico; formate só na mensagem.
- Use `note` para cupom e condição, não para textão.
- Não busque a mesma URL a cada minuto: cacheie.
- Respeite os termos de uso de cada marketplace.
