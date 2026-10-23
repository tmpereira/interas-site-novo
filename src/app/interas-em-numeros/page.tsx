import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import GraficoBarras from "@/components/GraficoBarras";
import PainelColaboracao from "@/components/PainelColaboracao";
import { estatisticas, paginaPorSlug } from "@/lib/consultas";
import { mapaInternacional } from "@/lib/internacional";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { redeCoautoria } from "@/lib/rede";

export function generateMetadata(): Metadata {
  const pagina = paginaPorSlug("interas-em-numeros");
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: "/interas-em-numeros/" });
}

const inteiro = (n: number) => n.toLocaleString("pt-BR");

export default function InterasEmNumeros() {
  const pagina = paginaPorSlug("interas-em-numeros");
  const e = estatisticas();
  const { resumo } = e;
  const maximoAlunos = Math.max(...e.alunosPorNivel.flatMap((n) => n.pontos.map((p) => p.valor)), 1);

  const notaJcr = [
    ...e.jcrIncompleto.map((a) => `em ${a.ano}, ${a.com} de ${a.total} artigos têm JCR`),
    ...(e.artigosPorAno.length > e.jcrPorAno.length ? ["anos sem barra ainda não têm JCR preenchido"] : []),
  ].join("; ");

  const cartoes = [
    { rotulo: "Artigos publicados", valor: inteiro(resumo.artigos) },
    { rotulo: "Patentes e softwares", valor: inteiro(resumo.patentes) },
    { rotulo: "Citações", valor: inteiro(resumo.citacoes), nota: resumo.artigosComCitacoes < resumo.artigos ? `em ${resumo.artigosComCitacoes} artigos com dados` : undefined },
    {
      rotulo: "JCR médio",
      valor: resumo.jcrMedio === null ? "—" : resumo.jcrMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      nota: resumo.artigosComJcr < resumo.artigos ? `em ${resumo.artigosComJcr} artigos com dados` : undefined,
    },
    { rotulo: "Alunos formados", valor: inteiro(resumo.alunosFormados), nota: "IC, mestrado, doutorado e pós-doc" },
    { rotulo: "Membros da equipe", valor: inteiro(resumo.equipe) },
  ];

  return (
    <div className="pagina">
      <CabecalhoPagina caminho="/interas-em-numeros/" titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />}
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
          Produção científica
        </h2>
        <div className="secao-numeros__grade">
          <GraficoBarras
            titulo="Artigos por ano"
            descricao="Artigos em periódicos, pelo ano de publicação"
            pontos={e.artigosPorAno}
            unidade="artigos"
            nota={`${e.anoAtual}: ano em andamento.`}
          />
          <GraficoBarras titulo="JCR médio por ano" descricao="Média do fator de impacto das revistas" pontos={e.jcrPorAno} unidade="de JCR médio" casasDecimais={2} nota={notaJcr ? `${notaJcr[0].toUpperCase()}${notaJcr.slice(1)}.` : undefined} />
          <GraficoBarras
            titulo="Citações por ano de publicação"
            descricao="Soma das citações dos artigos publicados em cada ano"
            pontos={e.citacoesPorAno}
            unidade="citações"
            nota="Artigos mais recentes tiveram menos tempo para ser citados."
          />
        </div>
      </section>

      <section className="secao-numeros" aria-labelledby="numeros-alunos">
        <h2 id="numeros-alunos" className="secao-numeros__titulo">
          Alunos formados por ano
        </h2>
        <div className="secao-numeros__grade secao-numeros__grade--multiplos">
          {e.alunosPorNivel.map((n) => (
            <GraficoBarras key={n.nivel} titulo={n.titulo} pontos={n.pontos} unidade="concluídos" maximo={maximoAlunos} compacto />
          ))}
        </div>
        <p className="secao-numeros__nota">Orientações concluídas pelos pesquisadores do INTERAS, pelo ano de conclusão. Os quatro gráficos usam a mesma escala.</p>
      </section>

      <PainelColaboracao rede={redeCoautoria()} mapa={mapaInternacional()} />
    </div>
  );
}
