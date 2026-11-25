import { NextResponse } from "next/server";
import { loadConfig } from "@/src/core/config";
import { renderPreviewHtml } from "@/src/core/links/preview";
import { verifyLink } from "@/src/core/links/signed";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const config = loadConfig(process.env, { requireProvider: false });
  if (!config.linkSecret || !config.publicBaseUrl) {
    return new NextResponse("Preview não configurado.", { status: 404 });
  }

  const payload = verifyLink(token, config.linkSecret);
  if (!payload) {
    return new NextResponse("Link inválido ou expirado.", { status: 404 });
  }

  const html = renderPreviewHtml(payload, {
    publicUrl: `${config.publicBaseUrl}/o/${token}`,
    siteName: "Ofertas",
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
