import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import FiltroPublicacoes, { type ItemPublicacao } from "@/components/FiltroPublicacoes";
import ListaPatentes from "@/components/ListaPatentes";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { formatarData } from "@/lib/formatadores";
import { markdownEmLinha } from "@/lib/markdown";

export function generateMetadata(): Metadata {
  const pagina = paginaPorSlug("publicacoes");
  return { title: pagina.titulo, description: "Artigos, patentes e softwares do INCT INTERAS." };
}

export default function Publicacoes() {
  const { publicacoes, patentes, grupos } = carregarConteudo();
  const pagina = paginaPorSlug("publicacoes");

  // Dados mínimos de cada publicação para a lista com filtros (o resumo não vai para o navegador)
  const itens: ItemPublicacao[] = publicacoes.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    tituloHtml: markdownEmLinha(p.titulo),
    autores: p.autores.join(", "),
    primeiroAutor: p.autores[0] ?? "",
    ano: p.ano,
    dataExibida: formatarData(p.data),
    data: p.data,
    periodico: p.periodico,
    grupos: p.grupos,
    citacoes: p.citacoes,
    fator_impacto: p.fator_impacto,
    qualis: p.qualis,
  }));
  const gruposComPublicacao = grupos.filter((g) => publicacoes.some((p) => p.grupos.includes(g.slug))).map((g) => ({ slug: g.slug, titulo: g.titulo }));

  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Publicações" }]} />
      <h1 className="somente-leitor">{pagina.titulo}</h1>

      <section id="artigos" className="secao-producao">
        <h2 className="secao-producao__titulo">{(pagina.titulo_artigos as string | undefined) ?? "Artigos"}</h2>
        <FiltroPublicacoes itens={itens} grupos={gruposComPublicacao} />
      </section>

      <section id="patentes" className="secao-producao">
        <h2 className="secao-producao__titulo">{(pagina.titulo_patentes as string | undefined) ?? "Patentes e softwares"}</h2>
        <ListaPatentes patentes={patentes} />
      </section>
    </div>
  );
}
