import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Link de preview assinado (sem banco de dados).
 *
 * O token carrega os dados do produto e uma assinatura HMAC-SHA256. Assim a
 * página `/o/:token` consegue montar as metatags Open Graph sem consultar
 * banco, e ninguém consegue forjar um link com outro destino.
 */

export type LinkPayload = {
  /** URL de destino (produto). */
  u: string;
  /** Título exibido no card. */
  t: string;
  /** Imagem. */
  i?: string;
  /** Preço atual. */
  p?: number;
  /** Preço original. */
  o?: number;
  /** Desconto em %. */
  d?: number;
  /** Expiração em epoch ms. */
  e: number;
};

export type LinkInput = Omit<LinkPayload, "e">;

export const DEFAULT_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function signLink(
  input: LinkInput,
  secret: string,
  ttlMs = DEFAULT_LINK_TTL_MS,
): string {
  if (secret.length < 16) {
    throw new Error("LINK_SECRET precisa ter pelo menos 16 caracteres.");
  }
  if (!isHttpUrl(input.u)) {
    throw new Error("URL do produto inválida.");
  }

  const payload: LinkPayload = { ...input, e: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyLink(
  token: string,
  secret: string,
  now = Date.now(),
): LinkPayload | null {
  if (!token || !secret) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<LinkPayload>;

    if (!isHttpUrl(parsed.u)) return null;
    if (typeof parsed.t !== "string") return null;
    if (typeof parsed.e !== "number" || parsed.e < now) return null;

    return {
      u: parsed.u,
      t: parsed.t,
      i: typeof parsed.i === "string" ? parsed.i : undefined,
      p: typeof parsed.p === "number" ? parsed.p : undefined,
      o: typeof parsed.o === "number" ? parsed.o : undefined,
      d: typeof parsed.d === "number" ? parsed.d : undefined,
      e: parsed.e,
    };
  } catch {
    return null;
  }
}
