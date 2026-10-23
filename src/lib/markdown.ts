// Conversão de Markdown (campos `conteudo`, textos da home, corpo das notícias) em HTML,
// feita no build. Links externos abrem em nova aba, como no site antigo.

import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processador = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
  .use(rehypeStringify);

/** Markdown → HTML (blocos: parágrafos, listas, títulos, tabelas...). */
export function markdownParaHtml(texto: string | null | undefined): string {
  if (!texto) return "";
  return String(processador.processSync(texto));
}

/** Markdown de uma linha → HTML sem o parágrafo externo (negrito, itálico, links). */
export function markdownEmLinha(texto: string | null | undefined): string {
  return markdownParaHtml(texto).replace(/^<p>([\s\S]*)<\/p>\s*$/, "$1");
}
