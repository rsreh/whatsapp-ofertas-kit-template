import { describe, expect, it } from "vitest";
import {
  decodeHtml,
  isPrivateAddress,
  parseOpenGraph,
} from "../src/sources/opengraph";

describe("parseOpenGraph", () => {
  const html = `<!doctype html>
<html>
  <head>
    <title>Fallback</title>
    <meta property="og:title" content="Fone &amp; Caixa">
    <meta content="R$ 99,90" property="product:price:amount">
    <meta name="og:image" content="/img/fone.jpg">
    <meta property="og:description" content="Um fone muito bom">
  </head>
</html>`;

  it("extrai título, preço, imagem e descrição", () => {
    const data = parseOpenGraph(html, "https://example.com/produto");
    expect(data.title).toBe("Fone & Caixa");
    expect(data.price).toBe(99.9);
    expect(data.imageUrl).toBe("https://example.com/img/fone.jpg");
    expect(data.description).toBe("Um fone muito bom");
  });

  it("usa JSON-LD quando as metatags faltam", () => {
    const jsonLd = `<html><head>
      <script type="application/ld+json">
        {"@type":"Product","name":"Cadeira","image":["https://cdn.example.com/c.jpg"],
         "offers":{"price":"249.90"}}
      </script>
    </head></html>`;

    const data = parseOpenGraph(jsonLd, "https://example.com");
    expect(data.title).toBe("Cadeira");
    expect(data.imageUrl).toBe("https://cdn.example.com/c.jpg");
    expect(data.price).toBe(249.9);
  });
});

describe("decodeHtml", () => {
  it("decodifica entidades comuns", () => {
    expect(decodeHtml("a &amp; b &#39;c&#39;")).toBe("a & b 'c'");
  });
});

describe("isPrivateAddress", () => {
  it("bloqueia faixas privadas e locais", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.0.10",
      "169.254.169.254",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("libera endereços públicos", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"]) {
      expect(isPrivateAddress(address), address).toBe(false);
    }
  });
});
