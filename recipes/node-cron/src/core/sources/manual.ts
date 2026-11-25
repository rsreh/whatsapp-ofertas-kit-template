import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Product, ProductSource } from "../types";

function parseMoney(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Valida e normaliza um produto vindo de JSON/planilha. */
export function normalizeProduct(input: unknown): Product | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!title || !url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    title,
    url,
    price: parseMoney(raw.price),
    originalPrice: parseMoney(raw.originalPrice),
    discountRate:
      typeof raw.discountRate === "number" && raw.discountRate > 0
        ? Math.round(raw.discountRate)
        : undefined,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    shopName: typeof raw.shopName === "string" ? raw.shopName : undefined,
    note: typeof raw.note === "string" ? raw.note : null,
  };
}

/**
 * Fonte mais simples: um arquivo JSON com a lista de produtos.
 *
 * Formato aceito:
 *   [{ "title": "...", "url": "https://...", "price": 99.9 }]
 * ou
 *   { "products": [ ... ] }
 */
export class ManualSource implements ProductSource {
  readonly name = "manual";

  constructor(private readonly file: string) {}

  async list(options: { limit?: number } = {}): Promise<Product[]> {
    const raw = await readFile(resolve(this.file), "utf8");
    const data = JSON.parse(raw) as unknown;

    let items: unknown[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { products?: unknown }).products)
    ) {
      items = (data as { products: unknown[] }).products;
    }

    const products = items
      .map(normalizeProduct)
      .filter((product): product is Product => product !== null);

    return options.limit ? products.slice(0, options.limit) : products;
  }
}
