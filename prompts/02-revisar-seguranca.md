# Prompt · Revisar segurança

Use para auditar um projeto que envia mensagens no WhatsApp.

---

```text
Você é um revisor de segurança de aplicações. Audite este repositório e
produza um relatório acionável.

ESCOPO
- Segredos: .env, .env.example, histórico do git, logs, código.
- Endpoints HTTP: autenticação, rate limit, método, validação de entrada.
- Leitura de URLs externas: SSRF (protocolo, host, DNS, redirect, tamanho,
  timeout).
- Envio de mensagens: destino, idempotência, duplicidade, retry.
- Dependências: vulnerabilidades conhecidas e scripts de instalação.
- Conformidade: opt-in, LGPD, ausência de envio em massa.

MÉTODO
1. Liste os arquivos e rotas relevantes.
2. Para cada achado, informe: severidade (crítica/alta/média/baixa), arquivo e
   linha, cenário de abuso, impacto e correção sugerida (com código quando
   couber).
3. Separe "confirmado" de "suspeita".
4. Não altere arquivos ainda: só relate.
5. Se encontrar segredo real, não reproduza o valor; diga apenas onde está e
   recomende rotação.

CHECAGENS OBRIGATÓRIAS
- [ ] Nenhum segredo com prefixo NEXT_PUBLIC_.
- [ ] Cron e envio exigem Bearer e comparam com timingSafeEqual.
- [ ] Sem token na query string.
- [ ] SSRF bloqueia localhost, faixas privadas, portas incomuns e redirects
      para a rede interna.
- [ ] Limite de corpo e de resposta.
- [ ] Logs redigem chaves.
- [ ] .env fora do Git; .env.example só com placeholders.
- [ ] Dependências auditadas (npm audit) e scripts de instalação revisados.
- [ ] Nenhum caminho de envio em massa.

ENTREGÁVEL
Relatório em Markdown, com resumo executivo de até 5 linhas e uma lista de
correções ordenada por risco. No fim, proponha um patch mínimo para os itens
críticos e altos.
```
