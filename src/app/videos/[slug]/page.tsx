import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { carregarConteudo } from "@/lib/conteudo";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";

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
  return { title: v.titulo, description: v.resumo ?? undefined, openGraph: v.capa ? { images: [v.capa] } : undefined };
}

export default async function PaginaVideo({ params }: Props) {
  const v = videoPorSlug((await params).slug);
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Vídeos", href: "/videos/" }, { rotulo: v.titulo }]} />
      <article className="leitura">
        <header>
          <h1 className="leitura__titulo">{v.titulo}</h1>
          {v.categorias.length > 0 && (
            <p>
              {v.categorias.map((c) => (
                <span key={c} className="etiqueta">
                  {c}
                </span>
              ))}
            </p>
          )}
          {v.resumo && <p>{v.resumo}</p>}
        </header>
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
