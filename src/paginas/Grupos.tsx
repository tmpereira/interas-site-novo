import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import ItemGrupo from "@/components/ItemGrupo";
import { conteudoNoIdioma } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("grupos", idioma).titulo, descricao: rotulos(idioma).grupos.descricaoPagina, caminho: rota("grupos", idioma) });
}

export default function Grupos({ idioma }: { idioma: Idioma }) {
  const { grupos, site, pessoas } = conteudoNoIdioma(idioma);
  const pagina = paginaPorSlug("grupos", idioma);
  const rotulo = new Map(site.temas_grupos.map((t) => [t.slug, t.rotulo]));
  const nomes = new Map(pessoas.map((p) => [p.slug, p.nome]));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("grupos", idioma)} sobretitulo={rotulos(idioma).grupos.sobretitulo} titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, idioma) }} />}
      </CabecalhoPagina>
      <FiltroPorCategoria
        idioma={idioma}
        lerDaUrl
        categorias={site.temas_grupos.map((t) => ({ chave: t.slug, rotulo: t.rotulo }))}
        classeLista="lista-grupos"
        itens={grupos.map((g) => ({
          id: g.slug,
          categorias: g.temas,
          elemento: <ItemGrupo grupo={g} idioma={idioma} rotulos={rotulo} coordenacao={g.coordenacao.map((c) => nomes.get(c) ?? c)} />,
        }))}
      />
    </div>
  );
}
