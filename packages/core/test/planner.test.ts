import { describe, expect, it } from "vitest";
import { dayKey, slotKey, timeParts } from "../src/schedule/planner";

describe("planner", () => {
  it("calcula a hora no fuso de São Paulo", () => {
    const parts = timeParts(
      new Date("2026-01-01T12:00:00Z"),
      "America/Sao_Paulo",
    );
    expect(parts.date).toBe("2026-01-01");
    expect(parts.hour).toBe(9);
  });

  it("monta chave diária", () => {
    expect(
      dayKey("daily", new Date("2026-01-01T12:00:00Z"), "America/Sao_Paulo"),
    ).toBe("daily:2026-01-01");
  });

  it("monta chave de janela de 30 minutos", () => {
    expect(
      slotKey("tick", new Date("2026-01-01T12:40:00Z"), "America/Sao_Paulo"),
    ).toBe("tick:2026-01-01T09:30");
  });
});
