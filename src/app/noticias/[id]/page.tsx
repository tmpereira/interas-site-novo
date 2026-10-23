import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import FaixaTitulo from "@/components/FaixaTitulo";
import { carregarConteudo } from "@/lib/conteudo";
import { resumoDaNoticia } from "@/lib/consultas";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";

type Props = { params: Promise<{ id: string }> };

function noticiaPorId(id: string) {
  const noticia = carregarConteudo().noticias.find((n) => n.id === id);
  if (!noticia) throw new Error(`content/noticias: não existe a notícia "${id}"`);
  return noticia;
}

export function generateStaticParams() {
  return carregarConteudo().noticias.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = noticiaPorId((await params).id);
  const descricao = resumoDaNoticia(n);
  return {
    title: n.titulo,
    description: descricao,
    authors: n.autor ? [{ name: n.autor }] : undefined,
    openGraph: { type: "article", title: n.titulo, description: descricao, publishedTime: n.data, images: [n.imagem] },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const n = noticiaPorId((await params).id);
  return (
    <>
      <FaixaTitulo titulo={n.titulo} etiquetas={n.categorias} />
      <div className="pagina">
        <Breadcrumb itens={[{ rotulo: "Notícias", href: "/noticias/" }, { rotulo: n.titulo }]} />
        <article className="leitura">
          <dl className="ficha">
            {n.autor && (
              <div>
                <dt className="ficha__rotulo">Autor</dt>
                <dd className="ficha__valor">{n.autor}</dd>
              </div>
            )}
            <div>
              <dt className="ficha__rotulo">Data de publicação</dt>
              <dd className="ficha__valor">{formatarDataLonga(n.data)}</dd>
            </div>
          </dl>
          <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(n.corpo, { rebaixarTitulos: true }) }} />
        </article>
      </div>
    </>
  );
}
