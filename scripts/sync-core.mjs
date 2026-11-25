#!/usr/bin/env node
/**
 * Copia o núcleo compartilhado para uma receita.
 *
 * O núcleo é a fonte da verdade em `packages/core/src`. Cada receita recebe
 * uma cópia em `src/core` para continuar autocontida (fácil de copiar para
 * outro projeto, sem workspace nem link simbólico).
 *
 * Uso:
 *   node scripts/sync-core.mjs recipes/node-cron
 *   node scripts/sync-core.mjs recipes/nextjs-site
 */
import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];

if (!target) {
  console.error("Uso: node scripts/sync-core.mjs <pasta-da-receita>");
  process.exit(1);
}

const source = resolve(repoRoot, "packages/core/src");
const destination = resolve(repoRoot, target, "src/core");

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log(`Núcleo sincronizado em ${destination}`);
