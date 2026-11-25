import { describe, expect, it } from "vitest";
import {
  bold,
  clampMessage,
  formatBRL,
  renderTemplate,
  truncate,
} from "../src/message/template";

describe("renderTemplate", () => {
  it("substitui placeholders e ignora chaves ausentes", () => {
    const text = renderTemplate("Oi {{nome}}, oferta: {{preco}} {{ausente}}", {
      nome: "Ana",
      preco: 10,
    });
    expect(text).toBe("Oi Ana, oferta: 10 ");
  });

  it("aceita espaços dentro das chaves", () => {
    expect(renderTemplate("{{ titulo }}", { titulo: "X" })).toBe("X");
  });
});

describe("formatação", () => {
  it("formata em BRL", () => {
    expect(formatBRL(1234.5)).toContain("1.234,50");
  });

  it("aplica negrito do WhatsApp", () => {
    expect(bold("oi")).toBe("*oi*");
  });

  it("trunca texto longo", () => {
    const value = truncate("a".repeat(50), 10);
    expect(value.length).toBeLessThanOrEqual(10);
    expect(value.endsWith("…")).toBe(true);
  });

  it("respeita o limite de mensagem", () => {
    expect(clampMessage("x".repeat(5000)).length).toBe(4096);
  });
});
