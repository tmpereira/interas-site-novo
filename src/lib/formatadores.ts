// Formatação de datas para exibição (as datas nos dados são sempre AAAA-MM-DD).

/** "2026-09-24" → "24 de set. de 2026" */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, mes - 1, dia)),
  );
}
