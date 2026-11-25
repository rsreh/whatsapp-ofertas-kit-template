import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "whatsapp-ofertas-kit",
  description:
    "Monte, pré-visualize e envie ofertas de produtos para o WhatsApp.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
