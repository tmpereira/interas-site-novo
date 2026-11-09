import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import CartaoConteudo from "@/components/CartaoConteudo";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { compararTexto, formatarData } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";

export function metadados(idioma: Idioma): Metadata {
  const pagina = paginaPorSlug("videos");
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: rota("videos", idioma) });
}

export default function Videos({ idioma }: { idioma: Idioma }) {
  const { videos } = carregarConteudo();
  const pagina = paginaPorSlug("videos");
  const categorias = [...new Set(videos.flatMap((v) => v.categorias))]
    .sort(compararTexto(idioma))
    .map((c) => ({ chave: c, rotulo: c }));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("videos", idioma)} titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />}
      </CabecalhoPagina>
      <FiltroPorCategoria
        idioma={idioma}
        categorias={categorias}
        classeLista="grade-cartoes"
        itens={videos.map((v) => ({
          id: v.slug,
          categorias: v.categorias,
          elemento: <CartaoConteudo video href={rota("videos", idioma, v.slug)} imagem={v.capa} titulo={v.titulo} descricao={v.resumo} data={{ texto: formatarData(v.data, idioma), dateTime: v.data }} />,
        }))}
      />
    </div>
  );
}
