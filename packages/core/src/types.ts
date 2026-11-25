/** Tipos compartilhados pelo núcleo do kit. */

export type Product = {
  id?: string;
  title: string;
  url: string;
  price?: number | null;
  originalPrice?: number | null;
  /** Percentual inteiro de desconto (0 quando não há). */
  discountRate?: number;
  imageUrl?: string | null;
  shopName?: string;
  /** Cupom, frete, condição... */
  note?: string | null;
};

export type SendErrorCode =
  | "CONFIG"
  | "AUTH"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "NETWORK"
  | "INVALID"
  | "PROVIDER";

export type SendSuccess = {
  ok: true;
  provider: string;
  id?: string;
  raw?: unknown;
};

export type SendFailure = {
  ok: false;
  provider?: string;
  code: SendErrorCode;
  error: string;
  retryable: boolean;
  status?: number;
};

export type SendResult = SendSuccess | SendFailure;

export type SendTextInput = {
  /** Telefone em E.164 ou JID de grupo (ex.: 120363...@g.us). */
  to: string;
  text: string;
  linkPreview?: boolean;
};

export type SendMediaInput = {
  to: string;
  mediaUrl: string;
  caption?: string;
  type?: "image" | "video" | "document";
};

export interface WhatsAppProvider {
  readonly name: string;
  sendText(input: SendTextInput): Promise<SendResult>;
  sendMedia?(input: SendMediaInput): Promise<SendResult>;
}

export interface ProductSource {
  readonly name: string;
  list(options?: { limit?: number }): Promise<Product[]>;
}

export interface Storage {
  /** Reserva atômica de uma chave. Retorna false se já existir. */
  claim(key: string, ttlMs: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
