"use client";

import { useRef } from "react";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import Paginacao, { usePaginacao } from "./Paginacao";

/** Uma orientação do perfil, já formatada no servidor. */
export type ItemOrientacao = {
  nome: string;
  /** Título do nível no idioma ("Mestrado"). */
  nivel: string;
  situacao: "em-andamento" | "concluida";
  /** Período já formatado ("2021–2024", "desde 2024"...). */
  periodo: string;
  titulo: string | null;
};

/**
 * Tabela de orientações do perfil, no mesmo formato da página Alunos (TabelaAlunos):
 * nome, nível, situação, período e título do trabalho, 10 por página.
 */
export default function TabelaOrientacoes({ idioma, itens, rotuloPaginas }: { idioma: Idioma; itens: ItemOrientacao[]; rotuloPaginas: string }) {
  const t = rotulos(idioma).alunos;
  const tabela = useRef<HTMLDivElement>(null);
  const p = usePaginacao(itens, "", () => tabela.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  return (
    <>
      <div ref={tabela} className="tabela-alunos__rolagem">
        <table className="tabela-alunos">
          <thead>
            <tr>
              <th scope="col">{t.nome}</th>
              <th scope="col">{t.nivel}</th>
              <th scope="col">{t.situacao}</th>
              <th scope="col">{t.periodo}</th>
              <th scope="col">{t.tituloTrabalho}</th>
            </tr>
          </thead>
          <tbody>
            {p.daPagina.map((a, k) => (
              <tr key={`${p.primeiro + k}-${a.nome}`}>
                <th scope="row" className="tabela-alunos__nome">
                  {a.nome}
                </th>
                <td className="tabela-alunos__nivel">{a.nivel}</td>
                <td>
                  <span className={`situacao-aluno situacao-aluno--${a.situacao}`}>{a.situacao === "em-andamento" ? t.situacaoEmAndamento : t.situacaoConcluida}</span>
                </td>
                <td className="tabela-alunos__periodo">{a.periodo}</td>
                <td className="tabela-alunos__titulo-trabalho">{a.titulo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {itens.length > 10 && (
        <Paginacao
          idioma={idioma}
          pagina={p.pagina}
          totalPaginas={p.totalPaginas}
          porPagina={p.porPagina}
          aoMudarPagina={p.irPara}
          aoMudarPorPagina={p.setPorPagina}
          rotuloPorPagina={rotulos(idioma).perfil.orientacoesPorPagina}
          rotuloPaginas={rotuloPaginas}
          opcoes={[10, 20, 50]}
        />
      )}
    </>
  );
}
