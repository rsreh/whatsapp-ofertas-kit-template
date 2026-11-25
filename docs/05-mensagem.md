# 05 · Mensagens e templates

## Formatação do WhatsApp

| Efeito | Sintaxe | Exemplo |
|---|---|---|
| Negrito | `*texto*` | `*Oferta*` |
| Itálico | `_texto_` | `_novo_` |
| Riscado | `~texto~` | `~R$ 129,90~` |
| Monoespaçado | ` ```texto``` ` | ` ```código``` ` |

Não use Markdown de link (`[texto](url)`): o WhatsApp não interpreta. O link
deve aparecer cru, em uma linha própria.

## Estrutura recomendada

```
[frase de impacto]

*Título do produto*
💸 De R$ 129,90 por R$ 99,90 (23% OFF)
🎟️ Cupom FRETE10
🏪 Loja Exemplo

🛒 Link da oferta:
https://seu-link

📲 Aproveita que é por tempo limitado!
```

Por quê:

- a primeira linha para o scroll;
- o título em negrito identifica o produto;
- o preço com desconto dá contexto;
- o link sozinho permite o cartão de preview;
- a CTA fecha a ação.

## Templates prontos

O arquivo `templates/mensagens.md` tem variações para:

- oferta com preço e desconto;
- oferta sem preço;
- cupom;
- novidade;
- lembrete de carrinho.

## Placeholders

O helper `renderTemplate` substitui `{{chave}}`:

```ts
renderTemplate("🔥 {{title}} por {{price}}", {
  title: "Fone",
  price: "R$ 99,90",
});
```

Chave ausente vira string vazia — nunca `undefined`.

## Preço e desconto

- Formate sempre com `formatBRL` (pt-BR).
- Se `originalPrice` for maior que `price`, mostre "De X por Y".
- Se houver `discountRate`, mostre o percentual.
- Sem preço, não invente: use a variação sem preço.

## Limites

- 4096 caracteres por mensagem.
- O kit corta com reticências se passar.
- Links muito longos podem ser encurtados pelo preview assinado.

## Frequência e anti-spam

- 1 oferta por dia é um bom começo.
- Se enviar várias, use intervalo de 3–5 segundos.
- Varie o texto: mensagens idênticas em sequência parecem spam.
- Não repita o mesmo produto no mesmo dia (a trava diária ajuda).
- Não envie para quem pediu para sair.

## Teste A/B simples

Altere só a primeira linha e compare cliques no link. Exemplos:

- `🔥 Oferta do dia!`
- `🤯 Olha esse preço!`
- `⚡ 30% OFF!`
- `🤑 Achado na internet!`

Mantenha o resto igual para saber o que funcionou.

## Erros comuns

| Problema | Causa | Correção |
|---|---|---|
| Texto sem negrito | asteriscos escapados | use `*texto*` |
| Link sem card | link no meio da linha | deixe o link sozinho |
| Mensagem cortada | passou de 4096 | reduza título/descrição |
| Emoji quebrado | encoding | salve o arquivo em UTF-8 |
