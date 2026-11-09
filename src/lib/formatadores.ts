// Formatação de datas e números para exibição, no idioma da página
// (as datas nos dados são sempre AAAA-MM-DD).

import { type Idioma, LOCALE } from "./i18n/rotas.ts";
import { rotulos } from "./i18n/rotulos.ts";

const paraData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
};

/** "2026-09-24" → "24 de set. de 2026" / "Sep 24, 2026" */
export function formatarData(data: string, idioma: Idioma): string {
  return new Intl.DateTimeFormat(LOCALE[idioma], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(paraData(data));
}

/** "2024-05-01" → "1 de maio de 2024" / "May 1, 2024" */
export function formatarDataLonga(data: string, idioma: Idioma): string {
  return new Intl.DateTimeFormat(LOCALE[idioma], { dateStyle: "long", timeZone: "UTC" }).format(paraData(data));
}

/** Número com separadores do idioma: 1234.5 → "1.234,5" / "1,234.5". `casas` fixa as casas decimais. */
export function formatarNumero(valor: number, idioma: Idioma, casas?: number | { min: number; max: number }): string {
  const opcoes = typeof casas === "number" ? { minimumFractionDigits: casas, maximumFractionDigits: casas } : casas ? { minimumFractionDigits: casas.min, maximumFractionDigits: casas.max } : {};
  return valor.toLocaleString(LOCALE[idioma], opcoes);
}

/** Comparação de textos para ordenar listas exibidas (ignora maiúsculas e acentos). */
export const compararTexto = (idioma: Idioma) => (a: string, b: string) => a.localeCompare(b, LOCALE[idioma], { sensitivity: "base" });

/** Texto sem acentos e em minúsculas, para buscas. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Minúsculas, sem acentos, com hífens: "Inteligência artificial" → "inteligencia-artificial". */
export function slugificar(texto: string): string {
  return normalizarBusca(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** JCR / fator de impacto: 5.116 → "5,116" / "5.116"; 3.5 → "3,5" / "3.5". */
export const formatarJcr = (valor: number, idioma: Idioma) => formatarNumero(valor, idioma, { min: 1, max: 3 });

/** "1 citação", "12 citações" / "1 citation", "12 citations". */
export const formatarCitacoes = (n: number, idioma: Idioma) => `${formatarNumero(n, idioma)} ${rotulos(idioma).publicacoes.citacoes(n)}`;
