import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import ItemNoticia from "@/components/ItemNoticia";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("noticias").titulo, descricao: "Notícias do INCT INTERAS.", caminho: "/noticias/" });
}

export default function Noticias() {
  const { noticias } = carregarConteudo();
  const pagina = paginaPorSlug("noticias");
  const categorias = [...new Set(noticias.flatMap((n) => n.categorias ?? []))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
    .map((c) => ({ chave: c, rotulo: c }));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho="/noticias/" titulo={pagina.titulo} descricao={pagina.descricao} />
      <FiltroPorCategoria
        categorias={categorias}
        classeLista="lista-noticias"
        itens={noticias.map((n) => ({ id: n.id, categorias: n.categorias ?? [], elemento: <ItemNoticia noticia={n} /> }))}
      />
    </div>
  );
}
