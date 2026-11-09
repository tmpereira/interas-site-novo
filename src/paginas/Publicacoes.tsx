import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import FiltroPublicacoes, { type ItemPublicacao } from "@/components/FiltroPublicacoes";
import ListaPatentes from "@/components/ListaPatentes";
import { conteudoNoIdioma } from "@/lib/conteudo";
import { paginaPorSlug, paisesEstrangeiros } from "@/lib/consultas";
import { formatarData } from "@/lib/formatadores";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  const pagina = paginaPorSlug("publicacoes", idioma);
  return metadadosPagina({ titulo: pagina.titulo, descricao: rotulos(idioma).publicacoes.descricaoPagina, caminho: rota("publicacoes", idioma) });
}

export default function Publicacoes({ idioma }: { idioma: Idioma }) {
  const { publicacoes, patentes, grupos, pessoas } = conteudoNoIdioma(idioma);
  const pagina = paginaPorSlug("publicacoes", idioma);
  const r = rotulos(idioma).publicacoes;

  // Dados de cada publicação para a lista com filtros (o resumo aparece ao expandir o cartão)
  const itens: ItemPublicacao[] = publicacoes.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    tituloHtml: markdownEmLinha(p.titulo, idioma),
    autores: p.autores,
    ano: p.ano,
    data: p.data,
    dataTexto: formatarData(p.data, idioma),
    resumoHtml: p.resumo ? markdownParaHtml(p.resumo, idioma) : null,
    periodico: p.periodico,
    volume: p.volume,
    numero: p.numero,
    paginas: p.paginas,
    grupos: p.grupos,
    citacoes: p.citacoes,
    fator_impacto: p.fator_impacto,
    qualis: p.qualis,
    doi: p.doi,
    internacional: p.colaboracao_internacional ?? null,
    paises: paisesEstrangeiros(idioma, p.paises),
  }));
  const gruposComPublicacao = grupos.filter((g) => publicacoes.some((p) => p.grupos.includes(g.slug))).map((g) => ({ slug: g.slug, titulo: g.titulo }));

  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("publicacoes", idioma)} titulo={pagina.titulo} descricao={pagina.descricao}>
        <dl className="numeros-producao">
          <div className="numeros-producao__item">
            <dt>{r.artigos}</dt>
            <dd>{publicacoes.length}</dd>
          </div>
          <div className="numeros-producao__item">
            <dt>{r.patentesSoftwares}</dt>
            <dd>{patentes.length}</dd>
          </div>
          <div className="numeros-producao__item">
            <dt>{r.pessoasEquipe}</dt>
            <dd>{pessoas.filter((p) => p.ativo).length}</dd>
          </div>
        </dl>
      </CabecalhoPagina>

      <section id="artigos" className="secao-producao">
        <FiltroPublicacoes idioma={idioma} titulo={(pagina.titulo_artigos as string | undefined) ?? r.artigos} itens={itens} grupos={gruposComPublicacao} />
      </section>

      <section id="patentes" className="secao-producao">
        <h2 className="secao-producao__titulo">{(pagina.titulo_patentes as string | undefined) ?? r.patentesSoftwares}</h2>
        <ListaPatentes patentes={patentes} idioma={idioma} />
      </section>
    </div>
  );
}
