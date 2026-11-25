import { formatBRL } from "../message/template";
import type { LinkPayload } from "./signed";

export type PreviewOptions = {
  /** URL pública deste preview (para og:url). */
  publicUrl: string;
  siteName?: string;
  accent?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeImage(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Página de encaminhamento com metatags Open Graph.
 *
 * É isso que faz o WhatsApp montar o cartão com foto, título e preço. O
 * visitante é redirecionado para a oferta imediatamente.
 */
export function renderPreviewHtml(
  payload: LinkPayload,
  options: PreviewOptions,
): string {
  const title = payload.t || "Oferta";
  const price = payload.p != null ? formatBRL(payload.p) : "";
  const discount =
    payload.d != null && payload.d > 0 ? `${Math.round(payload.d)}% OFF` : "";
  const description =
    [price, discount].filter(Boolean).join(" · ") || "Oferta selecionada";
  const image = safeImage(payload.i);
  const target = escapeHtml(payload.u);
  const self = escapeHtml(options.publicUrl);
  const siteName = escapeHtml(options.siteName ?? "Ofertas");
  const accent = escapeHtml(options.accent ?? "#0f766e");
  const scriptTarget = JSON.stringify(payload.u).replace(/</g, "\\u003c");

  const imageTags = image
    ? `<meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="${escapeHtml(title)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="robots" content="noindex, nofollow">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${self}">
    ${imageTags}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta http-equiv="refresh" content="0;url=${target}">
    <style>
      :root { color-scheme: light dark; --accent: ${accent}; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
        background: #f8fafc; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; }
      .card { width: min(92vw, 360px); padding: 24px; text-align: center;
        background: #fff; border-radius: 20px; box-shadow: 0 18px 50px rgba(15, 23, 42, .12); }
      img { width: 100%; max-height: 220px; object-fit: contain; border-radius: 14px; background: #f1f5f9; }
      .title { margin: 16px 0 6px; font-size: 16px; font-weight: 700; line-height: 1.35; }
      .price { margin: 0; font-size: 22px; font-weight: 800; color: var(--accent); }
      .off { margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #64748b; }
      a { display: inline-block; margin-top: 18px; padding: 12px 22px; border-radius: 999px;
        background: var(--accent); color: #fff; text-decoration: none; font-weight: 700; }
      .hint { margin: 12px 0 0; font-size: 12px; color: #64748b; }
      @media (prefers-color-scheme: dark) {
        body { background: #0b1220; color: #e2e8f0; }
        .card { background: #111c2e; box-shadow: none; }
        img { background: #0b1220; }
      }
    </style>
  </head>
  <body>
    <main class="card">
      ${image ? `<img src="${escapeHtml(image)}" alt="">` : ""}
      <p class="title">${escapeHtml(title)}</p>
      ${price ? `<p class="price">${escapeHtml(price)}</p>` : ""}
      ${discount ? `<p class="off">${escapeHtml(discount)}</p>` : ""}
      <a href="${target}" rel="noopener noreferrer">Ver oferta</a>
      <p class="hint">Abrindo a oferta…</p>
    </main>
    <script>window.location.replace(${scriptTarget});</script>
  </body>
</html>`;
}
