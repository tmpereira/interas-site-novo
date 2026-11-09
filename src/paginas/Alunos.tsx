import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import TabelaAlunos, { type ItemAluno } from "@/components/TabelaAlunos";
import { alunosPorNivel, compararAlunos, paginaPorSlug, periodoAluno, type AlunoComOrientador } from "@/lib/consultas";
import { compararTexto } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  const pagina = paginaPorSlug("alunos", idioma);
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: rota("alunos", idioma) });
}

const emAndamento = (alunos: AlunoComOrientador[]) => alunos.filter((a) => a.situacao === "em-andamento").length;

export default function Alunos({ idioma }: { idioma: Idioma }) {
  const pagina = paginaPorSlug("alunos", idioma);
  const r = rotulos(idioma).alunos;
  const niveis = alunosPorNivel(idioma);
  const total = niveis.reduce((s, n) => s + n.alunos.length, 0);
  const totalAndamento = niveis.reduce((s, n) => s + emAndamento(n.alunos), 0);

  // Lista única para a tabela paginada: em andamento primeiro, depois os mais recentes (todos os níveis)
  const todos = niveis.flatMap((n) => n.alunos).sort(compararAlunos(idioma));
  const itens: ItemAluno[] = todos.map((a) => ({
    nome: a.nome,
    nivel: a.nivel,
    situacao: a.situacao,
    periodo: periodoAluno(a, idioma),
    instituicao: a.instituicao ?? null,
    titulo: a.titulo ?? null,
    coorientacao: a.coorientacao ?? null,
    orientador: a.orientador,
    orientadorNome: a.pessoaOrientadora.nome,
    orientadorLink: rota("equipe", idioma, a.orientador),
  }));
  const ordemTexto = compararTexto(idioma);
  const orientadores = [...new Map(todos.map((a) => [a.orientador, a.pessoaOrientadora.nome])).entries()]
    .map(([slug, nome]) => ({ slug, nome }))
    .sort((a, b) => ordemTexto(a.nome, b.nome));
  const instituicoes = [...new Set(todos.map((a) => a.instituicao).filter((i): i is string => Boolean(i)))].sort(ordemTexto);
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("alunos", idioma)} titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, idioma) }} />}
      </CabecalhoPagina>

      <section className="secao-alunos" aria-labelledby="alunos-resumo">
        <h2 id="alunos-resumo" className="secao-alunos__titulo">
          {r.resumo}
        </h2>
        <div className="tabela-alunos__rolagem">
          <table className="tabela-alunos tabela-alunos--resumo">
            <thead>
              <tr>
                <th scope="col">{r.nivel}</th>
                <th scope="col" className="tabela-alunos__numero">{r.emAndamento}</th>
                <th scope="col" className="tabela-alunos__numero">{r.concluidos}</th>
                <th scope="col" className="tabela-alunos__numero">{r.total}</th>
              </tr>
            </thead>
            <tbody>
              {niveis.map((n) => (
                <tr key={n.nivel}>
                  <th scope="row">
                    <a href={`#alunos-${n.nivel}`}>{n.titulo}</a>
                  </th>
                  <td className="tabela-alunos__numero">{emAndamento(n.alunos)}</td>
                  <td className="tabela-alunos__numero">{n.alunos.length - emAndamento(n.alunos)}</td>
                  <td className="tabela-alunos__numero">{n.alunos.length}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{r.total}</th>
                <td className="tabela-alunos__numero">{totalAndamento}</td>
                <td className="tabela-alunos__numero">{total - totalAndamento}</td>
                <td className="tabela-alunos__numero">{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <TabelaAlunos
        idioma={idioma}
        itens={itens}
        niveis={niveis.map((n) => ({ nivel: n.nivel, titulo: n.titulo }))}
        orientadores={orientadores}
        instituicoes={instituicoes}
      />
    </div>
  );
}
