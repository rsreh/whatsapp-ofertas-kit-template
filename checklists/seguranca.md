# Checklist · Segurança

Revise antes de colocar em produção e depois de qualquer mudança grande.

## Segredos

- [ ] `.env` está no `.gitignore`
- [ ] `.env.example` só tem placeholders
- [ ] Nenhum segredo com prefixo `NEXT_PUBLIC_`
- [ ] `EVOLUTION_API_KEY` tem 32+ caracteres aleatórios
- [ ] `LINK_SECRET` tem 16+ caracteres
- [ ] `CRON_SECRET` e `ADMIN_TOKEN` existem e são diferentes entre si
- [ ] Chaves guardadas em gerenciador de senhas
- [ ] Histórico do Git não contém segredo (`gitleaks detect`)
- [ ] Plano de rotação escrito

## Endpoints

- [ ] `/cron` e `/send` exigem `Authorization: Bearer`
- [ ] Comparação com `timingSafeEqual`
- [ ] Sem token na query string
- [ ] Sem segredo no `/health`
- [ ] Limite de corpo (64 KB) e de resposta
- [ ] 404 genérico para token inválido
- [ ] CORS restrito (não `*` em produção)

## SSRF

- [ ] Só `http`/`https`
- [ ] Sem credenciais na URL
- [ ] Portas 80/443 apenas
- [ ] `localhost` e `.localhost` bloqueados
- [ ] Faixas privadas IPv4/IPv6 bloqueadas
- [ ] DNS resolvido e checado
- [ ] Timeout de 8s
- [ ] Limite de 512 KB
- [ ] Máximo de 3 redirecionamentos, cada um revalidado

## Dados e pessoas

- [ ] Destino é grupo/número com opt-in
- [ ] Sem lista de números comprada
- [ ] Sem DM em massa
- [ ] Sem scraping de grupos
- [ ] Sem armazenar membros do grupo
- [ ] Aviso de afiliado quando aplicável
- [ ] Canal para pedir saída

## Operação

- [ ] HTTPS em produção
- [ ] Porta 8080 não exposta publicamente
- [ ] Firewall restrito à aplicação
- [ ] Backup de `postgres_data` e `evolution_instances`
- [ ] Healthcheck monitorado
- [ ] Logs sem segredos e com retenção curta
- [ ] Dependências auditadas (`npm audit`)
- [ ] Scripts de instalação revisados
- [ ] Número de reserva ou plano B

## Resposta a incidente

- [ ] Sei revogar a chave da Evolution
- [ ] Sei trocar o `LINK_SECRET` (invalida links antigos)
- [ ] Sei parar o container e o serviço
- [ ] Sei onde ficam os logs
- [ ] Sei como avisar o grupo se algo vazar
