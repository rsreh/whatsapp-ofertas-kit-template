# Prompt · Montar uma automação do zero

Use quando você quer que a IA crie a automação inteira a partir deste kit.

---

```text
Você é um engenheiro de software sênior. Vou montar uma automação que busca
ofertas de produtos e publica links em um grupo de WhatsApp que EU controlo.

CONTEXTO
- Repositório base: whatsapp-ofertas-kit (leia AGENTS.md, llms.txt e docs/).
- Meu ambiente: <SO>, Node <versão>, <Docker? sim/não>, <VPS/Vercel/local>.
- Meu caso: <nicho>, <1 oferta/dia | N ofertas/dia>, <grupo | número próprio>.
- Fonte de produtos desejada: <lista JSON | Open Graph | Shopee afiliados>.

OBJETIVO
Criar/adaptar a receita <node-cron | nextjs-site> para o meu caso, mantendo o
núcleo em packages/core como fonte da verdade.

RESTRIÇÕES
1. Não invente credenciais. Use apenas variáveis de ambiente com placeholders.
2. Não crie .env nem commite segredos.
3. Não implemente envio em massa, DM para números desconhecidos, scraping de
   grupos ou lista de contatos. O destino é um grupo/número meu, com opt-in.
4. Mantenha a proteção SSRF ao buscar URLs.
5. Endpoints de cron/envio exigem Authorization: Bearer com comparação em tempo
   constante.
6. Não adicione dependências novas sem justificar (uma linha por dependência).
7. Textos e comentários em português do Brasil; código em inglês quando for
   identificador.

ENTREGÁVEIS
1. Plano curto (5–10 linhas) antes de editar.
2. Arquivos alterados/criados.
3. Como rodar localmente (comandos exatos).
4. Como testar sem enviar mensagem real (preview/dry-run).
5. Riscos e o que ficou fora de escopo.

CRITÉRIO DE PRONTO
- `npm run check` passa (sync, typecheck, testes).
- `npm run preview -- --url https://example.com/produto` monta a mensagem sem
  enviar.
- `npm run send -- --url https://example.com/produto` envia para o destino
  configurado.
- Nenhum segredo no diff.

Comece lendo AGENTS.md, llms.txt, docs/00-decisao.md e a receita escolhida.
Depois apresente o plano e espere meu "ok".
```
