/** Cálculo de data/hora em um fuso, sem depender do fuso do servidor. */

export type TimeParts = {
  /** YYYY-MM-DD */
  date: string;
  hour: number;
  minute: number;
};

export function timeParts(date: Date, timeZone: string): TimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** Chave por dia (ex.: `daily:2026-11-22`). */
export function dayKey(prefix: string, date: Date, timeZone: string): string {
  return `${prefix}:${timeParts(date, timeZone).date}`;
}

/** Chave por janela de 30 minutos (ex.: `tick:2026-11-22T09:30`). */
export function slotKey(prefix: string, date: Date, timeZone: string): string {
  const { date: day, hour, minute } = timeParts(date, timeZone);
  const paddedHour = String(hour).padStart(2, "0");
  return `${prefix}:${day}T${paddedHour}:${minute < 30 ? "00" : "30"}`;
}
