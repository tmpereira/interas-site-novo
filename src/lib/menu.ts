import type { Site } from "./esquemas";
import { type Idioma, linkNoIdioma } from "./i18n/rotas";

export type ItemMenu = { rotulo: string; link: string };
export type SubmenuMenu = { rotulo: string; itens: ItemMenu[] };
export type EntradaMenu = Site["menu"][number];

export const temItens = (entrada: EntradaMenu): entrada is SubmenuMenu => "itens" in entrada;

/** Caminho de um link sem âncora, parâmetros nem barra final, para comparar com a página atual. */
export const caminhoDoLink = (link: string) => link.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

/** A página `caminho` é o link ou está abaixo dele (ex.: /noticias/x/ está em /noticias/). */
export function estaEm(caminho: string, link: string): boolean {
  const pagina = caminhoDoLink(caminho);
  const alvo = caminhoDoLink(link);
  // As páginas iniciais ("/" e "/en") só contêm a si mesmas
  return alvo === "/" || alvo === "/en" ? pagina === alvo : pagina === alvo || pagina.startsWith(`${alvo}/`);
}

/** Menu de site.json com os links internos convertidos para as rotas do idioma. */
export function menuNoIdioma(menu: EntradaMenu[], idioma: Idioma): EntradaMenu[] {
  return menu.map((e) =>
    temItens(e) ? { ...e, itens: e.itens.map((i) => ({ ...i, link: linkNoIdioma(i.link, idioma) })) } : { ...e, link: linkNoIdioma(e.link, idioma) },
  );
}

/** Entrada do menu (link ou submenu) que contém a página. */
export function entradaDaPagina(menu: EntradaMenu[], caminho: string): EntradaMenu | undefined {
  return menu.find((e) => (temItens(e) ? e.itens.some((i) => estaEm(caminho, i.link)) : estaEm(caminho, e.link)));
}
