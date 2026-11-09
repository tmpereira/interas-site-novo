/**
 * Mapa único das rotas do site nos dois idiomas (CLAUDE.md, seção 13.2).
 * Nenhum componente monta URL interna à mão: usa `rota()` ou, para links que vêm do
 * conteúdo (menu, botões da home), `linkNoIdioma()`.
 */

export const IDIOMAS = ["pt", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** Código de idioma para `Intl` (datas, números, ordenação) e para o `lang` do <html>. */
export const LOCALE: Record<Idioma, string> = { pt: "pt-BR", en: "en" };

/** Seções do site. Os itens (`slug`/`id`) são os mesmos nos dois idiomas. */
const ROTAS = {
  inicio: { pt: "/", en: "/en/" },
  sobre: { pt: "/sobre-o-interas/", en: "/en/about/" },
  equipe: { pt: "/equipe/", en: "/en/team/" },
  alunos: { pt: "/alunos/", en: "/en/students/" },
  areas: { pt: "/areas-de-pesquisa/", en: "/en/research-areas/" },
  grupos: { pt: "/grupos/", en: "/en/groups/" },
  publicacoes: { pt: "/publicacoes/", en: "/en/publications/" },
  noticias: { pt: "/noticias/", en: "/en/news/" },
  videos: { pt: "/videos/", en: "/en/videos/" },
  numeros: { pt: "/interas-em-numeros/", en: "/en/interas-in-numbers/" },
  contato: { pt: "/contato/", en: "/en/contact/" },
} as const satisfies Record<string, Record<Idioma, string>>;

export type ChaveRota = keyof typeof ROTAS;
export const CHAVES_ROTAS = Object.keys(ROTAS) as ChaveRota[];

/** URL de uma seção (`rota("equipe", "en")` → "/en/team/") ou de um item dela (`rota("equipe", "pt", "fulano")` → "/equipe/fulano/"). */
export function rota(chave: ChaveRota, idioma: Idioma, slug?: string): string {
  const base = ROTAS[chave][idioma];
  return slug ? `${base}${slug}/` : base;
}

/** Idioma de um caminho: tudo sob /en/ é inglês; o resto, português. */
export const idiomaDoCaminho = (caminho: string): Idioma => (caminho === "/en" || caminho.startsWith("/en/") ? "en" : "pt");

/**
 * Converte um link interno escrito em português no conteúdo (ex.: "/grupos/?tema=diagnostico",
 * em site.json ou home.json) para a rota equivalente no idioma. Links externos, âncoras e
 * caminhos que não são seções do site (ex.: "/arquivos/x.pdf") ficam como estão.
 */
export function linkNoIdioma(link: string, idioma: Idioma): string {
  if (idioma === "pt" || !link.startsWith("/") || link.startsWith("//")) return link;
  const [, caminho, sufixo] = link.match(/^([^?#]*)(.*)$/) as RegExpMatchArray;
  // Arquivo de public/ (ex.: /noticias/<id>/capa.jpg), não página: fica como está
  if (/\.[a-z0-9]+$/i.test(caminho)) return link;
  const comBarra = caminho.endsWith("/") ? caminho : `${caminho}/`;
  if (comBarra === "/") return ROTAS.inicio[idioma] + sufixo;
  // A seção cujo caminho em português é o início do link (a home "/" não entra: casaria com tudo)
  const chave = CHAVES_ROTAS.find((c) => c !== "inicio" && comBarra.startsWith(ROTAS[c].pt));
  if (!chave) return link;
  return ROTAS[chave][idioma] + comBarra.slice(ROTAS[chave].pt.length) + sufixo;
}
