# 03 · Alternativas de provedor

O kit nasceu com a Evolution API porque ela é open-source e roda na sua
infraestrutura. Mas o núcleo usa uma interface (`WhatsAppProvider`), então
trocar de provedor é implementar um arquivo.

## Comparativo

| Provedor | Oficial? | Custo | Esforço | Risco de ban | Ideal para |
|---|---|---|---|---|---|
| Evolution API | Não | VPS | Médio | Médio | quem quer controle e custo baixo |
| Meta Cloud API | Sim | por conversa | Alto (aprovação) | Baixo | empresas e volume |
| Z-API | Não | assinatura | Baixo | Médio | quem quer suporte pronto |
| Baileys direto | Não | VPS | Alto | Médio | quem quer customizar tudo |

> Custos mudam. Consulte a tabela atual de cada provedor antes de decidir.

## Evolution API (padrão do kit)

**Prós:** open-source, roda onde você quiser, sem taxa por mensagem, controle
total dos dados.
**Contras:** você mantém o servidor, conexão cai e precisa reler QR, risco de
ban por ser não-oficial.

Use quando: você tem VPS, quer custo previsível e não vai disparar em massa.

## Meta Cloud API (oficial)

**Prós:** oficial, estável, sem risco de ban por uso indevido, suporte a
templates aprovados.
**Contras:** exige conta comercial, verificação, número dedicado, aprovação de
templates e cobrança por conversa. A janela de 24h limita mensagens
espontâneas.

Use quando: é uma operação comercial, precisa de garantia e volume.

Diferenças práticas:

- mensagens fora da janela de 24h exigem template aprovado;
- o formato de envio é outro (`/{phone-number-id}/messages`);
- o preview de link é configurado no payload, não pelo `linkPreview`.

## Z-API e similares

**Prós:** configuração rápida, painel pronto, suporte.
**Contras:** assinatura mensal, dependência de terceiro, dados fora da sua
infraestrutura.

Use quando: você não quer manter servidor e aceita pagar por isso.

## Baileys direto

**Prós:** controle total, sem intermediário.
**Contras:** você implementa reconexão, QR, filas e tratamento de erros. É o
que a Evolution já faz por você.

Use quando: precisa de algo muito específico que a Evolution não cobre.

## Como trocar no kit

1. Crie `providers/meu-provedor.ts` implementando:

```ts
import type { SendResult, WhatsAppProvider } from "../types";

export class MeuProvider implements WhatsAppProvider {
  readonly name = "meu-provedor";

  async sendText(input: { to: string; text: string }): Promise<SendResult> {
    // chame a API do provedor
    return { ok: true, provider: this.name };
  }
}
```

2. Troque a instância em `src/app.ts` (node-cron) ou em `lib/` (Next).
3. Mantenha o mesmo `SendResult` para o resto do kit continuar funcionando.

## Recomendação

- Começando agora: Evolution + chip dedicado.
- Operação comercial: Meta Cloud API.
- Sem tempo para infra: Z-API.
