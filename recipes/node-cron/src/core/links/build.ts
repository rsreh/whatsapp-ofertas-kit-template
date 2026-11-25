import { truncate } from "../message/template";
import type { Product } from "../types";
import { signLink } from "./signed";

export type BuildPreviewUrlOptions = {
  publicBaseUrl: string;
  secret: string;
  ttlMs?: number;
};

/** Gera a URL pública `/o/:token` a partir dos dados do produto. */
export function buildPreviewUrl(
  product: Product,
  options: BuildPreviewUrlOptions,
): string {
  const token = signLink(
    {
      u: product.url,
      t: truncate(product.title, 110),
      i: product.imageUrl ?? undefined,
      p: product.price ?? undefined,
      o: product.originalPrice ?? undefined,
      d: product.discountRate ?? undefined,
    },
    options.secret,
    options.ttlMs,
  );

  return `${options.publicBaseUrl.replace(/\/+$/, "")}/o/${token}`;
}
