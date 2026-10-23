import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CardPessoa from "@/components/CardPessoa";
import FaixaTitulo from "@/components/FaixaTitulo";
import { equipePorCategoria, paginaPorSlug } from "@/lib/consultas";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("equipe").titulo, caminho: "/equipe/" });
}

export default function Equipe() {
  const pagina = paginaPorSlug("equipe");
  return (
    <>
      <FaixaTitulo titulo={pagina.titulo} />
      <div className="pagina">
        <Breadcrumb itens={[{ rotulo: "Coord. e Equipe" }]} />
        {equipePorCategoria().map((categoria) => (
          <section key={categoria.chave} className="secao-equipe" aria-labelledby={`equipe-${categoria.chave}`}>
            <h2 id={`equipe-${categoria.chave}`}>{categoria.titulo}</h2>
            <div className="grade-pessoas">
              {categoria.pessoas.map((p) => (
                <CardPessoa key={p.slug} pessoa={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
