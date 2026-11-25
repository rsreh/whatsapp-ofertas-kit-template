import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Storage } from "../types";

type Entry = { value: string; expiresAt: number | null };
type Data = Record<string, Entry>;

/**
 * Armazenamento em arquivo JSON, para uma única instância (VPS, Docker).
 *
 * A escrita é serializada dentro do processo e feita em arquivo temporário +
 * rename. Para múltiplos processos/instâncias, use Redis ou banco.
 */
export class FileStorage implements Storage {
  private readonly file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(file: string) {
    this.file = resolve(file);
  }

  claim(key: string, ttlMs: number): Promise<boolean> {
    return this.locked(async () => {
      const data = await this.read();
      this.sweep(data);
      if (data[key]) return false;
      data[key] = { value: new Date().toISOString(), expiresAt: Date.now() + ttlMs };
      await this.write(data);
      return true;
    });
  }

  get(key: string): Promise<string | null> {
    return this.locked(async () => {
      const data = await this.read();
      this.sweep(data);
      return data[key]?.value ?? null;
    });
  }

  set(key: string, value: string, ttlMs?: number): Promise<void> {
    return this.locked(async () => {
      const data = await this.read();
      this.sweep(data);
      data[key] = {
        value,
        expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
      };
      await this.write(data);
    });
  }

  delete(key: string): Promise<void> {
    return this.locked(async () => {
      const data = await this.read();
      delete data[key];
      await this.write(data);
    });
  }

  private locked<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async read(): Promise<Data> {
    try {
      const raw = await readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Data) : {};
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw error;
    }
  }

  private async write(data: Data): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    const temporary = `${this.file}.tmp`;
    await writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
    await rename(temporary, this.file);
  }

  private sweep(data: Data): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(data)) {
      if (entry.expiresAt != null && entry.expiresAt <= now) {
        delete data[key];
      }
    }
  }
}
