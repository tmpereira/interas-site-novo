import type { Metadata } from "next";
import BlocoArea from "@/components/BlocoArea";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { conteudoNoIdioma } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { slugificar } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("areas-de-pesquisa", idioma).titulo, caminho: rota("areas", idioma) });
}

/**
 * Áreas de pesquisa em blocos. Os textos são os mesmos destaques da home (content/home.json),
 * para não haver duas cópias: editar uma linha de pesquisa atualiza as duas páginas.
 */
export default function AreasDePesquisa({ idioma }: { idioma: Idioma }) {
  const { home } = conteudoNoIdioma(idioma);
  const pagina = paginaPorSlug("areas-de-pesquisa", idioma);
  const areas = home.destaques.map((d) => ({ destaque: d, id: slugificar(d.titulo) }));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("areas", idioma)} titulo={pagina.titulo} descricao={pagina.descricao ?? home.secao_destaques?.texto}>
        <nav className="indice-areas" aria-label={rotulos(idioma).areas.indice}>
          {areas.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="indice-areas__link">
              {a.destaque.titulo}
            </a>
          ))}
        </nav>
      </CabecalhoPagina>
      <div className="blocos-areas">
        {areas.map((a, i) => (
          <BlocoArea key={a.id} destaque={a.destaque} idioma={idioma} numero={i + 1} id={a.id} />
        ))}
      </div>
      {pagina.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, idioma, { rebaixarTitulos: false }) }} />}
    </div>
  );
}
