import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import CardPessoa from "@/components/CardPessoa";
import { equipePorCategoria, paginaPorSlug } from "@/lib/consultas";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";

export function metadados(idioma: Idioma): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("equipe").titulo, caminho: rota("equipe", idioma) });
}

export default function Equipe({ idioma }: { idioma: Idioma }) {
  const pagina = paginaPorSlug("equipe");
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("equipe", idioma)} titulo={pagina.titulo} descricao={pagina.descricao} />
      {equipePorCategoria().map((categoria) => {
        const destaque = categoria.chave === "coordenacao";
        return (
          <section key={categoria.chave} className="secao-equipe" aria-labelledby={`equipe-${categoria.chave}`}>
            <h2 id={`equipe-${categoria.chave}`} className="secao-equipe__titulo">
              {categoria.titulo}
            </h2>
            <div className={destaque ? "grade-pessoas grade-pessoas--destaque" : "grade-pessoas"}>
              {categoria.pessoas.map((p) => (
                <CardPessoa key={p.slug} pessoa={p} idioma={idioma} destaque={destaque} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
