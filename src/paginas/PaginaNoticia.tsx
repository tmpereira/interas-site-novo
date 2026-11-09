import type { Metadata } from "next";
import Image from "next/image";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { carregarConteudo } from "@/lib/conteudo";
import { resumoDaNoticia } from "@/lib/consultas";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

function noticiaPorId(id: string) {
  const noticia = carregarConteudo().noticias.find((n) => n.id === id);
  if (!noticia) throw new Error(`content/noticias: não existe a notícia "${id}"`);
  return noticia;
}

export function parametros() {
  return carregarConteudo().noticias.map((n) => ({ id: n.id }));
}

export function metadados(idioma: Idioma, id: string): Metadata {
  const n = noticiaPorId(id);
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
  const n = noticiaPorId(id);
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
        <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(n.corpo, { rebaixarTitulos: true }) }} />
      </article>
    </div>
  );
}
