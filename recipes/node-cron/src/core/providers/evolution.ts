import type {
  SendErrorCode,
  SendMediaInput,
  SendResult,
  SendTextInput,
  WhatsAppProvider,
} from "../types";

export type EvolutionOptions = {
  url: string;
  apiKey: string;
  instance: string;
  timeoutMs?: number;
};

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function codeForStatus(status: number): SendErrorCode {
  if (status === 401 || status === 403) return "AUTH";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  if (status >= 400 && status < 500) return "INVALID";
  return "PROVIDER";
}

function providerMessage(raw: unknown): string {
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const candidates = [record.message, record.error, record.response];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim().slice(0, 300);
      }
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        if (typeof nested.message === "string" && nested.message.trim()) {
          return nested.message.trim().slice(0, 300);
        }
      }
    }
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 300);
  return "sem detalhes";
}

/**
 * Provider da Evolution API (WhatsApp não-oficial).
 *
 * Endpoints usados:
 * - POST /message/sendText/{instance}
 * - POST /message/sendMedia/{instance}
 *
 * A chave vai apenas no header `apikey` e nunca é registrada em log.
 */
export class EvolutionProvider implements WhatsAppProvider {
  readonly name = "evolution";
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: EvolutionOptions) {
    this.baseUrl = options.url.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  sendText(input: SendTextInput): Promise<SendResult> {
    return this.post(
      `/message/sendText/${encodeURIComponent(this.options.instance)}`,
      {
        number: input.to,
        text: input.text,
        linkPreview: input.linkPreview ?? true,
      },
    );
  }

  sendMedia(input: SendMediaInput): Promise<SendResult> {
    return this.post(
      `/message/sendMedia/${encodeURIComponent(this.options.instance)}`,
      {
        number: input.to,
        mediatype: input.type ?? "image",
        media: input.mediaUrl,
        caption: input.caption ?? "",
      },
    );
  }

  private async post(
    path: string,
    body: Record<string, unknown>,
  ): Promise<SendResult> {
    if (!this.baseUrl || !this.options.apiKey || !this.options.instance) {
      return {
        ok: false,
        provider: this.name,
        code: "CONFIG",
        error: "Evolution API não configurada.",
        retryable: false,
      };
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.options.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "erro de rede";
      return {
        ok: false,
        provider: this.name,
        code: "NETWORK",
        error: `Falha de rede ao chamar a Evolution: ${message}`,
        retryable: true,
      };
    }

    const text = await response.text().catch(() => "");
    const raw = parseJson(text);

    if (!response.ok) {
      const code = codeForStatus(response.status);
      return {
        ok: false,
        provider: this.name,
        status: response.status,
        code,
        error: `Evolution respondeu HTTP ${response.status}: ${providerMessage(raw)}`,
        retryable: code === "RATE_LIMIT" || code === "PROVIDER",
      };
    }

    return { ok: true, provider: this.name, raw };
  }
}
