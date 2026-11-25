import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { loadConfig } from "@/src/core/config";
import { runDaily } from "@/src/core/daily";
import { EvolutionProvider } from "@/src/core/providers/evolution";
import { MemoryStorage } from "@/src/core/storage/memory";
import { createSource } from "@/lib/source";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a, "utf8");
  const second = Buffer.from(b, "utf8");
  if (first.length !== second.length) return false;
  return timingSafeEqual(first, second);
}

function authorized(request: Request, secret: string | null): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return Boolean(token) && safeEqual(token, secret);
}

/**
 * Em serverless, cada instância tem sua própria memória. Para deduplicação
 * real entre instâncias, troque `MemoryStorage` por Redis/banco (docs/07).
 */
const globalForStorage = globalThis as unknown as {
  __ofertasStorage?: MemoryStorage;
};

function storage(): MemoryStorage {
  globalForStorage.__ofertasStorage ??= new MemoryStorage();
  return globalForStorage.__ofertasStorage;
}

export async function GET(request: Request) {
  let config;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Configuração inválida.",
      },
      { status: 500 },
    );
  }

  if (!authorized(request, config.cronSecret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await runDaily({
    source: createSource(config),
    pipeline: {
      provider: new EvolutionProvider(config.evolution),
      target: config.target,
      publicBaseUrl: config.publicBaseUrl,
      linkSecret: config.linkSecret,
    },
    storage: storage(),
    timezone: config.timezone,
    sendHour: config.sendHour,
    gapMs: config.sendGapMs,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
