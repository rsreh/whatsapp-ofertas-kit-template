import type { Product } from "../types";
import { bold, clampMessage, formatBRL, renderTemplate } from "./template";

export type DealMessageOptions = {
  /** Link que entra na mensagem. Padrão: `product.url`. */
  link?: string;
  /** Chamada final. */
  cta?: string;
  /**
   * Primeira linha da mensagem. Aceita `{{title}}`, `{{price}}` e
   * `{{discount}}`. Padrão: frase sorteada.
   */
  headline?: string;
  maxLength?: number;
};

type Phrases = {
  title: string;
  price: string;
  discount: string;
};

const HEADLINES: Array<(phrases: Phrases) => string> = [
  () => "🔥 Oferta do dia!",
  () => "🤯 Olha esse preço!",
  () => "🤑 Achado na internet!",
  () => "👀 Separamos isso pra você!",
];

const HEADLINES_DISCOUNT: Array<(phrases: Phrases) => string> = [
  (p) => `⚡ ${p.discount}% OFF!`,
  (p) => `🔴 ${p.discount}% de desconto!`,
];

const HEADLINES_NO_PRICE: Array<(phrases: Phrases) => string> = [
  () => "🔥 Olha essa oferta!",
  () => "🤯 Achado do dia!",
  () => "🤑 Preço bom!",
  () => "👀 Separamos isso pra você!",
];

const DEFAULT_CTA = "📲 Aproveita que é por tempo limitado!";

function pick<T>(items: T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  return item ?? (items[0] as T);
}

function discountOf(product: Product): number {
  if (product.discountRate != null && product.discountRate > 0) {
    return Math.round(product.discountRate);
  }
  if (
    product.price != null &&
    product.originalPrice != null &&
    product.originalPrice > product.price
  ) {
    return Math.round((1 - product.price / product.originalPrice) * 100);
  }
  return 0;
}

function headlineFor(phrases: Phrases, hasPrice: boolean, discount: number): string {
  if (!hasPrice) return pick(HEADLINES_NO_PRICE)(phrases);
  if (discount > 0) {
    return pick([...HEADLINES, ...HEADLINES_DISCOUNT])(phrases);
  }
  return pick(HEADLINES)(phrases);
}

/**
 * Monta a mensagem de uma oferta no estilo anúncio.
 *
 * Estrutura:
 *   [frase de impacto]
 *
 *   *Título*
 *   💸 preço / desconto
 *   🎟️ cupom
 *   🏪 loja
 *
 *   🛒 Link da oferta:
 *   https://...
 *
 *   [CTA]
 *
 * O link fica sozinho em uma linha para o WhatsApp montar o cartão de
 * preview. O texto respeita o limite de 4096 caracteres.
 */
export function buildDealMessage(
  product: Product,
  options: DealMessageOptions = {},
): string {
  const price =
    product.price != null && product.price > 0 ? formatBRL(product.price) : "";
  const original =
    product.originalPrice != null && product.originalPrice > 0
      ? formatBRL(product.originalPrice)
      : "";
  const discount = discountOf(product);
  const cleanTitle = product.title
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const phrases: Phrases = {
    title: bold(cleanTitle || "Oferta"),
    price: price ? bold(price) : "",
    discount: discount > 0 ? String(discount) : "10",
  };

  const headline = options.headline
    ? renderTemplate(options.headline, {
        title: cleanTitle,
        price,
        discount: discount > 0 ? String(discount) : "",
      })
    : headlineFor(phrases, Boolean(price), discount);

  const lines: string[] = [headline, "", bold(cleanTitle || "Oferta")];

  if (price && original && original !== price) {
    lines.push(
      discount > 0
        ? `💸 De ${original} por ${price} (${discount}% OFF)`
        : `💸 De ${original} por ${price}`,
    );
  } else if (price) {
    lines.push(discount > 0 ? `💸 ${price} · ${discount}% OFF` : `💸 ${price}`);
  }

  if (product.note) lines.push(`🎟️ ${product.note.trim()}`);
  if (product.shopName) lines.push(`🏪 ${product.shopName.trim()}`);

  const link = (options.link ?? product.url).trim();
  if (link) {
    lines.push("");
    lines.push("🛒 Link da oferta:");
    lines.push(link);
  }

  lines.push("");
  lines.push(options.cta ?? DEFAULT_CTA);

  return clampMessage(lines.join("\n"), options.maxLength);
}
