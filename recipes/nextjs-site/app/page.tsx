import { DealForm } from "./DealForm";

function evolutionReady(): boolean {
  return Boolean(
    process.env.EVOLUTION_API_URL &&
      process.env.EVOLUTION_API_KEY &&
      process.env.EVOLUTION_INSTANCE &&
      process.env.WHATSAPP_TARGET,
  );
}

function previewReady(): boolean {
  return Boolean(process.env.PUBLIC_BASE_URL && process.env.LINK_SECRET);
}

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">whatsapp-ofertas-kit</p>
        <h1>Envie uma oferta para o WhatsApp</h1>
        <p className="lede">
          Cole a URL do produto. O kit busca título, preço e imagem, monta a
          mensagem e envia para o seu grupo ou número.
        </p>
        <div className="pills">
          <span className={evolutionReady() ? "pill ok" : "pill"}>
            {evolutionReady()
              ? "Evolution configurada"
              : "Evolution não configurada"}
          </span>
          <span className={previewReady() ? "pill ok" : "pill"}>
            {previewReady()
              ? "Preview card ativo"
              : "Preview card desativado"}
          </span>
        </div>
      </header>

      <DealForm />

      <section className="how">
        <h2>Como funciona</h2>
        <ol>
          <li>Você informa a URL do produto.</li>
          <li>O servidor extrai Open Graph (título, imagem, preço).</li>
          <li>A mensagem é montada com link próprio e assinado.</li>
          <li>A Evolution API envia para o destino configurado.</li>
        </ol>
      </section>
    </main>
  );
}
