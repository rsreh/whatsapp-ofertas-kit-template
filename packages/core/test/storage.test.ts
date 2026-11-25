import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileStorage } from "../src/storage/file";
import { MemoryStorage } from "../src/storage/memory";

afterEach(() => {
  vi.useRealTimers();
});

describe("MemoryStorage", () => {
  it("reserva a chave apenas uma vez", async () => {
    const storage = new MemoryStorage();
    expect(await storage.claim("dia", 60_000)).toBe(true);
    expect(await storage.claim("dia", 60_000)).toBe(false);
  });

  it("libera a chave depois do TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const storage = new MemoryStorage();
    expect(await storage.claim("dia", 1_000)).toBe(true);

    vi.setSystemTime(new Date("2026-01-01T00:00:02Z"));
    expect(await storage.claim("dia", 1_000)).toBe(true);
  });

  it("remove a chave manualmente", async () => {
    const storage = new MemoryStorage();
    await storage.claim("dia", 60_000);
    await storage.delete("dia");
    expect(await storage.claim("dia", 60_000)).toBe(true);
  });
});

describe("FileStorage", () => {
  it("persiste e não duplica entre instâncias", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ofertas-"));
    const file = join(directory, "state.json");

    try {
      const first = new FileStorage(file);
      expect(await first.claim("dia", 60_000)).toBe(true);

      const second = new FileStorage(file);
      expect(await second.claim("dia", 60_000)).toBe(false);

      await second.delete("dia");
      expect(await first.claim("dia", 60_000)).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
