import { describe, expect, it } from "vitest";
import {
  normalizeShopeeNode,
  shopeeAuthHeader,
} from "../src/sources/shopee";

describe("shopeeAuthHeader", () => {
  it("segue o formato SHA256 Credential/Timestamp/Signature", () => {
    const header = shopeeAuthHeader("app", "secret", "{}", 1_700_000_000);
    expect(header).toMatch(
      /^SHA256 Credential=app, Timestamp=1700000000, Signature=[a-f0-9]{64}$/,
    );
  });

  it("muda a assinatura quando o timestamp muda", () => {
    const first = shopeeAuthHeader("app", "secret", "{}", 1);
    const second = shopeeAuthHeader("app", "secret", "{}", 2);
    expect(first).not.toBe(second);
  });
});

describe("normalizeShopeeNode", () => {
  it("normaliza preço e reconstrói o preço original", () => {
    const product = normalizeShopeeNode({
      itemId: 123,
      productName: "Filamento PLA",
      offerLink: "https://s.shopee.com.br/abc",
      imageUrl: "https://down-br.img.susercontent.com/file/x",
      price: "50.00",
      priceDiscountRate: 20,
      shopName: "Loja 3D",
    });

    expect(product?.id).toBe("123");
    expect(product?.price).toBe(50);
    expect(product?.originalPrice).toBe(62.5);
    expect(product?.discountRate).toBe(20);
  });

  it("descarta item sem link ou preço", () => {
    expect(normalizeShopeeNode({ productName: "X" })).toBeNull();
  });
});
