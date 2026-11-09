import type { Metadata } from "next";
import Image from "next/image";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { carregarConteudo, conteudoNoIdioma } from "@/lib/conteudo";
import { formatarDataLonga } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

function videoPorSlug(slug: string, idioma: Idioma) {
  const video = conteudoNoIdioma(idioma).videos.find((v) => v.slug === slug);
  if (!video) throw new Error(`content/videos.json: não existe o vídeo "${slug}"`);
  return video;
}

export function parametros() {
  return carregarConteudo().videos.map((v) => ({ slug: v.slug }));
}

export function metadados(idioma: Idioma, slug: string): Metadata {
  const v = videoPorSlug(slug, idioma);
  return metadadosPagina({ titulo: v.titulo, descricao: v.resumo, caminho: rota("videos", idioma, v.slug), imagem: v.capa });
}

export default function PaginaVideo({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const v = videoPorSlug(slug, idioma);
  const r = rotulos(idioma);
  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho={rota("videos", idioma)}
        sobretitulo={r.videos.sobretitulo}
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
            <dt className="ficha__rotulo">{r.comum.dataPublicacao}</dt>
            <dd className="ficha__valor">{formatarDataLonga(v.data, idioma)}</dd>
          </div>
        </dl>
        {v.conteudo && (
          <section>
            <h2>{r.videos.descricao}</h2>
            <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(v.conteudo, idioma) }} />
          </section>
        )}
        {v.links.length > 0 && (
          <section>
            <h2>{r.videos.acesso}</h2>
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
