import type { Logger } from "./logger";
import { buildPreviewUrl } from "./links/build";
import { buildDealMessage } from "./message/deal";
import type { Product, SendResult, WhatsAppProvider } from "./types";

export type LinkDeps = {
  publicBaseUrl?: string | null;
  linkSecret?: string | null;
  linkTtlMs?: number;
  logger?: Logger;
};

export type PipelineDeps = LinkDeps & {
  provider: WhatsAppProvider;
  target: string;
};

/**
 * Link que entra na mensagem:
 * - com `PUBLIC_BASE_URL` + `LINK_SECRET`, usa o preview assinado com OG tags;
 * - sem eles, usa o link direto do produto.
 */
export function dealLinkFor(product: Product, deps: LinkDeps): string {
  if (deps.publicBaseUrl && deps.linkSecret) {
    try {
      return buildPreviewUrl(product, {
        publicBaseUrl: deps.publicBaseUrl,
        secret: deps.linkSecret,
        ttlMs: deps.linkTtlMs,
      });
    } catch (error) {
      deps.logger?.warn("Falha ao gerar link de preview; usando link direto.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return product.url;
}

export async function sendProduct(
  product: Product,
  deps: PipelineDeps,
): Promise<SendResult> {
  const link = dealLinkFor(product, deps);
  const text = buildDealMessage(product, { link });

  return deps.provider.sendText({
    to: deps.target,
    text,
    linkPreview: true,
  });
}
