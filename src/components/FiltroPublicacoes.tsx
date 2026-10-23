"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { normalizarBusca } from "@/lib/formatadores";

/** Dados mínimos de cada publicação enviados ao navegador (sem o resumo). */
export type ItemPublicacao = {
  id: string;
  /** Título já convertido de Markdown em linha para HTML. */
  tituloHtml: string;
  titulo: string;
  autores: string;
  primeiroAutor: string;
  ano: number;
  dataExibida: string;
  data: string;
  periodico: string | null;
  grupos: string[];
  citacoes: number | null;
  fator_impacto: number | null;
  qualis: string | null;
};

type Props = {
  itens: ItemPublicacao[];
  grupos: { slug: string; titulo: string }[];
};

type Ordem = "recentes" | "antigos" | "titulo" | "autor" | "citacoes" | "impacto";

const comparaTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

export default function FiltroPublicacoes({ itens, grupos }: Props) {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("");
  const [grupo, setGrupo] = useState("");
  const [qualis, setQualis] = useState("");
  const [minCitacoes, setMinCitacoes] = useState("");
  const [minImpacto, setMinImpacto] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  // Os controles de métricas só aparecem quando há algum valor preenchido
  const temCitacoes = itens.some((i) => i.citacoes !== null);
  const temImpacto = itens.some((i) => i.fator_impacto !== null);
  const valoresQualis = useMemo(() => [...new Set(itens.map((i) => i.qualis).filter((q): q is string => Boolean(q)))].sort(), [itens]);
  const anos = useMemo(() => [...new Set(itens.map((i) => i.ano))].sort((a, b) => b - a), [itens]);
  const indiceBusca = useMemo(() => new Map(itens.map((i) => [i.id, normalizarBusca(`${i.titulo} ${i.autores} ${i.periodico ?? ""}`)])), [itens]);

  const visiveis = useMemo(() => {
    const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
    const lista = itens.filter((i) => {
      if (ano && String(i.ano) !== ano) return false;
      if (grupo && !i.grupos.includes(grupo)) return false;
      if (qualis && i.qualis !== qualis) return false;
      if (minCitacoes && (i.citacoes ?? -1) < Number(minCitacoes)) return false;
      if (minImpacto && (i.fator_impacto ?? -1) < Number(minImpacto)) return false;
      const texto = indiceBusca.get(i.id) ?? "";
      return termos.every((t) => texto.includes(t));
    });
    const porData = (a: ItemPublicacao, b: ItemPublicacao) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id);
    const ordenadores: Record<Ordem, (a: ItemPublicacao, b: ItemPublicacao) => number> = {
      recentes: porData,
      antigos: (a, b) => -porData(a, b),
      titulo: (a, b) => comparaTexto(a.titulo, b.titulo),
      autor: (a, b) => comparaTexto(a.primeiroAutor, b.primeiroAutor),
      citacoes: (a, b) => (b.citacoes ?? -1) - (a.citacoes ?? -1) || porData(a, b),
      impacto: (a, b) => (b.fator_impacto ?? -1) - (a.fator_impacto ?? -1) || porData(a, b),
    };
    return [...lista].sort(ordenadores[ordem]);
  }, [itens, indiceBusca, busca, ano, grupo, qualis, minCitacoes, minImpacto, ordem]);

  const filtrando = Boolean(busca || ano || grupo || qualis || minCitacoes || minImpacto);
  const limpar = () => {
    setBusca("");
    setAno("");
    setGrupo("");
    setQualis("");
    setMinCitacoes("");
    setMinImpacto("");
  };

  return (
    <div className="filtro-publicacoes">
      <div className="filtro-publicacoes__controles">
        <label className="filtro-publicacoes__campo filtro-publicacoes__campo--busca">
          <span className="filtro-publicacoes__rotulo">Buscar</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Título, autor ou periódico" className="filtro-publicacoes__entrada" />
        </label>
        <label className="filtro-publicacoes__campo">
          <span className="filtro-publicacoes__rotulo">Ano</span>
          <select value={ano} onChange={(e) => setAno(e.target.value)} className="filtro-publicacoes__entrada">
            <option value="">Todos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        {grupos.length > 0 && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">Grupo</span>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">Todos</option>
              {grupos.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.titulo}
                </option>
              ))}
            </select>
          </label>
        )}
        {valoresQualis.length > 0 && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">Qualis</span>
            <select value={qualis} onChange={(e) => setQualis(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">Todos</option>
              {valoresQualis.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>
        )}
        {temCitacoes && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">Citações (mín.)</span>
            <input type="number" min={0} value={minCitacoes} onChange={(e) => setMinCitacoes(e.target.value)} className="filtro-publicacoes__entrada" />
          </label>
        )}
        {temImpacto && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">Fator de impacto (mín.)</span>
            <input type="number" min={0} step="0.1" value={minImpacto} onChange={(e) => setMinImpacto(e.target.value)} className="filtro-publicacoes__entrada" />
          </label>
        )}
        <label className="filtro-publicacoes__campo">
          <span className="filtro-publicacoes__rotulo">Ordenar por</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="filtro-publicacoes__entrada">
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigas</option>
            <option value="titulo">Título (A–Z)</option>
            <option value="autor">Primeiro autor (A–Z)</option>
            {temCitacoes && <option value="citacoes">Mais citadas</option>}
            {temImpacto && <option value="impacto">Maior fator de impacto</option>}
          </select>
        </label>
      </div>

      <p className="filtro-publicacoes__contagem" aria-live="polite">
        {visiveis.length === itens.length
          ? `${itens.length} publicações`
          : `${visiveis.length} de ${itens.length} publicações`}
        {filtrando && (
          <button type="button" className="filtro-publicacoes__limpar" onClick={limpar}>
            Limpar filtros
          </button>
        )}
      </p>

      {visiveis.length === 0 ? (
        <p className="filtro-publicacoes__vazio">Nenhuma publicação encontrada com esses filtros.</p>
      ) : (
        <ul className="lista-artigos">
          {visiveis.map((i) => (
            <li key={i.id} className="lista-artigos__item">
              <div className="lista-artigos__meta">
                <time className="lista-artigos__data" dateTime={i.data}>
                  {i.dataExibida}
                </time>
                <p className="lista-artigos__autores">{i.autores}</p>
              </div>
              <div className="lista-artigos__corpo">
                <Link href={`/publicacoes/${i.id}/`} className="lista-artigos__titulo">
                  <span dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                </Link>
                {i.periodico && <p className="lista-artigos__periodico">{i.periodico}</p>}
                {(i.qualis || i.fator_impacto !== null || i.citacoes !== null) && (
                  <p className="lista-artigos__metricas">
                    {i.qualis && <span>Qualis {i.qualis}</span>}
                    {i.fator_impacto !== null && <span>Fator de impacto {i.fator_impacto}</span>}
                    {i.citacoes !== null && <span>{i.citacoes} citações</span>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
