import type { Site } from "./esquemas";

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
  return alvo === "/" ? pagina === "/" : pagina === alvo || pagina.startsWith(`${alvo}/`);
}

/** Entrada do menu (link ou submenu) que contém a página. */
export function entradaDaPagina(menu: EntradaMenu[], caminho: string): EntradaMenu | undefined {
  return menu.find((e) => (temItens(e) ? e.itens.some((i) => estaEm(caminho, i.link)) : estaEm(caminho, e.link)));
}
