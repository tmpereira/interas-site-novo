// Conversão de Markdown (campos `conteudo`, textos da home, corpo das notícias) em HTML,
// feita no build. Links externos abrem em nova aba, como no site antigo. Links internos
// (escritos com a rota em português, ex.: /equipe/fulano/) vão para a rota do idioma da página.

import type { Element, Root, RootContent } from "hast";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { type Idioma, linkNoIdioma } from "./i18n/rotas.ts";

/** Rebaixa os títulos em um nível (h1 → h2 ... h5 → h6): a página já tem o seu <h1>. */
function rehypeRebaixarTitulos() {
  const rebaixar = (no: Root | Element | RootContent) => {
    if (no.type === "element") {
      const m = /^h([1-5])$/.exec(no.tagName);
      if (m) no.tagName = `h${Number(m[1]) + 1}`;
    }
    if ("children" in no) no.children.forEach(rebaixar);
  };
  return (arvore: Root) => rebaixar(arvore);
}

/** Troca os links internos pela rota do idioma (`linkNoIdioma`): /equipe/x/ → /en/team/x/. */
function rehypeLinksNoIdioma(idioma: Idioma) {
  const trocar = (no: Root | Element | RootContent) => {
    if (no.type === "element" && no.tagName === "a" && typeof no.properties.href === "string") {
      no.properties.href = linkNoIdioma(no.properties.href, idioma);
    }
    if ("children" in no) no.children.forEach(trocar);
  };
  return () => (arvore: Root) => trocar(arvore);
}

const processadores = new Map<string, ReturnType<typeof criarProcessador>>();

function criarProcessador(idioma: Idioma, rebaixarTitulos: boolean) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rebaixarTitulos ? rehypeRebaixarTitulos : () => undefined)
    .use(rehypeLinksNoIdioma(idioma))
    .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
    .use(rehypeStringify);
}

/** Markdown → HTML (blocos: parágrafos, listas, títulos, tabelas...), com os links internos no idioma. */
export function markdownParaHtml(texto: string | null | undefined, idioma: Idioma, opcoes: { rebaixarTitulos?: boolean } = {}): string {
  if (!texto) return "";
  const chave = `${idioma}-${Boolean(opcoes.rebaixarTitulos)}`;
  let processador = processadores.get(chave);
  if (!processador) {
    processador = criarProcessador(idioma, Boolean(opcoes.rebaixarTitulos));
    processadores.set(chave, processador);
  }
  return String(processador.processSync(texto));
}

/** Markdown de uma linha → HTML sem o parágrafo externo (negrito, itálico, links). */
export function markdownEmLinha(texto: string | null | undefined, idioma: Idioma): string {
  return markdownParaHtml(texto, idioma).replace(/^<p>([\s\S]*)<\/p>\s*$/, "$1");
}

/** Texto simples de um trecho de Markdown (sem marcação), para resumos e meta tags. */
export function markdownParaTexto(texto: string): string {
  return texto
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta o texto no limite, na última palavra inteira, e acrescenta reticências. */
export function truncarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const corte = texto.slice(0, limite).replace(/\s+\S*$/, "");
  return `${corte.replace(/[.,;:!?\s]+$/, "")}…`;
}
