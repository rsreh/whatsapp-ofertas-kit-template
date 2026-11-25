# Checklist · Go-live

Para quando sai do teste e vai para o grupo real.

## Conteúdo

- [ ] `products.json` revisado (sem produto vencido ou esgotado)
- [ ] Preços conferidos na página
- [ ] Cupons válidos
- [ ] Links de afiliado identificados
- [ ] Primeira linha testada
- [ ] Mensagem abaixo de 500 caracteres
- [ ] Revisão ortográfica feita

## Infraestrutura

- [ ] Evolution em HTTPS, com chave forte
- [ ] `connectionStatus` `open`
- [ ] Número dedicado, com perfil configurado
- [ ] Grupo de destino correto (`@g.us`)
- [ ] Aplicação com `restart` automático
- [ ] `TIMEZONE` correta
- [ ] `SEND_HOUR` definida
- [ ] `SEND_GAP_MS` >= 3000

## Preview

- [ ] `PUBLIC_BASE_URL` é HTTPS público
- [ ] `LINK_SECRET` configurado
- [ ] `/o/<token>` abre e mostra o cartão
- [ ] Imagem carrega no celular
- [ ] Token expira como esperado

## Agendamento

- [ ] Cron protegido com `CRON_SECRET`
- [ ] Testei o disparo manual
- [ ] Testei a trava diária (rodar duas vezes não duplica)
- [ ] Sei como forçar um envio (`--force`)
- [ ] Sei como pausar (parar serviço/cron)

## Monitoramento

- [ ] Healthcheck a cada 5 min
- [ ] Alerta se healthcheck falhar
- [ ] Alerta se a conexão cair
- [ ] Logs acessíveis
- [ ] Backup automático
- [ ] Teste de restauração feito

## Comunicação

- [ ] Grupo avisado sobre frequência e tipo de conteúdo
- [ ] Regras do grupo visíveis
- [ ] Canal de suporte/contato
- [ ] Política de saída
- [ ] Aviso de afiliado

## Pós-lançamento (primeira semana)

- [ ] Conferir entrega todos os dias
- [ ] Medir cliques
- [ ] Ajustar horário se necessário
- [ ] Remover produto que gerou reclamação
- [ ] Revisar logs de erro
- [ ] Confirmar que nenhum envio duplicou
