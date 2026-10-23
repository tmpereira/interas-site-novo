import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import ItemGrupo from "@/components/ItemGrupo";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("grupos").titulo, descricao: "Grupos de pesquisa e laboratórios do INCT INTERAS.", caminho: "/grupos/" });
}

export default function Grupos() {
  const { grupos, site, pessoas } = carregarConteudo();
  const pagina = paginaPorSlug("grupos");
  const rotulo = new Map(site.temas_grupos.map((t) => [t.slug, t.rotulo]));
  const nomes = new Map(pessoas.map((p) => [p.slug, p.nome]));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho="/grupos/" sobretitulo="Grupos e laboratórios" titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />}
      </CabecalhoPagina>
      <FiltroPorCategoria
        lerDaUrl
        categorias={site.temas_grupos.map((t) => ({ chave: t.slug, rotulo: t.rotulo }))}
        classeLista="lista-grupos"
        itens={grupos.map((g) => ({
          id: g.slug,
          categorias: g.temas,
          elemento: <ItemGrupo grupo={g} rotulos={rotulo} coordenacao={g.coordenacao.map((c) => nomes.get(c) ?? c)} />,
        }))}
      />
    </div>
  );
}
