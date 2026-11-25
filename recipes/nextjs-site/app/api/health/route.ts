import { NextResponse } from "next/server";
import { loadConfig } from "@/src/core/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = loadConfig(process.env, { requireProvider: false });

    return NextResponse.json({
      ok: true,
      evolution: Boolean(
        config.evolution.url &&
          config.evolution.apiKey &&
          config.evolution.instance,
      ),
      target: Boolean(config.target),
      preview: Boolean(config.publicBaseUrl && config.linkSecret),
      timezone: config.timezone,
      sendHour: config.sendHour,
      source: config.shopee
        ? "shopee"
        : config.productsFile
          ? "manual"
          : config.productUrls.length > 0
            ? "opengraph"
            : "nenhuma",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Configuração inválida.",
      },
      { status: 500 },
    );
  }
}
