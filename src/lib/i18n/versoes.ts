/**
 * Versões de uma página nos dois idiomas, para o hreflang (`metadadosPagina`) e o sitemap
 * (CLAUDE.md, seção 13.6). Uma página só tem versão num idioma se ela existir nele: notícia
 * sem tradução não tem versão em inglês. Lê o conteúdo, por isso só roda no servidor.
 */
import { conteudoNoIdioma } from "../conteudo";
import { IDIOMAS, type Idioma, LOCALE, caminhoEquivalente, idiomaDoCaminho, secaoDoCaminho } from "./rotas";

/** Caminho da página em cada idioma em que ela existe (ex.: { pt: "/equipe/x/", en: "/en/team/x/" }). */
export function versoesDaPagina(caminho: string): Partial<Record<Idioma, string>> {
  const secao = secaoDoCaminho(caminho);
  if (!secao) return { [idiomaDoCaminho(caminho)]: caminho };
  const slug = secao.resto.replace(/\/$/, "");
  const noticiasEn = new Set(conteudoNoIdioma("en").noticias.map((n) => n.id));
  const existe = (idioma: Idioma) => !slug || idioma === "pt" || secao.chave !== "noticias" || noticiasEn.has(slug);
  return Object.fromEntries(IDIOMAS.filter(existe).map((i) => [i, caminhoEquivalente(caminho, i)]));
}

/**
 * `hreflang` da página: cada versão com o código do idioma e `x-default` apontando para o
 * português. `undefined` se a página só existe num idioma.
 */
export function idiomasAlternativos(caminho: string): Record<string, string> | undefined {
  const versoes = versoesDaPagina(caminho);
  if (!versoes.pt || !versoes.en) return undefined;
  return { [LOCALE.pt]: versoes.pt, [LOCALE.en]: versoes.en, "x-default": versoes.pt };
}
