#!/usr/bin/env node
// Setup interativo: gera .env para a receita escolhida.
// Uso: node scripts/setup.mjs [node-cron|nextjs-site]
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const recipe = process.argv[2] ?? "node-cron";
const valid = ["node-cron", "nextjs-site"];
if (!valid.includes(recipe)) {
  console.error(`Receita inválida: ${recipe}. Use: ${valid.join(" | ")}`);
  process.exit(1);
}

const root = resolve(process.cwd());
const dir = join(root, "recipes", recipe);
const envPath = join(dir, ".env");
const examplePath = join(dir, ".env.example");

if (!existsSync(examplePath)) {
  console.error(`Não encontrei ${examplePath}. Rode a partir da raiz do repositório.`);
  process.exit(1);
}

const rl = createInterface({ input, output });

async function ask(label, fallback = "") {
  const suffix = fallback ? ` [${fallback}]` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return answer.trim() || fallback;
}

async function askSecret(label) {
  const answer = await rl.question(`${label}: `);
  return answer.trim();
}

console.log(`\nSetup interativo — receita: ${recipe}\n`);
console.log("Pressione Enter para manter o valor padrão entre colchetes.\n");

const vars = {};

vars.EVOLUTION_API_URL = await ask("URL da Evolution API (https://...)", "http://localhost:8080");
vars.EVOLUTION_API_KEY = await askSecret("Chave da Evolution API (AUTHENTICATION_API_KEY)");
vars.EVOLUTION_INSTANCE = await ask("Nome da instância", "ofertas");
vars.WHATSAPP_TARGET = await ask("JID do grupo/destino (ex.: 120363...@g.us)", "");
vars.PUBLIC_BASE_URL = await ask("URL pública do app (https://...) — opcional", "");
vars.LINK_SECRET = vars.PUBLIC_BASE_URL
  ? await askSecret("LINK_SECRET (mín. 16 chars)")
  : await ask("LINK_SECRET — opcional", "");
vars.CRON_SECRET = await askSecret("CRON_SECRET — opcional (recomendado em prod)");
vars.ADMIN_TOKEN = await askSecret("ADMIN_TOKEN — opcional (para /send)");
vars.TIMEZONE = await ask("Fuso horário", "America/Sao_Paulo");
vars.SEND_HOUR = await ask("Hora de envio (0-23)", "9");
vars.PORT = await ask("Porta", recipe === "node-cron" ? "3001" : "3000");
vars.STATE_FILE = await ask("Arquivo de estado", ".data/state.json");
vars.PRODUCTS_FILE = await ask("Arquivo de produtos (manual)", "products.json");
vars.PRODUCT_URLS = await ask("URLs de produtos separadas por vírgula (Open Graph) — opcional", "");
vars.SHOPEE_APP_ID = await ask("Shopee APP_ID — opcional", "");
vars.SHOPEE_SECRET = vars.SHOPEE_APP_ID
  ? await askSecret("Shopee SECRET")
  : "";
vars.SHOPEE_KEYWORDS = vars.SHOPEE_APP_ID
  ? await ask("Shopee palavras-chave separadas por vírgula", "")
  : "";
vars.SHOPEE_MIN_DISCOUNT = vars.SHOPEE_APP_ID
  ? await ask("Shopee desconto mínimo (%)", "10")
  : "";

rl.close();

// Monta o .env na ordem do .env.example
const example = readFileSync(examplePath, "utf8");
const lines = example.split(/\r?\n/);
const out = [];
const written = new Set();
for (const line of lines) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) {
    const key = m[1];
    if (key in vars) {
      out.push(`${key}="${vars[key]}"`);
      written.add(key);
    } else {
      out.push(line);
    }
  } else {
    out.push(line);
  }
}
// Acrescenta quaisquer chaves não presentes no example
for (const [k, v] of Object.entries(vars)) {
  if (!written.has(k)) out.push(`${k}="${v}"`);
}

if (existsSync(envPath)) {
  const backup = `${envPath}.bak`;
  writeFileSync(backup, readFileSync(envPath));
  console.log(`\n.env existente salvo em ${backup}`);
}
writeFileSync(envPath, out.join("\n") + "\n");
console.log(`\nArquivo gerado: ${envPath}`);
console.log("Revise o conteúdo antes de rodar. Nunca commite o .env.\n");
