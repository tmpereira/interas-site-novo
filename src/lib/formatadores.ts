// Formatação de datas para exibição (as datas nos dados são sempre AAAA-MM-DD).

/** "2026-09-24" → "24 de set. de 2026" */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, mes - 1, dia)),
  );
}

/** "2024-05-01" → "1 de maio de 2024" */
export function formatarDataLonga(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}

/** Rótulos de exibição dos tipos de publicação. */
export const ROTULOS_TIPO_PUBLICACAO: Record<string, string> = {
  artigo: "Artigo",
  livro: "Livro",
  capitulo: "Capítulo",
  "trabalho-evento": "Trabalho em evento",
  outro: "Outro",
};

/** Rótulos de exibição dos tipos de patente/registro. */
export const ROTULOS_TIPO_PATENTE: Record<string, string> = {
  patente: "Patente",
  software: "Software",
  marca: "Marca",
  "modelo-utilidade": "Modelo de utilidade",
  outro: "Outro",
};

/** Texto sem acentos e em minúsculas, para buscas. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
