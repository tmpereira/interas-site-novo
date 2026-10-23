// Consultas sobre o conteúdo validado, usadas pelas páginas.

import { carregarConteudo } from "./conteudo.ts";
import type { CategoriaPessoa, Grupo, Noticia, Pagina, Pessoa, Publicacao } from "./esquemas.ts";
import { markdownParaTexto, truncarTexto } from "./markdown.ts";

/** Página institucional ou texto de abertura de uma listagem (content/paginas.json). */
export function paginaPorSlug(slug: string): Pagina {
  const pagina = carregarConteudo().paginas.find((p) => p.slug === slug);
  if (!pagina) throw new Error(`content/paginas.json: não existe a página "${slug}"`);
  return pagina;
}

/** Pessoas ativas agrupadas por categoria, na ordem de exibição e com os títulos de site.json. */
export function equipePorCategoria(): { chave: CategoriaPessoa; titulo: string; pessoas: Pessoa[] }[] {
  const { site, pessoas } = carregarConteudo();
  return site.categorias_pessoas
    .map(({ chave, titulo }) => ({ chave, titulo, pessoas: pessoas.filter((p) => p.ativo && p.categoria === chave) }))
    .filter((c) => c.pessoas.length > 0);
}

export function pessoaPorSlug(slug: string): Pessoa {
  const pessoa = carregarConteudo().pessoas.find((p) => p.slug === slug);
  if (!pessoa) throw new Error(`content/pessoas.json: não existe a pessoa "${slug}"`);
  return pessoa;
}

/** Publicações em que a pessoa é autora (campo `pessoas` de cada publicação). */
export function publicacoesDaPessoa(slug: string): Publicacao[] {
  return carregarConteudo().publicacoes.filter((p) => p.pessoas.includes(slug));
}

/** Grupos dos quais a pessoa participa (campo `grupos` da pessoa). */
export function gruposDaPessoa(pessoa: Pessoa): Grupo[] {
  const { grupos } = carregarConteudo();
  return pessoa.grupos.map((s) => grupos.find((g) => g.slug === s)).filter((g): g is Grupo => Boolean(g));
}

/**
 * Resumo de uma notícia na listagem: o campo `resumo` ou, se vazio, o primeiro parágrafo do corpo
 * (sem títulos, imagens, listas, citações e tabelas), cortado em ~200 caracteres.
 */
export function resumoDaNoticia(noticia: Noticia): string {
  if (noticia.resumo) return noticia.resumo;
  const paragrafo = noticia.corpo
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find((b) => b && !/^(#|!\[|>|\||[-*+] |\d+\. |:::|---)/.test(b));
  return truncarTexto(markdownParaTexto(paragrafo ?? ""), 200);
}
