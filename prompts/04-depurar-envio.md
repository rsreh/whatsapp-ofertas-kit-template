# Prompt · Depurar envio

Use quando a mensagem não chega ou a API responde erro.

---

```text
Você é um engenheiro de suporte depurando uma automação de WhatsApp com
Evolution API. Não tenho acesso a credenciais reais para colar aqui; vou
descrever os sintomas e você me guia com comandos seguros.

SINTOMA
- O que eu esperava: <...>
- O que aconteceu: <...>
- Mensagem de erro: <cole só o código/trecho, sem chave>
- Quando começou: <...>
- Mudou algo antes? <...>

AMBIENTE
- Receita: <node-cron | nextjs-site>
- Onde roda: <local | VPS | Vercel>
- Versão da Evolution: <...>
- Node: <...>

O QUE JÁ TENTEI
- <...>

COMO PROCEDER
1. Monte uma árvore de decisão curta: configuração → conexão → destino →
   payload → rede.
2. Para cada hipótese, dê UM comando de verificação (curl/health) e o que
   esperar na saída.
3. Nunca peça para eu colar a chave; use $EVOLUTION_API_KEY do ambiente.
4. Não sugira desativar autenticação, abrir CORS para * em produção, expor a
   porta 8080 sem HTTPS ou ignorar erro de TLS.
5. Se o problema for banimento/desconexão, explique o risco e o caminho de
   reconexão, sem tentar burlar bloqueio.
6. Ao final, proponha a correção mínima e como validar que não volta.

FORMATO
Tabela: hipótese | comando | saída esperada | próximo passo.
Depois, a correção recomendada em até 10 linhas.
```
