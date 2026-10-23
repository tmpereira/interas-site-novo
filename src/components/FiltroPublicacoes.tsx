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
  ano: number;
  data: string;
  periodico: string | null;
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
  itens: ItemPublicacao[];
  grupos: { slug: string; titulo: string }[];
};

type Coluna = "ano" | "titulo" | "jcr" | "autores" | "internacional";
type Ordem = { coluna: Coluna; decrescente: boolean };

const COLUNAS: { chave: Coluna; rotulo: string }[] = [
  { chave: "ano", rotulo: "Ano" },
  { chave: "titulo", rotulo: "Título" },
  { chave: "jcr", rotulo: "JCR" },
  { chave: "autores", rotulo: "Autores" },
  { chave: "internacional", rotulo: "Internacional" },
];

const comparaTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });
const rotuloInternacional = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");
const formatarJcr = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });

export default function FiltroPublicacoes({ itens, grupos }: Props) {
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("");
  const [grupo, setGrupo] = useState("");
  const [qualis, setQualis] = useState("");
  const [internacional, setInternacional] = useState("");
  const [minCitacoes, setMinCitacoes] = useState("");
  const [minImpacto, setMinImpacto] = useState("");
  const [ordem, setOrdem] = useState<Ordem>({ coluna: "ano", decrescente: true });

  // Os controles que dependem de dados opcionais só aparecem quando há algum valor preenchido
  const temCitacoes = itens.some((i) => i.citacoes !== null);
  const temImpacto = itens.some((i) => i.fator_impacto !== null);
  const temInternacional = itens.some((i) => i.internacional !== null);
  const valoresQualis = useMemo(() => [...new Set(itens.map((i) => i.qualis).filter((q): q is string => Boolean(q)))].sort(), [itens]);
  const anos = useMemo(() => [...new Set(itens.map((i) => i.ano))].sort((a, b) => b - a), [itens]);
  const indiceBusca = useMemo(() => new Map(itens.map((i) => [i.id, normalizarBusca(`${i.titulo} ${i.autores} ${i.periodico ?? ""}`)])), [itens]);

  const visiveis = useMemo(() => {
    const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
    const lista = itens.filter((i) => {
      if (ano && String(i.ano) !== ano) return false;
      if (grupo && !i.grupos.includes(grupo)) return false;
      if (qualis && i.qualis !== qualis) return false;
      if (internacional && rotuloInternacional(i.internacional) !== internacional) return false;
      if (minCitacoes && (i.citacoes ?? -1) < Number(minCitacoes)) return false;
      if (minImpacto && (i.fator_impacto ?? -1) < Number(minImpacto)) return false;
      const texto = indiceBusca.get(i.id) ?? "";
      return termos.every((t) => texto.includes(t));
    });
    const porData = (a: ItemPublicacao, b: ItemPublicacao) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id);
    // Sem valor (JCR ou internacional ainda não informados) vai sempre para o fim
    const numero = (v: number | null) => v ?? Number.NEGATIVE_INFINITY;
    const base: Record<Coluna, (a: ItemPublicacao, b: ItemPublicacao) => number> = {
      ano: (a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id),
      titulo: (a, b) => comparaTexto(a.titulo, b.titulo),
      jcr: (a, b) => numero(a.fator_impacto) - numero(b.fator_impacto),
      autores: (a, b) => comparaTexto(a.autores, b.autores),
      internacional: (a, b) => Number(a.internacional ?? -1) - Number(b.internacional ?? -1),
    };
    const sinal = ordem.decrescente ? -1 : 1;
    return [...lista].sort((a, b) => sinal * base[ordem.coluna](a, b) || porData(a, b));
  }, [itens, indiceBusca, busca, ano, grupo, qualis, internacional, minCitacoes, minImpacto, ordem]);

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
  const ordenarPor = (coluna: Coluna) =>
    setOrdem((o) => (o.coluna === coluna ? { coluna, decrescente: !o.decrescente } : { coluna, decrescente: coluna === "ano" || coluna === "jcr" }));

  return (
    <div className="filtro-publicacoes">
      <div className="filtro-publicacoes__controles">
        <label className="filtro-publicacoes__campo filtro-publicacoes__campo--busca">
          <span className="filtro-publicacoes__rotulo">Buscar por título, veículo ou autor</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar…" className="filtro-publicacoes__entrada" />
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
        <div className="tabela-artigos">
          <table className="tabela-artigos__tabela">
            <thead>
              <tr>
                {COLUNAS.map((c) => {
                  const ativa = ordem.coluna === c.chave;
                  return (
                    <th key={c.chave} scope="col" className={`tabela-artigos__cabecalho tabela-artigos__cabecalho--${c.chave}`} aria-sort={ativa ? (ordem.decrescente ? "descending" : "ascending") : "none"}>
                      <button type="button" className="tabela-artigos__ordenar" onClick={() => ordenarPor(c.chave)}>
                        {c.rotulo}
                        <span aria-hidden="true" className="tabela-artigos__seta">
                          {ativa ? (ordem.decrescente ? "▼" : "▲") : "↕"}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((i) => (
                <tr key={i.id}>
                  <td className="tabela-artigos__ano">{i.ano}</td>
                  <td className="tabela-artigos__titulo">
                    {i.doi ? (
                      <a href={`https://doi.org/${i.doi}`} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    ) : (
                      <Link href={`/publicacoes/${i.id}/`} dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    )}
                  </td>
                  <td className="tabela-artigos__jcr">{i.fator_impacto !== null ? formatarJcr(i.fator_impacto) : "—"}</td>
                  <td className="tabela-artigos__autores">{i.autores}</td>
                  <td className="tabela-artigos__internacional">{rotuloInternacional(i.internacional)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
