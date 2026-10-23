// Conversão de Markdown (campos `conteudo`, textos da home, corpo das notícias) em HTML,
// feita no build. Links externos abrem em nova aba, como no site antigo.

import type { Element, Root, RootContent } from "hast";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

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

const processador = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
  .use(rehypeStringify);

const processadorRebaixado = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeRebaixarTitulos)
  .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
  .use(rehypeStringify);

/** Markdown → HTML (blocos: parágrafos, listas, títulos, tabelas...). */
export function markdownParaHtml(texto: string | null | undefined, opcoes: { rebaixarTitulos?: boolean } = {}): string {
  if (!texto) return "";
  return String((opcoes.rebaixarTitulos ? processadorRebaixado : processador).processSync(texto));
}

/** Markdown de uma linha → HTML sem o parágrafo externo (negrito, itálico, links). */
export function markdownEmLinha(texto: string | null | undefined): string {
  return markdownParaHtml(texto).replace(/^<p>([\s\S]*)<\/p>\s*$/, "$1");
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
