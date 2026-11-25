"use server";

import { loadConfig } from "@/src/core/config";
import { buildDealMessage } from "@/src/core/message/deal";
import { dealLinkFor, sendProduct } from "@/src/core/pipeline";
import { EvolutionProvider } from "@/src/core/providers/evolution";
import { fetchProductFromUrl } from "@/src/core/sources/opengraph";
import type { Product } from "@/src/core/types";

export type ActionState = {
  status: "idle" | "preview" | "sent" | "error";
  message?: string;
  link?: string;
  error?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function money(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function dealAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const intent = field(formData, "intent");

  try {
    const config = loadConfig(process.env, {
      requireProvider: intent === "send",
    });

    const url = field(formData, "url");
    if (!url) {
      return { status: "error", error: "Informe a URL do produto." };
    }

    let product: Product;
    try {
      product = await fetchProductFromUrl(url);
    } catch (error) {
      const title = field(formData, "title");
      if (!title) {
        const reason =
          error instanceof Error ? error.message : "erro desconhecido";
        return {
          status: "error",
          error: `Não consegui ler a página (${reason}). Preencha o título manualmente.`,
        };
      }
      product = { title, url };
    }

    const title = field(formData, "title");
    if (title) product.title = title;

    const price = money(field(formData, "price"));
    if (price != null) product.price = price;

    const original = money(field(formData, "originalPrice"));
    if (original != null) product.originalPrice = original;

    const image = field(formData, "imageUrl");
    if (image) product.imageUrl = image;

    const note = field(formData, "note");
    if (note) product.note = note;

    const shop = field(formData, "shopName");
    if (shop) product.shopName = shop;

    const link = dealLinkFor(product, {
      publicBaseUrl: config.publicBaseUrl,
      linkSecret: config.linkSecret,
    });
    const message = buildDealMessage(product, { link });

    if (intent === "preview") {
      return { status: "preview", message, link };
    }

    const provider = new EvolutionProvider(config.evolution);
    const result = await sendProduct(product, {
      provider,
      target: config.target,
      publicBaseUrl: config.publicBaseUrl,
      linkSecret: config.linkSecret,
    });

    if (!result.ok) {
      return { status: "error", error: result.error };
    }

    return { status: "sent", message, link };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}
