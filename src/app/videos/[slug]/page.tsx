import type { Metadata } from "next";
import Image from "next/image";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { carregarConteudo } from "@/lib/conteudo";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

type Props = { params: Promise<{ slug: string }> };

function videoPorSlug(slug: string) {
  const video = carregarConteudo().videos.find((v) => v.slug === slug);
  if (!video) throw new Error(`content/videos.json: não existe o vídeo "${slug}"`);
  return video;
}

export function generateStaticParams() {
  return carregarConteudo().videos.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = videoPorSlug((await params).slug);
  return metadadosPagina({ titulo: v.titulo, descricao: v.resumo, caminho: `/videos/${v.slug}/`, imagem: v.capa });
}

export default async function PaginaVideo({ params }: Props) {
  const v = videoPorSlug((await params).slug);
  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho="/videos/"
        sobretitulo="Vídeos"
        titulo={v.titulo}
        descricao={v.resumo}
        etiquetas={v.categorias}
      />
      <article className="leitura">
        {v.capa && (
          <div className="leitura__capa">
            <Image src={v.capa} alt="" fill priority sizes="(min-width: 768px) 46rem, 100vw" className="leitura__capa-img" />
          </div>
        )}
        <dl className="ficha">
          <div>
            <dt className="ficha__rotulo">Data de publicação</dt>
            <dd className="ficha__valor">{formatarDataLonga(v.data)}</dd>
          </div>
        </dl>
        {v.conteudo && (
          <section>
            <h2>Descrição</h2>
            <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(v.conteudo) }} />
          </section>
        )}
        {v.links.length > 0 && (
          <section>
            <h2>Acesso ao conteúdo</h2>
            <ul className="links-video">
              {v.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
