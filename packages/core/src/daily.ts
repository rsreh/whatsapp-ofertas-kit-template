import type { Logger } from "./logger";
import { sendProduct, type PipelineDeps } from "./pipeline";
import { dayKey, timeParts } from "./schedule/planner";
import type { Product, ProductSource, Storage } from "./types";

export type DailyOptions = {
  source: ProductSource;
  pipeline: PipelineDeps;
  storage: Storage;
  timezone: string;
  sendHour: number;
  gapMs: number;
  /** Quantas ofertas enviar no ciclo (padrão: 1). */
  count?: number;
  /** Ignora a janela de horário (útil para teste manual). */
  force?: boolean;
  logger?: Logger;
  now?: Date;
};

export type DailyResult = {
  ok: boolean;
  sent: number;
  skipped?: boolean;
  message?: string;
  results: Array<{ title: string; ok: boolean; error?: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000,
  );
}

/**
 * Envio diário idempotente:
 * 1. respeita a janela de horário;
 * 2. reserva o dia no storage (só um processo envia);
 * 3. escolhe produtos girando pelo catálogo;
 * 4. se todos falharem, libera o dia para nova tentativa.
 */
export async function runDaily(options: DailyOptions): Promise<DailyResult> {
  const now = options.now ?? new Date();
  const count = Math.max(1, options.count ?? 1);
  const { hour, date } = timeParts(now, options.timezone);

  if (!options.force && hour < options.sendHour) {
    return {
      ok: true,
      sent: 0,
      skipped: true,
      message: `Fora da janela: envios começam às ${options.sendHour}h (${options.timezone}).`,
      results: [],
    };
  }

  const key = dayKey("daily", now, options.timezone);
  const claimed = await options.storage.claim(key, 48 * 60 * 60 * 1000);
  if (!claimed) {
    return {
      ok: true,
      sent: 0,
      skipped: true,
      message: "O envio de hoje já foi feito.",
      results: [],
    };
  }

  let products: Product[] = [];
  try {
    products = await options.source.list({ limit: Math.max(count * 3, 6) });
  } catch (error) {
    await options.storage.delete(key);
    return {
      ok: false,
      sent: 0,
      message:
        error instanceof Error
          ? `Falha ao buscar produtos: ${error.message}`
          : "Falha ao buscar produtos.",
      results: [],
    };
  }

  if (products.length === 0) {
    await options.storage.delete(key);
    return {
      ok: false,
      sent: 0,
      message: "Nenhum produto disponível no momento.",
      results: [],
    };
  }

  const start = dayNumber(date) % products.length;
  const selected: Product[] = [];
  for (let index = 0; index < count && index < products.length; index += 1) {
    const product = products[(start + index) % products.length];
    if (product) selected.push(product);
  }

  const results: DailyResult["results"] = [];
  let sent = 0;

  for (let index = 0; index < selected.length; index += 1) {
    if (index > 0 && options.gapMs > 0) await sleep(options.gapMs);

    const product = selected[index];
    if (!product) continue;

    const result = await sendProduct(product, options.pipeline);
    if (result.ok) {
      sent += 1;
      results.push({ title: product.title, ok: true });
    } else {
      results.push({ title: product.title, ok: false, error: result.error });
      options.logger?.warn("Falha ao enviar oferta.", {
        title: product.title,
        code: result.code,
      });
    }
  }

  if (sent === 0) {
    await options.storage.delete(key);
    return {
      ok: false,
      sent: 0,
      message: "Nenhuma oferta foi enviada.",
      results,
    };
  }

  return { ok: true, sent, results };
}
