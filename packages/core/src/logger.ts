/**
 * Log estruturado em JSON, com redação de campos sensíveis.
 * Nunca registre a mensagem inteira nem o corpo da requisição da Evolution.
 */

export type Logger = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};

const SECRET_KEY = /(api[-_]?key|apikey|secret|token|authorization|password|passwd|credential)/i;

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[profundo]";
  if (value == null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SECRET_KEY.test(key) ? "[redigido]" : redactValue(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

export function redact(value: unknown): unknown {
  return redactValue(value);
}

export function createLogger(scope: string): Logger {
  const write = (
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>,
  ) => {
    const line = JSON.stringify({
      at: new Date().toISOString(),
      level,
      scope,
      message,
      ...(meta ? { meta: redactValue(meta) } : {}),
    });

    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };

  return {
    info: (message, meta) => write("info", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    error: (message, meta) => write("error", message, meta),
  };
}
