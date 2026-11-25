/** Helpers de formatação e templates de texto. */

export type TemplateVars = Record<string, string | number | null | undefined>;

/**
 * Substitui `{{chave}}` pelos valores informados.
 * Chave inexistente ou nula vira string vazia (nunca "undefined").
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (_match, key: string) => {
      const value = vars[key];
      return value == null ? "" : String(value);
    },
  );
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formatação nativa do WhatsApp. */
export function bold(text: string): string {
  return `*${text}*`;
}

export function italic(text: string): string {
  return `_${text}_`;
}

export function strike(text: string): string {
  return `~${text}~`;
}

export function mono(text: string): string {
  return `\`\`\`${text}\`\`\``;
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

/** O WhatsApp limita mensagens de texto a 4096 caracteres. */
export function clampMessage(text: string, max = 4096): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}
