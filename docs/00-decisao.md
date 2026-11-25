# 00 · Decisão: qual caminho seguir

Antes de escrever código, responda quatro perguntas. Elas definem o caminho
mais curto para o seu caso.

## 1. Onde isso vai rodar?

| Situação | Caminho recomendado |
|---|---|
| VPS, Docker, máquina própria | `recipes/node-cron` |
| Quero uma tela para operar | `recipes/nextjs-site` |
| Vercel/Netlify (serverless) | `recipes/nextjs-site` + cron externo |
| Só quero testar rápido | `recipes/node-cron` |

## 2. Para onde a mensagem vai?

| Destino | Como configurar |
|---|---|
| Grupo de ofertas | `WHATSAPP_TARGET="120363...@g.us"` |
| Seu próprio número (teste) | `WHATSAPP_TARGET="5511999999999"` |
| Vários destinos | rode o pipeline uma vez por destino |

Grupo exige que o número da instância já esteja dentro dele.

## 3. De onde vêm os produtos?

| Fonte | Quando usar |
|---|---|
| Lista manual (JSON) | Você escolhe os produtos; funciona sempre |
| Open Graph (URL) | Cola o link e o kit extrai título/imagem/preço |
| Shopee afiliados | Você foi aprovado no programa e quer automatizar |

A fonte manual é a única que não depende de API externa. Comece por ela.

## 4. Com que frequência?

| Frequência | Como fazer |
|---|---|
| 1 vez por dia | agendador interno ou cron do sistema |
| Várias por dia | cron com `count` e intervalo entre mensagens |
| Sob demanda | `POST /send` ou o painel do Next.js |

## Recomendação para começar

1. `infra/docker-evolution` para subir a sua instância.
2. `recipes/node-cron` com `products.json`.
3. Só depois ative preview card, Shopee e agendamento.

Tempo estimado: 30–60 minutos na primeira vez, contando a leitura do QR code.

## O que você precisa ter em mãos

- Um número de WhatsApp dedicado (não use o principal).
- Uma VPS ou máquina com Docker (ou um serviço gerenciado de Evolution).
- Acesso ao grupo de destino (para pegar o JID).
- Chave da Evolution que você mesmo gerou.

## O que este kit não faz

- Não hospeda instância para você.
- Não empresta número, chave ou grupo.
- Não envia mensagem em massa para listas de números.
- Não burla bloqueio ou banimento.

Se o seu caso é disparo em massa, este não é o caminho: leia `docs/03` e
considere a API oficial da Meta.
