import { lookup } from "node:dns/promises";
import type { Product, ProductSource } from "../types";

/**
 * Leitura de dados de produto a partir de uma URL (Open Graph / JSON-LD).
 *
 * Inclui proteção contra SSRF: só http/https, sem credenciais na URL, sem
 * portas incomuns, sem hosts locais/privados e com limite de tamanho,
 * timeout e redirecionamentos.
 */

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

export type FetchHtmlOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
};

export type OpenGraphData = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
};

/** Detecta endereços IPv4/IPv6 privados, de loopback ou reservados. */
export function isPrivateAddress(address: string): boolean {
  const value = address.trim().toLowerCase();
  if (!value) return true;

  if (value.includes(":")) {
    if (value === "::" || value === "::1") return true;
    if (value.startsWith("fe8") || value.startsWith("fe9")) return true;
    if (value.startsWith("fea") || value.startsWith("feb")) return true;
    if (value.startsWith("fc") || value.startsWith("fd")) return true;
    if (value.startsWith("ff")) return true;
    if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7));
    return false;
  }

  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Apenas http:// e https:// são permitidos.");
  }
  if (url.username || url.password) {
    throw new Error("URL com credenciais não é permitida.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Porta não permitida.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("Host local não é permitido.");
  }
  if (isPrivateAddress(host)) {
    throw new Error("Endereço privado não é permitido.");
  }

  const addresses = await lookup(host, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new Error("Host não resolvido.");
  }
  for (const item of addresses) {
    if (isPrivateAddress(item.address)) {
      throw new Error("O host resolve para um endereço privado.");
    }
  }

  return url;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Buffer[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(Buffer.from(value));
  }

  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

export async function fetchHtml(
  rawUrl: string,
  options: FetchHtmlOptions = {},
): Promise<{ html: string; finalUrl: string }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  let current = await assertPublicUrl(rawUrl);

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent":
          options.userAgent ??
          "Mozilla/5.0 (compatible; WhatsAppOfertasKit/1.0; +https://github.com/)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Redirecionamento sem destino (HTTP ${response.status}).`);
      }
      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`A página respondeu HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("O endereço não retornou HTML.");
    }

    return { html: await readLimited(response, maxBytes), finalUrl: current.toString() };
  }

  throw new Error("Muitos redirecionamentos.");
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeHtml(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    const named = ENTITIES[key];
    if (named) return named;
    try {
      if (key.startsWith("#x")) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    } catch {
      return match;
    }
    return match;
  });
}

function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1].trim());
    }
  }
  return null;
}

function parsePrice(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseOpenGraph(html: string, baseUrl: string): OpenGraphData {
  let title =
    metaContent(html, ["og:title", "twitter:title"]) ??
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ??
    null;
  let image = metaContent(html, [
    "og:image",
    "og:image:secure_url",
    "twitter:image",
    "twitter:image:src",
  ]);
  const description = metaContent(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);
  let price = parsePrice(
    metaContent(html, ["product:price:amount", "og:price:amount", "price"]),
  );

  if (!price || !title || !image) {
    const jsonLd = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (jsonLd?.[1]) {
      try {
        const parsed = JSON.parse(jsonLd[1]) as unknown;
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) {
          if (!node || typeof node !== "object") continue;
          const record = node as Record<string, unknown>;

          if (!price && record.offers && typeof record.offers === "object") {
            const offer = record.offers as Record<string, unknown>;
            if (typeof offer.price === "number" || typeof offer.price === "string") {
              price = parsePrice(String(offer.price));
            }
          }
          if (!title && typeof record.name === "string") {
            title = decodeHtml(record.name);
          }
          if (!image) {
            const imageValue = record.image;
            if (typeof imageValue === "string") image = imageValue;
            else if (Array.isArray(imageValue) && typeof imageValue[0] === "string") {
              image = imageValue[0];
            }
          }
        }
      } catch {
        // JSON-LD inválido: segue com o que já foi extraído.
      }
    }
  }

  if (title) title = title.replace(/\s+/g, " ").trim().slice(0, 200);
  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      image = null;
    }
  }

  return {
    title: title || null,
    description: description ? description.slice(0, 300) : null,
    imageUrl: image,
    price,
  };
}

export async function fetchProductFromUrl(url: string): Promise<Product> {
  const { html, finalUrl } = await fetchHtml(url);
  const data = parseOpenGraph(html, finalUrl);

  if (!data.title) {
    throw new Error("Não foi possível encontrar o título do produto na página.");
  }

  return {
    title: data.title,
    url: finalUrl,
    price: data.price,
    imageUrl: data.imageUrl,
    note: data.description ? data.description.slice(0, 140) : null,
  };
}

/** Fonte que transforma uma lista de URLs em produtos. */
export class OpenGraphSource implements ProductSource {
  readonly name = "opengraph";

  constructor(private readonly urls: string[]) {}

  async list(options: { limit?: number } = {}): Promise<Product[]> {
    const urls = options.limit ? this.urls.slice(0, options.limit) : this.urls;
    const products: Product[] = [];

    for (const url of urls) {
      try {
        products.push(await fetchProductFromUrl(url));
      } catch {
        // Uma URL quebrada não derruba a lista inteira.
      }
    }

    return products;
  }
}
