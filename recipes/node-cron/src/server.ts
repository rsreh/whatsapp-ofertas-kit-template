import "./env";
import { timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { createApp } from "./app";
import { runDaily } from "./core/daily";
import { renderPreviewHtml } from "./core/links/preview";
import { verifyLink } from "./core/links/signed";
import { dealLinkFor, sendProduct } from "./core/pipeline";
import { fetchProductFromUrl } from "./core/sources/opengraph";
import type { Product } from "./core/types";

const app = createApp();
const { config, logger } = app;

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body, null, 2));
}

function text(
  res: ServerResponse,
  status: number,
  body: string,
  contentType = "text/plain; charset=utf-8",
): void {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(body);
}

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a, "utf8");
  const second = Buffer.from(b, "utf8");
  if (first.length !== second.length) return false;
  return timingSafeEqual(first, second);
}

function authorized(req: IncomingMessage, secret: string | null): boolean {
  if (!secret) return false;
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return Boolean(token) && safeEqual(token, secret);
}

async function readBody(req: IncomingMessage, maxBytes = 64 * 1024): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > maxBytes) throw new Error("Corpo da requisição muito grande.");
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function maskTarget(value: string): string {
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${(user ?? "").slice(0, 4)}…@${domain ?? ""}`;
  }
  return value.length > 6 ? `${value.slice(0, 4)}…${value.slice(-4)}` : "***";
}

function page(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>whatsapp-ofertas-kit</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 20px; color: #0f172a; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
      li { margin: 8px 0; }
    </style>
  </head>
  <body>
    <h1>whatsapp-ofertas-kit</h1>
    <p>Servidor no ar. Fonte de produtos: <code>${app.source.name}</code>.</p>
    <ul>
      <li><a href="/health">/health</a> — diagnóstico</li>
      <li><code>GET /o/:token</code> — preview com metatags</li>
      <li><code>GET /cron</code> — executa o ciclo (Bearer CRON_SECRET)</li>
      <li><code>POST /send</code> — envia agora (Bearer ADMIN_TOKEN)</li>
    </ul>
  </body>
</html>`;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${config.port}`);

    if (req.method === "GET" && url.pathname === "/") {
      return text(res, 200, page(), "text/html; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        source: app.source.name,
        target: maskTarget(config.target),
        timezone: config.timezone,
        sendHour: config.sendHour,
        publicBaseUrl: config.publicBaseUrl ? "configurada" : "ausente",
        linkSecret: config.linkSecret ? "configurado" : "ausente",
      });
    }

    if (req.method === "GET" && url.pathname.startsWith("/o/")) {
      const token = decodeURIComponent(url.pathname.slice(3));
      if (!config.linkSecret) {
        return text(res, 404, "Preview não configurado (falta LINK_SECRET).");
      }

      const payload = verifyLink(token, config.linkSecret);
      if (!payload) {
        return text(res, 404, "Link inválido ou expirado.");
      }

      const publicUrl = `${config.publicBaseUrl ?? url.origin}/o/${token}`;
      return text(
        res,
        200,
        renderPreviewHtml(payload, { publicUrl }),
        "text/html; charset=utf-8",
      );
    }

    if (req.method === "GET" && url.pathname === "/cron") {
      if (!authorized(req, config.cronSecret)) {
        return json(res, 401, { error: "Não autorizado." });
      }

      const result = await runDaily({
        source: app.source,
        pipeline: {
          provider: app.provider,
          target: config.target,
          publicBaseUrl: config.publicBaseUrl,
          linkSecret: config.linkSecret,
          logger,
        },
        storage: app.storage,
        timezone: config.timezone,
        sendHour: config.sendHour,
        gapMs: config.sendGapMs,
        logger,
      });

      return json(res, result.ok ? 200 : 502, result);
    }

    if (req.method === "POST" && url.pathname === "/send") {
      if (!authorized(req, config.adminToken)) {
        return json(res, 401, { error: "Não autorizado." });
      }

      const raw = await readBody(req);
      let body: { url?: string; product?: Product } = {};
      try {
        body = JSON.parse(raw || "{}") as typeof body;
      } catch {
        return json(res, 400, { error: "JSON inválido." });
      }

      let product: Product;
      if (body.url) {
        product = await fetchProductFromUrl(body.url);
      } else if (body.product?.title && body.product?.url) {
        product = body.product;
      } else {
        return json(res, 400, { error: "Informe { url } ou { product }." });
      }

      const result = await sendProduct(product, {
        provider: app.provider,
        target: config.target,
        publicBaseUrl: config.publicBaseUrl,
        linkSecret: config.linkSecret,
        logger,
      });

      return json(res, result.ok ? 200 : 502, {
        ...result,
        link: dealLinkFor(product, {
          publicBaseUrl: config.publicBaseUrl,
          linkSecret: config.linkSecret,
        }),
      });
    }

    return text(res, 404, "Não encontrado.");
  } catch (error) {
    logger.error("Erro na requisição.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return json(res, 500, { error: "Erro interno." });
  }
});

let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;

  try {
    const result = await runDaily({
      source: app.source,
      pipeline: {
        provider: app.provider,
        target: config.target,
        publicBaseUrl: config.publicBaseUrl,
        linkSecret: config.linkSecret,
        logger,
      },
      storage: app.storage,
      timezone: config.timezone,
      sendHour: config.sendHour,
      gapMs: config.sendGapMs,
      logger,
    });

    if (!result.skipped) {
      logger.info("Ciclo diário concluído.", {
        sent: result.sent,
        ok: result.ok,
        message: result.message,
      });
    }
  } catch (error) {
    logger.error("Falha no ciclo diário.", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    running = false;
  }
}

server.listen(config.port, () => {
  logger.info("Servidor no ar.", {
    port: config.port,
    timezone: config.timezone,
    sendHour: config.sendHour,
    source: app.source.name,
  });
  console.log(`http://localhost:${config.port}`);
});

const firstTick = setTimeout(() => void tick(), 10_000);
const interval = setInterval(() => void tick(), 60_000);

function shutdown(): void {
  clearTimeout(firstTick);
  clearInterval(interval);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
