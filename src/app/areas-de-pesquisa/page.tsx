import type { Metadata } from "next";
import BlocoArea from "@/components/BlocoArea";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { slugificar } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("areas-de-pesquisa").titulo, caminho: "/areas-de-pesquisa/" });
}

/**
 * Áreas de pesquisa em blocos. Os textos são os mesmos destaques da home (content/home.json),
 * para não haver duas cópias: editar uma linha de pesquisa atualiza as duas páginas.
 */
export default function AreasDePesquisa() {
  const { home } = carregarConteudo();
  const pagina = paginaPorSlug("areas-de-pesquisa");
  const areas = home.destaques.map((d) => ({ destaque: d, id: slugificar(d.titulo) }));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho="/areas-de-pesquisa/" titulo={pagina.titulo} descricao={pagina.descricao ?? home.secao_destaques?.texto}>
        <nav className="indice-areas" aria-label="Áreas desta página">
          {areas.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="indice-areas__link">
              {a.destaque.titulo}
            </a>
          ))}
        </nav>
      </CabecalhoPagina>
      <div className="blocos-areas">
        {areas.map((a, i) => (
          <BlocoArea key={a.id} destaque={a.destaque} numero={i + 1} id={a.id} />
        ))}
      </div>
      {pagina.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, { rebaixarTitulos: false }) }} />}
    </div>
  );
}
