# 07 · Agendamento e idempotência

## O básico

- **Fuso**: `TIMEZONE` (padrão `America/Sao_Paulo`).
- **Janela**: só envia a partir de `SEND_HOUR` (padrão 9h).
- **Trava**: uma chave por dia no `Storage` impede envio duplicado.
- **Rodízio**: o produto do dia muda conforme a data.
- **Falha**: se todos os envios falharem, a chave é liberada para nova
  tentativa.

## Por que a trava importa

Se o processo reiniciar, o cron externo rodar junto ou você clicar duas vezes,
sem trava a mensagem sai duplicada. A operação `claim` é atômica:

```ts
const claimed = await storage.claim("daily:2026-11-22", 48 * 60 * 60 * 1000);
if (!claimed) return { skipped: true };
```

`MemoryStorage` funciona em processo único. `FileStorage` funciona em uma
instância (VPS/Docker). Para múltiplas instâncias, use Redis ou banco.

### Redis

```ts
import type { Storage } from "../types";

export class RedisStorage implements Storage {
  constructor(private readonly redis: { set: Function; get: Function; del: Function }) {}

  async claim(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(key, "1", "PX", ttlMs, "NX");
    return result === "OK";
  }

  async get(key: string): Promise<string | null> {
    return (await this.redis.get(key)) as string | null;
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs) await this.redis.set(key, value, "PX", ttlMs);
    else await this.redis.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

## Opções de agendamento

| Opção | Onde roda | Prós | Contras |
|---|---|---|---|
| Agendador interno | processo Node | simples, sem serviço extra | só com processo vivo |
| Cron do sistema | VPS | confiável | precisa de acesso ao servidor |
| GitHub Actions | GitHub | grátis, sem servidor | atraso de minutos, UTC |
| Vercel Cron | Vercel | integrado | plano e limites |
| Cloudflare Cron | Cloudflare | confiável | configuração extra |

### Agendador interno

Já vem na receita `node-cron`. Verifica a cada minuto:

```ts
setInterval(() => void tick(), 60_000);
```

Vantagem: não depende de serviço externo. Desvantagem: se o processo cair, o
envio espera a próxima subida.

### Cron do sistema (VPS)

```cron
0 9 * * * cd /opt/whatsapp-ofertas && npm run once >> /var/log/ofertas.log 2>&1
```

Use `npm run once` (respeita a janela e a trava). Para forçar, `-- --force`.

### GitHub Actions

```yaml
name: Oferta do dia
on:
  schedule:
    - cron: "0 12 * * *" # 9h de Brasília (UTC-3)
  workflow_dispatch:

jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Disparar
        env:
          SITE_URL: ${{ secrets.SITE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          curl -fsS "$SITE_URL/api/cron" \
            -H "Authorization: Bearer $CRON_SECRET"
```

Atenção: o cron do GitHub é UTC e pode atrasar em horários de pico. Use a
trava diária para não duplicar.

### Vercel Cron

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 12 * * *" }
  ]
}
```

A Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando a
variável existe no projeto.

## Retry

O kit tenta uma vez. Para retry com backoff, envolva o envio:

```ts
async function withRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
    }
  }
  throw last;
}
```

Só faça retry em erros `retryable` (`NETWORK`, `RATE_LIMIT`, `PROVIDER`).

## Múltiplas ofertas por dia

Use `count`:

```bash
npm run once -- --count 3
```

O kit adiciona `SEND_GAP_MS` entre elas. Não abaixe de 3 segundos.

## Fuso e horário de verão

O cálculo usa `Intl.DateTimeFormat` com o fuso informado, então horário de
verão é tratado pelo runtime. Não hardcode `UTC-3`.
