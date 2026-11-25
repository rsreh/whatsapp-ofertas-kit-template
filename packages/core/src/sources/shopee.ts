import { createHash } from "node:crypto";
import type { Product, ProductSource } from "../types";

/**
 * Fonte de ofertas da API de afiliados da Shopee (GraphQL `productOfferV2`).
 *
 * Requer aprovação no programa de afiliados e as credenciais
 * `SHOPEE_APP_ID` / `SHOPEE_SECRET`. Se não estiver configurada, use a fonte
 * manual ou Open Graph.
 */

const API_URL = "https://open-api.affiliate.shopee.com.br/graphql";

const OFFERS_QUERY = `
  query productOfferV2($keyword: String, $limit: Int, $page: Int) {
    productOfferV2(keyword: $keyword, limit: $limit, page: $page) {
      nodes {
        itemId
        shopId
        productName
        productLink
        offerLink
        imageUrl
        price
        priceMin
        priceMax
        priceDiscountRate
        ratingStar
        sales
        shopName
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
`;

export type ShopeeSourceOptions = {
  appId: string;
  secret: string;
  keywords: string[];
  minDiscount?: number;
  limit?: number;
  timeoutMs?: number;
};

export function shopeeAuthHeader(
  appId: string,
  secret: string,
  payload: string,
  timestamp: number,
): string {
  const signature = createHash("sha256")
    .update(`${appId}${timestamp}${payload}${secret}`)
    .digest("hex");
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;
}

function toMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return 0;
  if (cleaned.includes(",")) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(cleaned) || 0;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function normalizeShopeeNode(node: Record<string, unknown>): Product | null {
  const id = toText(node.itemId) || toText(node.shopId);
  const title = toText(node.productName);
  const url = toText(node.offerLink) || toText(node.productLink);
  const price = toMoney(node.price) || toMoney(node.priceMin);

  if (!id || !title || !url || price <= 0) return null;

  const discountRate = Math.max(
    0,
    Math.min(99, Math.round(toMoney(node.priceDiscountRate))),
  );
  const originalPrice =
    discountRate > 0
      ? Math.round((price / (1 - discountRate / 100)) * 100) / 100
      : null;

  return {
    id,
    title,
    url,
    price,
    originalPrice,
    discountRate,
    imageUrl: toText(node.imageUrl) || null,
    shopName: toText(node.shopName) || undefined,
    note: null,
  };
}

function score(product: Product): number {
  return (
    (product.discountRate ?? 0) * 0.9 +
    Math.log10((product.price ?? 1) + 1)
  );
}

export class ShopeeSource implements ProductSource {
  readonly name = "shopee";
  private readonly timeoutMs: number;

  constructor(private readonly options: ShopeeSourceOptions) {
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async list(options: { limit?: number } = {}): Promise<Product[]> {
    const keywords =
      this.options.keywords.length > 0 ? this.options.keywords : ["oferta"];
    const limit = options.limit ?? this.options.limit ?? 10;

    const settled = await Promise.allSettled(
      keywords.map((keyword) => this.search(keyword, limit)),
    );

    const products = settled.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    const seen = new Set<string>();
    const unique: Product[] = [];
    for (const product of products) {
      const key = product.id ?? product.url;
      if (seen.has(key)) continue;
      seen.add(key);
      if ((product.discountRate ?? 0) < (this.options.minDiscount ?? 0)) continue;
      unique.push(product);
    }

    return unique.sort((a, b) => score(b) - score(a)).slice(0, limit);
  }

  private async search(keyword: string, limit: number): Promise<Product[]> {
    const payload = JSON.stringify({
      query: OFFERS_QUERY,
      variables: { keyword, limit, page: 1 },
    });

    const nodes = await this.request(payload).catch(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.request(payload);
    });

    return nodes
      .map((node) => normalizeShopeeNode(node))
      .filter((product): product is Product => product !== null);
  }

  private async request(payload: string): Promise<Record<string, unknown>[]> {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: shopeeAuthHeader(
          this.options.appId,
          this.options.secret,
          payload,
          timestamp,
        ),
      },
      body: payload,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Shopee respondeu HTTP ${response.status}.`);
    }

    const json = (await response.json()) as {
      data?: { productOfferV2?: { nodes?: Record<string, unknown>[] } };
      errors?: Array<{ message?: string }>;
    };

    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message ?? "Erro GraphQL da Shopee.");
    }

    const nodes = json.data?.productOfferV2?.nodes;
    return Array.isArray(nodes) ? nodes : [];
  }
}
