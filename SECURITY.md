# Política de segurança

## Versões suportadas

O projeto está em `0.x`. Correções de segurança são aplicadas na branch `main`.

## Como reportar

**Não abra issue pública.** Use o recurso *Report a vulnerability* do GitHub
(Security → Advisories) ou envie um e-mail para o mantenedor listado no perfil
do repositório.

Inclua:

- descrição do problema e impacto;
- passos para reproduzir;
- versão/commit afetado;
- sugestão de correção, se tiver;
- como você quer ser creditado (ou se prefere anonimato).

Não inclua segredos reais, dados de terceiros ou provas de conceito que
exponham alguém. Se precisar demonstrar, use um ambiente seu com dados falsos.

## Prazo

Resposta inicial em até 7 dias. Correções críticas têm prioridade. Não há
programa de recompensa.

## Escopo

Fazem parte do escopo:

- vazamento de segredo em código, log ou exemplo;
- bypass de autenticação em `/cron`, `/send` ou `/api/cron`;
- SSRF na leitura de URL de produto;
- injeção de HTML/JS no preview card;
- path traversal, execução de código, dependência maliciosa;
- falha que permita envio para destino não autorizado.

Fora do escopo:

- risco de banimento por usar integração não-oficial (documentado);
- limitações do WhatsApp ou da Evolution;
- engenharia social;
- ataques que exigem acesso físico ao servidor;
- configuração insegura feita pelo usuário (ex.: expor a porta 8080).

## Boas práticas para quem usa o kit

- Nunca commite `.env`.
- Use chaves aleatórias e distintas por ambiente.
- Mantenha a Evolution atrás de HTTPS e firewall.
- Rode `npm audit` e atualize dependências.
- Ative o gitleaks no seu fork (o workflow já vem no repositório).
