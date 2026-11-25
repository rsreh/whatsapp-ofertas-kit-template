import { describe, expect, it } from "vitest";
import { buildDealMessage } from "../src/message/deal";

describe("buildDealMessage", () => {
  it("monta a oferta com preço, desconto e link em linha própria", () => {
    const message = buildDealMessage(
      {
        title: "Fone Bluetooth",
        url: "https://example.com/fone",
        price: 99.9,
        originalPrice: 129.9,
        discountRate: 23,
        note: "Cupom FRETE10",
        shopName: "Loja Exemplo",
      },
      { headline: "🔥 Oferta", cta: "Compre agora" },
    );

    expect(message).toContain("*Fone Bluetooth*");
    expect(message).toContain("23% OFF");
    expect(message).toContain("Cupom FRETE10");
    expect(message).toContain("Loja Exemplo");
    expect(message).toContain("Compre agora");

    const lines = message.split("\n");
    expect(lines).toContain("https://example.com/fone");
  });

  it("funciona sem preço", () => {
    const message = buildDealMessage(
      { title: "Produto", url: "https://example.com/p" },
      { headline: "🔥 Olha isso" },
    );
    expect(message).toContain("*Produto*");
    expect(message).not.toContain("💸");
    expect(message).toContain("https://example.com/p");
  });

  it("usa o link informado em vez do link do produto", () => {
    const message = buildDealMessage(
      { title: "Produto", url: "https://example.com/p" },
      { headline: "X", link: "https://example.com/o/token" },
    );
    expect(message).toContain("https://example.com/o/token");
    expect(message).not.toContain("https://example.com/p");
  });

  it("respeita o limite máximo", () => {
    const message = buildDealMessage(
      { title: "X".repeat(6000), url: "https://example.com/p" },
      { headline: "X", maxLength: 120 },
    );
    expect(message.length).toBeLessThanOrEqual(120);
  });
});
