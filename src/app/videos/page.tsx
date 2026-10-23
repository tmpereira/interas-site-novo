import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CartaoConteudo from "@/components/CartaoConteudo";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { formatarData } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  const pagina = paginaPorSlug("videos");
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: "/videos/" });
}

export default function Videos() {
  const { videos } = carregarConteudo();
  const pagina = paginaPorSlug("videos");
  const categorias = [...new Set(videos.flatMap((v) => v.categorias))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
    .map((c) => ({ chave: c, rotulo: c }));
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Vídeos" }]} />
      <header className="cabecalho-pagina">
        <h1 className="cabecalho-pagina__titulo">{pagina.titulo}</h1>
        {pagina.descricao && <p className="cabecalho-pagina__subtitulo">{pagina.descricao}</p>}
      </header>
      <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />
      <FiltroPorCategoria
        categorias={categorias}
        classeLista="grade-cartoes"
        itens={videos.map((v) => ({
          id: v.slug,
          categorias: v.categorias,
          elemento: <CartaoConteudo href={`/videos/${v.slug}/`} imagem={v.capa} titulo={v.titulo} descricao={v.resumo} data={{ texto: formatarData(v.data), dateTime: v.data }} />,
        }))}
      />
    </div>
  );
}
