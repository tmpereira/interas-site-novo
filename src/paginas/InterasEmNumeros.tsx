import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import GraficoBarras from "@/components/GraficoBarras";
import PainelColaboracao from "@/components/PainelColaboracao";
import { estatisticas, paginaPorSlug } from "@/lib/consultas";
import { mapaInternacional } from "@/lib/internacional";
import { markdownParaHtml } from "@/lib/markdown";
import { formatarNumero } from "@/lib/formatadores";
import { rotulos } from "@/lib/i18n/rotulos";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { redeCoautoria } from "@/lib/rede";

export function metadados(idioma: Idioma): Metadata {
  const pagina = paginaPorSlug("interas-em-numeros", idioma);
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: rota("numeros", idioma) });
}

export default function InterasEmNumeros({ idioma }: { idioma: Idioma }) {
  const pagina = paginaPorSlug("interas-em-numeros", idioma);
  const r = rotulos(idioma).numeros;
  const inteiro = (n: number) => formatarNumero(n, idioma);
  const e = estatisticas(idioma);
  const { resumo } = e;
  const maximoAlunos = Math.max(...e.alunosPorNivel.flatMap((n) => n.pontos.map((p) => p.valor)), 1);

  const notaJcr = [
    ...e.jcrIncompleto.map((a) => r.jcrIncompleto(a.ano, a.com, a.total)),
    ...(e.artigosPorAno.length > e.jcrPorAno.length ? [r.jcrAnosSemBarra] : []),
  ].join("; ");

  const cartoes = [
    { rotulo: r.artigosPublicados, valor: inteiro(resumo.artigos) },
    { rotulo: r.patentesSoftwares, valor: inteiro(resumo.patentes) },
    { rotulo: r.citacoes, valor: inteiro(resumo.citacoes), nota: resumo.artigosComCitacoes < resumo.artigos ? r.comDados(resumo.artigosComCitacoes) : undefined },
    {
      rotulo: r.jcrMedio,
      valor: resumo.jcrMedio === null ? "—" : formatarNumero(resumo.jcrMedio, idioma, 2),
      nota: resumo.artigosComJcr < resumo.artigos ? r.comDados(resumo.artigosComJcr) : undefined,
    },
    { rotulo: r.alunosFormados, valor: inteiro(resumo.alunosFormados), nota: r.alunosFormadosNota },
    { rotulo: r.membrosEquipe, valor: inteiro(resumo.equipe) },
  ];

  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("numeros", idioma)} titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, idioma) }} />}
      </CabecalhoPagina>

      <dl className="numeros-interas">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="numeros-interas__item">
            <dt>{c.rotulo}</dt>
            <dd>
              <span className="numeros-interas__valor">{c.valor}</span>
              {c.nota && <span className="numeros-interas__nota">{c.nota}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <section className="secao-numeros" aria-labelledby="numeros-producao">
        <h2 id="numeros-producao" className="secao-numeros__titulo">
          {r.producao}
        </h2>
        <div className="secao-numeros__grade">
          <GraficoBarras
            idioma={idioma}
            titulo={r.artigosPorAno}
            descricao={r.artigosPorAnoDescricao}
            pontos={e.artigosPorAno}
            unidade={r.unidadeArtigos}
            nota={r.anoEmAndamento(e.anoAtual)}
          />
          <GraficoBarras
            idioma={idioma}
            titulo={r.jcrPorAno}
            descricao={r.jcrPorAnoDescricao}
            pontos={e.jcrPorAno}
            unidade={r.unidadeJcr}
            casasDecimais={2}
            nota={notaJcr ? `${notaJcr[0].toUpperCase()}${notaJcr.slice(1)}.` : undefined}
          />
          <GraficoBarras
            idioma={idioma}
            titulo={r.citacoesPorAno}
            descricao={r.citacoesPorAnoDescricao}
            pontos={e.citacoesPorAno}
            unidade={r.unidadeCitacoes}
            nota={r.citacoesNota}
          />
        </div>
      </section>

      <section className="secao-numeros" aria-labelledby="numeros-alunos">
        <h2 id="numeros-alunos" className="secao-numeros__titulo">
          {r.alunosPorAno}
        </h2>
        <div className="secao-numeros__grade secao-numeros__grade--multiplos">
          {e.alunosPorNivel.map((n) => (
            <GraficoBarras key={n.nivel} idioma={idioma} titulo={n.titulo} pontos={n.pontos} unidade={r.unidadeConcluidos} maximo={maximoAlunos} compacto />
          ))}
        </div>
        <p className="secao-numeros__nota">{r.alunosNota}</p>
      </section>

      <PainelColaboracao idioma={idioma} rede={redeCoautoria()} mapa={mapaInternacional(idioma)} />
    </div>
  );
}
