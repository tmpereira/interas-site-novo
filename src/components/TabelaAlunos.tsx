"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizarBusca } from "@/lib/formatadores";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import Paginacao, { usePaginacao } from "./Paginacao";

/** Dados de cada orientação enviados ao navegador (já ordenados e formatados no servidor). */
export type ItemAluno = {
  nome: string;
  nivel: string;
  situacao: "em-andamento" | "concluida";
  /** Período já formatado ("2021–2024", "desde 2024"...). */
  periodo: string;
  instituicao: string | null;
  titulo: string | null;
  coorientacao: string | null;
  orientador: string;
  orientadorNome: string;
  orientadorLink: string;
};

type Props = {
  idioma: Idioma;
  itens: ItemAluno[];
  /** Níveis na ordem de exibição, com o título no idioma. */
  niveis: { nivel: string; titulo: string }[];
  /** Orientadores presentes na lista, já em ordem alfabética. */
  orientadores: { slug: string; nome: string }[];
  /** Instituições presentes na lista, já em ordem alfabética. */
  instituicoes: string[];
};

/** Prefixo das âncoras da tabela-resumo (`#alunos-mestrado`): abrem a lista já filtrada pelo nível. */
const PREFIXO_ANCORA = "#alunos-";

export default function TabelaAlunos({ idioma, itens, niveis, orientadores, instituicoes }: Props) {
  const r = rotulos(idioma);
  const t = r.alunos;
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("");
  const [orientador, setOrientador] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const secao = useRef<HTMLElement>(null);
  const inicioLista = useRef<HTMLParagraphElement>(null);

  // Links da tabela-resumo (#alunos-<nível>) filtram a lista pelo nível e rolam até ela
  useEffect(() => {
    const lerAncora = () => {
      const hash = decodeURIComponent(window.location.hash);
      if (!hash.startsWith(PREFIXO_ANCORA)) return;
      const escolhido = hash.slice(PREFIXO_ANCORA.length);
      if (!niveis.some((n) => n.nivel === escolhido)) return;
      setNivel(escolhido);
      secao.current?.scrollIntoView({ block: "start" });
    };
    const quadro = requestAnimationFrame(lerAncora);
    window.addEventListener("hashchange", lerAncora);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("hashchange", lerAncora);
    };
  }, [niveis]);

  const indiceBusca = useMemo(() => itens.map((i) => normalizarBusca(i.nome)), [itens]);
  const titulosNivel = useMemo(() => new Map(niveis.map((n) => [n.nivel, n.titulo])), [niveis]);

  const visiveis = useMemo(() => {
    const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
    return itens.filter((i, k) => {
      if (nivel && i.nivel !== nivel) return false;
      if (orientador && i.orientador !== orientador) return false;
      if (instituicao && i.instituicao !== instituicao) return false;
      return termos.every((termo) => indiceBusca[k].includes(termo));
    });
  }, [itens, indiceBusca, busca, nivel, orientador, instituicao]);

  // A página volta para a 1 sempre que um filtro muda
  const chaveFiltros = JSON.stringify([busca, nivel, orientador, instituicao]);
  const { daPagina, primeiro, pagina, totalPaginas, porPagina, setPorPagina, irPara } = usePaginacao(visiveis, chaveFiltros, () =>
    inicioLista.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );

  const filtrando = Boolean(busca || nivel || orientador || instituicao);
  const limpar = () => {
    setBusca("");
    setNivel("");
    setOrientador("");
    setInstituicao("");
  };

  return (
    <section ref={secao} id="alunos-lista" className="secao-alunos" aria-labelledby="alunos-lista-titulo">
      <div className="filtro-publicacoes__topo">
        <h2 id="alunos-lista-titulo" className="secao-alunos__titulo">
          {t.lista}
        </h2>
        <div className="filtro-publicacoes__anos" role="group" aria-label={t.filtrarNivel}>
          <button type="button" className="filtro-publicacoes__ano" aria-pressed={nivel === ""} onClick={() => setNivel("")}>
            {r.comum.todos}
          </button>
          {niveis.map((n) => (
            <button key={n.nivel} type="button" className="filtro-publicacoes__ano" aria-pressed={nivel === n.nivel} onClick={() => setNivel(n.nivel)}>
              {n.titulo}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro-publicacoes__controles">
        <label className="filtro-publicacoes__campo filtro-publicacoes__campo--busca">
          <span className="filtro-publicacoes__rotulo">{t.buscarNome}</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.digite} className="filtro-publicacoes__entrada" />
        </label>
        <label className="filtro-publicacoes__campo">
          <span className="filtro-publicacoes__rotulo">{t.orientador}</span>
          <select value={orientador} onChange={(e) => setOrientador(e.target.value)} className="filtro-publicacoes__entrada">
            <option value="">{r.comum.todos}</option>
            {orientadores.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro-publicacoes__campo">
          <span className="filtro-publicacoes__rotulo">{t.instituicao}</span>
          <select value={instituicao} onChange={(e) => setInstituicao(e.target.value)} className="filtro-publicacoes__entrada">
            <option value="">{r.comum.todos}</option>
            {instituicoes.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p ref={inicioLista} className="filtro-publicacoes__contagem" aria-live="polite">
        {visiveis.length === itens.length ? t.contagem(itens.length) : t.contagemFiltrada(visiveis.length, itens.length)}
        {totalPaginas > 1 && t.mostrando(primeiro + 1, primeiro + daPagina.length)}
        {filtrando && (
          <button type="button" className="filtro-publicacoes__limpar" onClick={limpar}>
            {t.limpar}
          </button>
        )}
      </p>

      {visiveis.length === 0 ? (
        <p className="filtro-publicacoes__vazio">{t.vazio}</p>
      ) : (
        <div className="tabela-alunos__rolagem">
          <table className="tabela-alunos">
            <thead>
              <tr>
                <th scope="col">{t.nome}</th>
                <th scope="col">{t.nivel}</th>
                <th scope="col">{t.orientacao}</th>
                <th scope="col">{t.situacao}</th>
                <th scope="col">{t.periodo}</th>
                <th scope="col">{t.instituicao}</th>
                <th scope="col">{t.tituloTrabalho}</th>
              </tr>
            </thead>
            <tbody>
              {daPagina.map((a, k) => (
                <tr key={`${primeiro + k}-${a.nome}`}>
                  <th scope="row" className="tabela-alunos__nome">{a.nome}</th>
                  <td className="tabela-alunos__nivel">{titulosNivel.get(a.nivel)}</td>
                  <td>
                    <Link href={a.orientadorLink}>{a.orientadorNome}</Link>
                    {a.coorientacao && <span className="tabela-alunos__coorientacao">{t.coorientacao(a.coorientacao)}</span>}
                  </td>
                  <td>
                    <span className={`situacao-aluno situacao-aluno--${a.situacao}`}>{a.situacao === "em-andamento" ? t.situacaoEmAndamento : t.situacaoConcluida}</span>
                  </td>
                  <td className="tabela-alunos__periodo">{a.periodo}</td>
                  <td>{a.instituicao ?? "—"}</td>
                  <td className="tabela-alunos__titulo-trabalho">{a.titulo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visiveis.length > 0 && (
        <Paginacao
          idioma={idioma}
          pagina={pagina}
          totalPaginas={totalPaginas}
          porPagina={porPagina}
          aoMudarPagina={irPara}
          aoMudarPorPagina={setPorPagina}
          rotuloPorPagina={t.porPagina}
          rotuloPaginas={t.paginas}
          opcoes={[10, 20, 50]}
        />
      )}
    </section>
  );
}
