import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CartaoConteudo from "@/components/CartaoConteudo";
import FaixaTitulo from "@/components/FaixaTitulo";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownParaHtml, truncarTexto } from "@/lib/markdown";

export function generateMetadata(): Metadata {
  return { title: paginaPorSlug("grupos").titulo, description: "Grupos de pesquisa e laboratórios do INCT INTERAS." };
}

export default function Grupos() {
  const { grupos, site } = carregarConteudo();
  const pagina = paginaPorSlug("grupos");
  const rotulo = new Map(site.temas_grupos.map((t) => [t.slug, t.rotulo]));
  return (
    <>
      <FaixaTitulo titulo={pagina.titulo} />
      <div className="pagina">
        <Breadcrumb itens={[{ rotulo: "Grupos e Laboratórios" }]} />
        <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />
        <FiltroPorCategoria
          lerDaUrl
          categorias={site.temas_grupos.map((t) => ({ chave: t.slug, rotulo: t.rotulo }))}
          classeLista="grade-cartoes"
          itens={grupos.map((g) => ({
            id: g.slug,
            categorias: g.temas,
            elemento: (
              <CartaoConteudo
                href={`/grupos/${g.slug}/`}
                imagem={g.imagem}
                imagemAlta
                titulo={g.titulo}
                etiquetas={g.temas.map((t) => rotulo.get(t) ?? t)}
                descricao={g.resumo ? truncarTexto(g.resumo, 200) : null}
              />
            ),
          }))}
        />
      </div>
    </>
  );
}
