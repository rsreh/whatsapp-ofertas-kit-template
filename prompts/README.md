# Prompts para IA

Prompts prontos para colar em um agente de código (Claude Code, Codex, Cursor,
Copilot, OpenCode...). Cada um é autocontido: descreve o objetivo, o contexto,
as restrições e o critério de pronto.

| Prompt | Quando usar |
|---|---|
| [`00-montar-do-zero.md`](00-montar-do-zero.md) | começar uma automação nova |
| [`01-adaptar-provedor.md`](01-adaptar-provedor.md) | trocar Evolution por Meta/Z-API |
| [`02-revisar-seguranca.md`](02-revisar-seguranca.md) | auditar um projeto existente |
| [`03-criar-mensagens.md`](03-criar-mensagens.md) | escrever/ajustar textos de oferta |
| [`04-depurar-envio.md`](04-depurar-envio.md) | mensagem não chega ou dá erro |

## Como usar

1. Abra o repositório no agente.
2. Cole o prompt inteiro (não só o começo).
3. Deixe o agente ler `AGENTS.md` e `llms.txt` antes de editar.
4. Peça um plano antes de mudanças grandes.
5. Revise o diff e rode `npm run check`.

## Regras que valem para qualquer prompt

- Nunca cole credenciais reais no chat; use placeholders.
- O agente não deve criar `.env` com segredos nem commitar `.env`.
- Toda mudança precisa passar em `npm run check`.
- Se o agente sugerir scraping de grupos, lista de números ou DM em massa,
  recuse: está fora do escopo do kit.
