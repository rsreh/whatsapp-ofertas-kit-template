#!/usr/bin/env node
import "./env";
import { parseArgs } from "node:util";
import { createApp, createSource } from "./app";
import { loadConfig } from "./core/config";
import { runDaily } from "./core/daily";
import { createLogger } from "./core/logger";
import { buildDealMessage } from "./core/message/deal";
import { dealLinkFor, sendProduct } from "./core/pipeline";
import { EvolutionProvider } from "./core/providers/evolution";
import { fetchProductFromUrl } from "./core/sources/opengraph";
import type { Product } from "./core/types";

const USAGE = `
Uso: npm run <comando> -- [opções]

Comandos:
  preview   Monta a mensagem e mostra o link (não envia)
  send      Envia uma oferta agora
  once      Executa o ciclo diário uma vez (para cron externo)

Opções:
  --url <url>     Usa um produto específico (Open Graph)
  --count <n>     Quantas ofertas enviar no ciclo (padrão: 1)
  --force         Ignora a janela de horário (use com cuidado)
  --json          Saída em JSON (comando once)

Exemplos:
  npm run preview -- --url https://example.com/produto
  npm run send -- --url https://example.com/produto
  npm run once -- --force
`;

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      url: { type: "string" },
      count: { type: "string" },
      force: { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  const command = positionals[0] ?? "help";
  if (command === "help" || values.help) {
    console.log(USAGE);
    return;
  }

  const requireProvider = command === "send" || command === "once";
  const config = loadConfig(process.env, { requireProvider });
  const logger = createLogger("cli");

  const pickProduct = async (): Promise<Product> => {
    if (values.url) return fetchProductFromUrl(values.url);

    const source = createSource(config);
    const [first] = await source.list({ limit: 1 });
    if (!first) {
      throw new Error("Nenhum produto encontrado na fonte configurada.");
    }
    return first;
  };

  if (command === "preview") {
    const product = await pickProduct();
    const link = dealLinkFor(product, {
      publicBaseUrl: config.publicBaseUrl,
      linkSecret: config.linkSecret,
      logger,
    });

    console.log(buildDealMessage(product, { link }));
    console.log(`\n---\nLink usado: ${link}`);
    return;
  }

  if (command === "send") {
    const product = await pickProduct();
    const provider = new EvolutionProvider(config.evolution);
    const result = await sendProduct(product, {
      provider,
      target: config.target,
      publicBaseUrl: config.publicBaseUrl,
      linkSecret: config.linkSecret,
      logger,
    });

    if (!result.ok) {
      console.error(`Falha (${result.code}): ${result.error}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Enviado via ${result.provider}.`);
    return;
  }

  if (command === "once") {
    const app = createApp();
    const count = Number(values.count ?? "1");
    const result = await runDaily({
      source: app.source,
      pipeline: {
        provider: app.provider,
        target: app.config.target,
        publicBaseUrl: app.config.publicBaseUrl,
        linkSecret: app.config.linkSecret,
        logger: app.logger,
      },
      storage: app.storage,
      timezone: app.config.timezone,
      sendHour: app.config.sendHour,
      gapMs: app.config.sendGapMs,
      count: Number.isFinite(count) && count > 0 ? count : 1,
      force: values.force,
      logger: app.logger,
    });

    if (values.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(result.message ?? `${result.sent} oferta(s) enviada(s).`);
      for (const item of result.results) {
        console.log(`- ${item.ok ? "ok" : "falhou"}: ${item.title}${item.error ? ` (${item.error})` : ""}`);
      }
    }

    if (!result.ok) process.exitCode = 1;
    return;
  }

  console.error(`Comando desconhecido: ${command}`);
  console.log(USAGE);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
