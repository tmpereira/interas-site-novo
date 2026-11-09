import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { alunosPorNivel, paginaPorSlug, type AlunoComOrientador } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import type { Rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  const pagina = paginaPorSlug("alunos");
  return metadadosPagina({ titulo: pagina.titulo, descricao: pagina.descricao, caminho: rota("alunos", idioma) });
}

const emAndamento = (alunos: AlunoComOrientador[]) => alunos.filter((a) => a.situacao === "em-andamento").length;

/** "2021–2024", "desde 2024", "2024" ou "—". */
function periodo(a: AlunoComOrientador, r: Rotulos["alunos"]): string {
  if (a.situacao === "em-andamento") return a.ano_inicio ? r.desde(a.ano_inicio) : "—";
  if (a.ano_inicio && a.ano_conclusao && a.ano_inicio !== a.ano_conclusao) return `${a.ano_inicio}–${a.ano_conclusao}`;
  return String(a.ano_conclusao ?? a.ano_inicio ?? "—");
}

export default function Alunos({ idioma }: { idioma: Idioma }) {
  const pagina = paginaPorSlug("alunos");
  const r = rotulos(idioma).alunos;
  const niveis = alunosPorNivel(idioma);
  const total = niveis.reduce((s, n) => s + n.alunos.length, 0);
  const totalAndamento = niveis.reduce((s, n) => s + emAndamento(n.alunos), 0);
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("alunos", idioma)} titulo={pagina.titulo} descricao={pagina.descricao}>
        {pagina.conteudo && <div className="cabecalho-pagina__texto texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo) }} />}
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

      {niveis.map((n) => (
        <section key={n.nivel} id={`alunos-${n.nivel}`} className="secao-alunos" aria-labelledby={`alunos-${n.nivel}-titulo`}>
          <h2 id={`alunos-${n.nivel}-titulo`} className="secao-alunos__titulo">
            {n.titulo} <span className="secao-alunos__contagem">({n.alunos.length})</span>
          </h2>
          <div className="tabela-alunos__rolagem">
            <table className="tabela-alunos">
              <thead>
                <tr>
                  <th scope="col">{r.nome}</th>
                  <th scope="col">{r.orientacao}</th>
                  <th scope="col">{r.situacao}</th>
                  <th scope="col">{r.periodo}</th>
                  <th scope="col">{r.instituicao}</th>
                  <th scope="col">{r.tituloTrabalho}</th>
                </tr>
              </thead>
              <tbody>
                {n.alunos.map((a, i) => (
                  <tr key={`${a.nome}-${a.orientador}-${i}`}>
                    <th scope="row" className="tabela-alunos__nome">{a.nome}</th>
                    <td>
                      <Link href={rota("equipe", idioma, a.orientador)}>{a.pessoaOrientadora.nome}</Link>
                      {a.coorientacao && <span className="tabela-alunos__coorientacao">{r.coorientacao(a.coorientacao)}</span>}
                    </td>
                    <td>
                      <span className={`situacao-aluno situacao-aluno--${a.situacao}`}>
                        {a.situacao === "em-andamento" ? r.situacaoEmAndamento : r.situacaoConcluida}
                      </span>
                    </td>
                    <td className="tabela-alunos__periodo">{periodo(a, r)}</td>
                    <td>{a.instituicao ?? "—"}</td>
                    <td className="tabela-alunos__titulo-trabalho">{a.titulo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
