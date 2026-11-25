import type { Storage } from "../types";

type Entry = { value: string; expiresAt: number | null };

/**
 * Armazenamento em memória, para desenvolvimento e processos únicos.
 * Em serverless/múltiplas instâncias, troque por Redis ou banco (ver docs/07).
 */
export class MemoryStorage implements Storage {
  private readonly entries = new Map<string, Entry>();

  async claim(key: string, ttlMs: number): Promise<boolean> {
    this.sweep();
    if (this.entries.has(key)) return false;
    this.entries.set(key, {
      value: new Date().toISOString(),
      expiresAt: Date.now() + ttlMs,
    });
    return true;
  }

  async get(key: string): Promise<string | null> {
    this.sweep();
    return this.entries.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt != null && entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}
