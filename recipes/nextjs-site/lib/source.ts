import type { AppConfig } from "@/src/core/config";
import { ManualSource } from "@/src/core/sources/manual";
import { OpenGraphSource } from "@/src/core/sources/opengraph";
import { ShopeeSource } from "@/src/core/sources/shopee";
import type { ProductSource } from "@/src/core/types";

/** Mesma prioridade da receita node-cron: Shopee > JSON > URLs. */
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
