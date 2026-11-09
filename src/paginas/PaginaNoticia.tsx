import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { conteudoNoIdioma } from "@/lib/conteudo";
import { resumoDaNoticia } from "@/lib/consultas";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

/**
 * Id provisório para quando o idioma ainda não tem nenhuma notícia: o export estático exige
 * ao menos uma página na rota, então gera-se só esta, que responde 404 (`notFound`).
 * Nenhum link aponta para ela; some sozinha quando houver a primeira notícia traduzida.
 */
const SEM_NOTICIAS = "_sem-noticias";

function noticiaPorId(id: string, idioma: Idioma) {
  if (id === SEM_NOTICIAS) notFound();
  const noticia = conteudoNoIdioma(idioma).noticias.find((n) => n.id === id);
  if (!noticia) throw new Error(`content/noticias: não existe a notícia "${id}"`);
  return noticia;
}

/** Em inglês, só as notícias que têm versão em inglês (content/noticias/en/) geram página. */
export function parametros(idioma: Idioma) {
  const ids = conteudoNoIdioma(idioma).noticias.map((n) => ({ id: n.id }));
  return ids.length > 0 ? ids : [{ id: SEM_NOTICIAS }];
}

export function metadados(idioma: Idioma, id: string): Metadata {
  const n = noticiaPorId(id, idioma);
  const descricao = resumoDaNoticia(n);
  const meta = metadadosPagina({
    titulo: n.titulo,
    descricao,
    caminho: rota("noticias", idioma, n.id),
    imagem: n.imagem,
    tipo: "article",
    extra: { authors: n.autor ? [{ name: n.autor }] : undefined },
  });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: n.data } };
}

export default function PaginaNoticia({ idioma, id }: { idioma: Idioma; id: string }) {
  const n = noticiaPorId(id, idioma);
  const r = rotulos(idioma);
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("noticias", idioma)} sobretitulo={r.noticias.sobretitulo} titulo={n.titulo} etiquetas={n.categorias} />
      <article className="leitura">
        <div className="leitura__capa">
          <Image src={n.imagem} alt="" fill priority sizes="(min-width: 768px) 46rem, 100vw" className="leitura__capa-img" />
        </div>
        <dl className="ficha">
          {n.autor && (
            <div>
              <dt className="ficha__rotulo">{r.noticias.autor}</dt>
              <dd className="ficha__valor">{n.autor}</dd>
            </div>
          )}
          <div>
            <dt className="ficha__rotulo">{r.comum.dataPublicacao}</dt>
            <dd className="ficha__valor">{formatarDataLonga(n.data, idioma)}</dd>
          </div>
        </dl>
        <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(n.corpo, idioma, { rebaixarTitulos: true }) }} />
      </article>
    </div>
  );
}
