/**
 * Leitura e validação das variáveis de ambiente.
 *
 * Regras:
 * - nada de segredo no código;
 * - erro único e explícito listando o que falta;
 * - `requireProvider: false` permite pré-visualizar mensagens sem configurar
 *   a Evolution API.
 */

export type EvolutionConfig = {
  url: string;
  apiKey: string;
  instance: string;
};

export type ShopeeConfig = {
  appId: string;
  secret: string;
  keywords: string[];
  minDiscount: number;
};

export type AppConfig = {
  evolution: EvolutionConfig;
  target: string;
  publicBaseUrl: string | null;
  linkSecret: string | null;
  timezone: string;
  sendHour: number;
  sendGapMs: number;
  cronSecret: string | null;
  adminToken: string | null;
  port: number;
  stateFile: string;
  productsFile: string | null;
  productUrls: string[];
  shopee: ShopeeConfig | null;
};

export class ConfigError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Configuração incompleta:\n- ${missing.join("\n- ")}`);
    this.name = "ConfigError";
    this.missing = missing;
  }
}

function read(env: NodeJS.ProcessEnv, key: string): string {
  return (env[key] ?? "").trim();
}

function readNumber(
  env: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = read(env, key);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return Math.round(value);
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: { requireProvider?: boolean } = {},
): AppConfig {
  const requireProvider = options.requireProvider ?? true;
  const missing: string[] = [];

  const evolution: EvolutionConfig = {
    url: read(env, "EVOLUTION_API_URL").replace(/\/+$/, ""),
    apiKey: read(env, "EVOLUTION_API_KEY"),
    instance: read(env, "EVOLUTION_INSTANCE"),
  };
  const target = read(env, "WHATSAPP_TARGET");

  if (requireProvider) {
    if (!evolution.url) missing.push("EVOLUTION_API_URL");
    if (!evolution.apiKey) missing.push("EVOLUTION_API_KEY");
    if (!evolution.instance) missing.push("EVOLUTION_INSTANCE");
    if (!target) missing.push("WHATSAPP_TARGET");
  }

  const publicBaseUrl = read(env, "PUBLIC_BASE_URL").replace(/\/+$/, "") || null;
  const linkSecret = read(env, "LINK_SECRET") || null;

  if (publicBaseUrl && !/^https?:\/\//i.test(publicBaseUrl)) {
    missing.push("PUBLIC_BASE_URL (precisa começar com http:// ou https://)");
  }
  if (publicBaseUrl && !linkSecret) {
    missing.push("LINK_SECRET (obrigatório quando PUBLIC_BASE_URL está definido)");
  }
  if (linkSecret && linkSecret.length < 16) {
    missing.push("LINK_SECRET (mínimo de 16 caracteres)");
  }

  const timezone = read(env, "TIMEZONE") || "America/Sao_Paulo";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  } catch {
    missing.push(`TIMEZONE (fuso inválido: ${timezone})`);
  }

  const shopeeAppId = read(env, "SHOPEE_APP_ID");
  const shopeeSecret = read(env, "SHOPEE_SECRET");
  if ((shopeeAppId && !shopeeSecret) || (!shopeeAppId && shopeeSecret)) {
    missing.push("SHOPEE_APP_ID e SHOPEE_SECRET (precisam estar juntos)");
  }

  if (missing.length > 0) throw new ConfigError(missing);

  const keywords = read(env, "SHOPEE_KEYWORDS")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    evolution,
    target,
    publicBaseUrl,
    linkSecret,
    timezone,
    sendHour: readNumber(env, "SEND_HOUR", 9, 0, 23),
    sendGapMs: readNumber(env, "SEND_GAP_MS", 4000, 0, 600_000),
    cronSecret: read(env, "CRON_SECRET") || null,
    adminToken: read(env, "ADMIN_TOKEN") || null,
    port: readNumber(env, "PORT", 3001, 1, 65_535),
    stateFile: read(env, "STATE_FILE") || ".data/state.json",
    productsFile: read(env, "PRODUCTS_FILE") || null,
    productUrls: read(env, "PRODUCT_URLS")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    shopee:
      shopeeAppId && shopeeSecret
        ? {
            appId: shopeeAppId,
            secret: shopeeSecret,
            keywords,
            minDiscount: readNumber(env, "SHOPEE_MIN_DISCOUNT", 10, 0, 99),
          }
        : null,
  };
}

export function isWhatsAppConfigured(config: AppConfig): boolean {
  return Boolean(
    config.evolution.url &&
      config.evolution.apiKey &&
      config.evolution.instance &&
      config.target,
  );
}
