import { describe, expect, it } from "vitest";
import { signLink, verifyLink } from "../src/links/signed";

const SECRET = "segredo-de-teste-com-32-caracteres";
const PRODUCT = {
  u: "https://example.com/produto",
  t: "Produto de teste",
  p: 99.9,
  d: 20,
};

describe("links assinados", () => {
  it("assina e verifica", () => {
    const token = signLink(PRODUCT, SECRET);
    const payload = verifyLink(token, SECRET);

    expect(payload?.u).toBe(PRODUCT.u);
    expect(payload?.t).toBe(PRODUCT.t);
    expect(payload?.p).toBe(PRODUCT.p);
  });

  it("rejeita token adulterado", () => {
    const token = signLink(PRODUCT, SECRET);
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
    expect(verifyLink(tampered, SECRET)).toBeNull();
  });

  it("rejeita segredo diferente", () => {
    const token = signLink(PRODUCT, SECRET);
    expect(verifyLink(token, "outro-segredo-com-32-caracteres")).toBeNull();
  });

  it("rejeita token expirado", () => {
    const token = signLink(PRODUCT, SECRET, -1);
    expect(verifyLink(token, SECRET)).toBeNull();
  });

  it("rejeita URL inválida", () => {
    expect(() =>
      signLink({ u: "javascript:alert(1)", t: "X" }, SECRET),
    ).toThrow();
  });

  it("exige segredo com tamanho mínimo", () => {
    expect(() => signLink(PRODUCT, "curto")).toThrow();
  });
});
