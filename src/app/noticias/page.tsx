import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import FaixaTitulo from "@/components/FaixaTitulo";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import ItemNoticia from "@/components/ItemNoticia";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";

export function generateMetadata(): Metadata {
  return { title: paginaPorSlug("noticias").titulo, description: "Notícias do INCT INTERAS." };
}

export default function Noticias() {
  const { noticias } = carregarConteudo();
  const pagina = paginaPorSlug("noticias");
  const categorias = [...new Set(noticias.flatMap((n) => n.categorias ?? []))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
    .map((c) => ({ chave: c, rotulo: c }));
  return (
    <>
      <FaixaTitulo titulo={pagina.titulo} />
      <div className="pagina">
        <Breadcrumb itens={[{ rotulo: "Notícias" }]} />
        <FiltroPorCategoria
          categorias={categorias}
          classeLista="lista-noticias"
          itens={noticias.map((n) => ({ id: n.id, categorias: n.categorias ?? [], elemento: <ItemNoticia noticia={n} /> }))}
        />
      </div>
    </>
  );
}
