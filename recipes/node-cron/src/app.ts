import {
  isWhatsAppConfigured,
  loadConfig,
  type AppConfig,
} from "./core/config";
import { createLogger, type Logger } from "./core/logger";
import { EvolutionProvider } from "./core/providers/evolution";
import { ManualSource } from "./core/sources/manual";
import { OpenGraphSource } from "./core/sources/opengraph";
import { ShopeeSource } from "./core/sources/shopee";
import { FileStorage } from "./core/storage/file";
import type { ProductSource, WhatsAppProvider } from "./core/types";

export type App = {
  config: AppConfig;
  logger: Logger;
  provider: WhatsAppProvider;
  source: ProductSource;
  storage: FileStorage;
};

/**
 * Fonte de produtos por prioridade:
 * 1. Shopee (quando SHOPEE_* e SHOPEE_KEYWORDS estão definidos);
 * 2. arquivo JSON (PRODUCTS_FILE);
 * 3. lista de URLs (PRODUCT_URLS).
 */
export function createSource(config: AppConfig): ProductSource {
  if (config.shopee && config.shopee.keywords.length > 0) {
    return new ShopeeSource(config.shopee);
  }
  if (config.productsFile) {
    return new ManualSource(config.productsFile);
  }
  if (config.productUrls.length > 0) {
    return new OpenGraphSource(config.productUrls);
  }
  throw new Error(
    "Nenhuma fonte de produtos configurada. Defina SHOPEE_* + SHOPEE_KEYWORDS, PRODUCTS_FILE ou PRODUCT_URLS.",
  );
}

export function createApp(env: NodeJS.ProcessEnv = process.env): App {
  const config = loadConfig(env);

  if (!isWhatsAppConfigured(config)) {
    throw new Error(
      "Evolution API não configurada. Preencha EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE e WHATSAPP_TARGET no .env.",
    );
  }

  return {
    config,
    logger: createLogger("app"),
    provider: new EvolutionProvider(config.evolution),
    source: createSource(config),
    storage: new FileStorage(config.stateFile),
  };
}
