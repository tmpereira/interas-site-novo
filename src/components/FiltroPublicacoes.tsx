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
  autores: string[];
  ano: number;
  data: string;
  periodico: string | null;
  volume: string | null;
  numero: string | null;
  paginas: string | null;
  grupos: string[];
  citacoes: number | null;
  /** JCR (fator de impacto). */
  fator_impacto: number | null;
  qualis: string | null;
  doi: string | null;
  /** Coautoria internacional; `null` = ainda não informado. */
  internacional: boolean | null;
};

type Props = {
  /** Título da seção, exibido na mesma linha dos filtros de ano. */
  titulo: string;
  itens: ItemPublicacao[];
  grupos: { slug: string; titulo: string }[];
};

const rotuloInternacional = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");
const formatarJcr = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });

/** Autores abreviados: os três primeiros e "et al." */
const autoresCurtos = (autores: string[]) => (autores.length > 3 ? `${autores.slice(0, 3).join("; ")} et al.` : autores.join("; "));

/** Periódico com volume, número e páginas: "Lasers in Medical Science, 39(1), 12–20". */
function veiculo(i: ItemPublicacao): string | null {
  if (!i.periodico) return null;
  const volume = i.volume ? `${i.volume}${i.numero ? `(${i.numero})` : ""}` : i.numero ? `(${i.numero})` : null;
  return [i.periodico, volume, i.paginas].filter(Boolean).join(", ");
}

export default function FiltroPublicacoes({ titulo, itens, grupos }: Props) {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("");
  const [grupo, setGrupo] = useState("");
  const [qualis, setQualis] = useState("");
  const [internacional, setInternacional] = useState("");
  const [minCitacoes, setMinCitacoes] = useState("");
  const [minImpacto, setMinImpacto] = useState("");

  // Os controles que dependem de dados opcionais só aparecem quando há algum valor preenchido
  const temCitacoes = itens.some((i) => i.citacoes !== null);
  const temImpacto = itens.some((i) => i.fator_impacto !== null);
  const temInternacional = itens.some((i) => i.internacional !== null);
  const valoresQualis = useMemo(() => [...new Set(itens.map((i) => i.qualis).filter((q): q is string => Boolean(q)))].sort(), [itens]);
  const anos = useMemo(() => [...new Set(itens.map((i) => i.ano))].sort((a, b) => b - a), [itens]);
  const indiceBusca = useMemo(() => new Map(itens.map((i) => [i.id, normalizarBusca(`${i.titulo} ${i.autores.join(" ")} ${i.periodico ?? ""}`)])), [itens]);

  const visiveis = useMemo(() => {
    const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
    return itens
      .filter((i) => {
        if (ano && String(i.ano) !== ano) return false;
        if (grupo && !i.grupos.includes(grupo)) return false;
        if (qualis && i.qualis !== qualis) return false;
        if (internacional && rotuloInternacional(i.internacional) !== internacional) return false;
        if (minCitacoes && (i.citacoes ?? -1) < Number(minCitacoes)) return false;
        if (minImpacto && (i.fator_impacto ?? -1) < Number(minImpacto)) return false;
        const texto = indiceBusca.get(i.id) ?? "";
        return termos.every((t) => texto.includes(t));
      })
      .sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
  }, [itens, indiceBusca, busca, ano, grupo, qualis, internacional, minCitacoes, minImpacto]);

  const filtrando = Boolean(busca || ano || grupo || qualis || internacional || minCitacoes || minImpacto);
  const limpar = () => {
    setBusca("");
    setAno("");
    setGrupo("");
    setQualis("");
    setInternacional("");
    setMinCitacoes("");
    setMinImpacto("");
  };

  return (
    <div className="filtro-publicacoes">
      <div className="filtro-publicacoes__topo">
        <h2 className="filtro-publicacoes__titulo">{titulo}</h2>
        <div className="filtro-publicacoes__anos" role="group" aria-label="Filtrar por ano">
          <button type="button" className="filtro-publicacoes__ano" aria-pressed={ano === ""} onClick={() => setAno("")}>
            Todos
          </button>
          {anos.map((a) => (
            <button key={a} type="button" className="filtro-publicacoes__ano" aria-pressed={ano === String(a)} onClick={() => setAno(String(a))}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro-publicacoes__controles">
        <label className="filtro-publicacoes__campo filtro-publicacoes__campo--busca">
          <span className="filtro-publicacoes__rotulo">Buscar por título, veículo ou autor</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar…" className="filtro-publicacoes__entrada" />
        </label>
        {temInternacional && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">Colaboração internacional</span>
            <select value={internacional} onChange={(e) => setInternacional(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">Todos</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </label>
        )}
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
            <span className="filtro-publicacoes__rotulo">JCR (mín.)</span>
            <input type="number" min={0} step="0.1" value={minImpacto} onChange={(e) => setMinImpacto(e.target.value)} className="filtro-publicacoes__entrada" />
          </label>
        )}
      </div>

      <p className="filtro-publicacoes__contagem" aria-live="polite">
        {visiveis.length === itens.length ? `${itens.length} publicações` : `${visiveis.length} de ${itens.length} publicações`}
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
          {visiveis.map((i) => {
            const publicadoEm = veiculo(i);
            return (
              <li key={i.id} className="lista-artigos__item">
                <span className="lista-artigos__ano">{i.ano}</span>
                <div className="lista-artigos__corpo">
                  <h3 className="lista-artigos__titulo">
                    {i.doi ? (
                      <a href={`https://doi.org/${i.doi}`} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    ) : (
                      <Link href={`/publicacoes/${i.id}/`} dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    )}
                  </h3>
                  {i.autores.length > 0 && <p className="lista-artigos__autores">{autoresCurtos(i.autores)}</p>}
                  {publicadoEm && <p className="lista-artigos__periodico">{publicadoEm}</p>}
                  {(i.doi || i.fator_impacto !== null || i.internacional) && (
                    <p className="lista-artigos__meta">
                      {i.fator_impacto !== null && <span className="lista-artigos__indicador">JCR {formatarJcr(i.fator_impacto)}</span>}
                      {i.internacional && <span className="lista-artigos__indicador">Colaboração internacional</span>}
                      {i.doi && <span className="lista-artigos__doi">DOI {i.doi}</span>}
                    </p>
                  )}
                </div>
                <Link href={`/publicacoes/${i.id}/`} className="lista-artigos__link">
                  Detalhes →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
