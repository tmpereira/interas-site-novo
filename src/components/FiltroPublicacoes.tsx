"use client";

import { useMemo, useRef, useState } from "react";
import { formatarCitacoes, formatarJcr, normalizarBusca } from "@/lib/formatadores";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import Paginacao, { usePaginacao } from "./Paginacao";

/** Dados de cada publicação enviados ao navegador. */
export type ItemPublicacao = {
  id: string;
  /** Título já convertido de Markdown em linha para HTML. */
  tituloHtml: string;
  titulo: string;
  autores: string[];
  ano: number;
  data: string;
  /** Data já formatada no servidor, no idioma da página (ex.: "24 de set. de 2026"). */
  dataTexto: string;
  /** Resumo já convertido de Markdown para HTML; `null` = sem resumo. */
  resumoHtml: string | null;
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
  /** Países estrangeiros dos coautores, já com nome curto no idioma (ex.: ["EUA", "França"]). */
  paises: string[];
};

type Props = {
  idioma: Idioma;
  /** Título da seção, exibido na mesma linha dos filtros de ano. */
  titulo: string;
  itens: ItemPublicacao[];
  grupos: { slug: string; titulo: string }[];
};

/** Valor interno do filtro de colaboração internacional (o texto exibido vem dos rótulos). */
const valorInternacional = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");

/** Autores abreviados: os três primeiros e "et al." */
const autoresCurtos = (autores: string[]) => (autores.length > 3 ? `${autores.slice(0, 3).join("; ")} et al.` : autores.join("; "));

/** Periódico com volume, número e páginas: "Lasers in Medical Science, 39(1), 12–20". */
function veiculo(i: ItemPublicacao): string | null {
  if (!i.periodico) return null;
  const volume = i.volume ? `${i.volume}${i.numero ? `(${i.numero})` : ""}` : i.numero ? `(${i.numero})` : null;
  return [i.periodico, volume, i.paginas].filter(Boolean).join(", ");
}

export default function FiltroPublicacoes({ idioma, titulo, itens, grupos }: Props) {
  const r = rotulos(idioma);
  const f = r.filtroPublicacoes;
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState("");
  const [grupo, setGrupo] = useState("");
  const [qualis, setQualis] = useState("");
  const [internacional, setInternacional] = useState("");
  const [minCitacoes, setMinCitacoes] = useState("");
  const [minImpacto, setMinImpacto] = useState("");
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set());
  const inicioLista = useRef<HTMLParagraphElement>(null);
  const alternar = (id: string) =>
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

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
        if (internacional && valorInternacional(i.internacional) !== internacional) return false;
        if (minCitacoes && (i.citacoes ?? -1) < Number(minCitacoes)) return false;
        if (minImpacto && (i.fator_impacto ?? -1) < Number(minImpacto)) return false;
        const texto = indiceBusca.get(i.id) ?? "";
        return termos.every((t) => texto.includes(t));
      })
      .sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
  }, [itens, indiceBusca, busca, ano, grupo, qualis, internacional, minCitacoes, minImpacto]);

  // A página volta para a 1 sempre que um filtro muda
  const chaveFiltros = JSON.stringify([busca, ano, grupo, qualis, internacional, minCitacoes, minImpacto]);
  const { daPagina, primeiro, pagina, totalPaginas, porPagina, setPorPagina, irPara } = usePaginacao(visiveis, chaveFiltros, () =>
    inicioLista.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );

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
        <div className="filtro-publicacoes__anos" role="group" aria-label={f.filtrarAno}>
          <button type="button" className="filtro-publicacoes__ano" aria-pressed={ano === ""} onClick={() => setAno("")}>
            {r.comum.todos}
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
          <span className="filtro-publicacoes__rotulo">{f.buscar}</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={f.digite} className="filtro-publicacoes__entrada" />
        </label>
        {temInternacional && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">{r.publicacoes.colaboracaoInternacional}</span>
            <select value={internacional} onChange={(e) => setInternacional(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">{r.comum.todos}</option>
              <option value="Sim">{r.comum.sim}</option>
              <option value="Não">{r.comum.nao}</option>
            </select>
          </label>
        )}
        {grupos.length > 0 && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">{f.grupo}</span>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">{r.comum.todos}</option>
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
            <span className="filtro-publicacoes__rotulo">{f.qualis}</span>
            <select value={qualis} onChange={(e) => setQualis(e.target.value)} className="filtro-publicacoes__entrada">
              <option value="">{r.comum.todos}</option>
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
            <span className="filtro-publicacoes__rotulo">{f.citacoesMin}</span>
            <input type="number" min={0} value={minCitacoes} onChange={(e) => setMinCitacoes(e.target.value)} className="filtro-publicacoes__entrada" />
          </label>
        )}
        {temImpacto && (
          <label className="filtro-publicacoes__campo">
            <span className="filtro-publicacoes__rotulo">{f.jcrMin}</span>
            <input type="number" min={0} step="0.1" value={minImpacto} onChange={(e) => setMinImpacto(e.target.value)} className="filtro-publicacoes__entrada" />
          </label>
        )}
      </div>

      <p ref={inicioLista} className="filtro-publicacoes__contagem" aria-live="polite">
        {visiveis.length === itens.length ? f.contagem(itens.length) : f.contagemFiltrada(visiveis.length, itens.length)}
        {totalPaginas > 1 && f.mostrando(primeiro + 1, primeiro + daPagina.length)}
        {filtrando && (
          <button type="button" className="filtro-publicacoes__limpar" onClick={limpar}>
            {f.limpar}
          </button>
        )}
      </p>

      {visiveis.length === 0 ? (
        <p className="filtro-publicacoes__vazio">{f.vazio}</p>
      ) : (
        <ul className="lista-artigos">
          {daPagina.map((i) => {
            const publicadoEm = veiculo(i);
            const aberto = abertos.has(i.id);
            return (
              <li
                key={i.id}
                className={`lista-artigos__item${aberto ? " lista-artigos__item--aberto" : ""}`}
                // Clicar em qualquer parte do cartão expande; links (título → DOI) e o botão agem sozinhos
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("a, button")) alternar(i.id);
                }}
              >
                <span className="lista-artigos__ano">{i.ano}</span>
                <div className="lista-artigos__corpo">
                  <h3 className="lista-artigos__titulo">
                    {i.doi ? (
                      <a href={`https://doi.org/${i.doi}`} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: i.tituloHtml }} />
                    )}
                  </h3>
                  {i.autores.length > 0 && <p className="lista-artigos__autores">{autoresCurtos(i.autores)}</p>}
                  {publicadoEm && <p className="lista-artigos__periodico">{publicadoEm}</p>}
                  {(i.doi || i.fator_impacto !== null || i.citacoes !== null || i.internacional) && (
                    <p className="lista-artigos__meta">
                      {i.fator_impacto !== null && <span className="pilula-metrica">JCR {formatarJcr(i.fator_impacto, idioma)}</span>}
                      {i.citacoes !== null && (
                        <span className="pilula-metrica">{formatarCitacoes(i.citacoes, idioma)}</span>
                      )}
                      {i.internacional && (
                        <span className="lista-artigos__indicador">{i.paises.length > 0 ? r.publicacoes.colaboracaoCom(i.paises.join(", ")) : r.publicacoes.colaboracaoInternacional}</span>
                      )}
                      {i.doi && <span className="lista-artigos__doi">DOI {i.doi}</span>}
                    </p>
                  )}
                </div>
                <button type="button" className="lista-artigos__alternar" aria-expanded={aberto} aria-controls={`resumo-${i.id}`} onClick={() => alternar(i.id)}>
                  <span className="lista-artigos__publicado">
                    <span className="lista-artigos__publicado-rotulo">{r.publicacoes.publicadoEm}</span>
                    <time dateTime={i.data}>{i.dataTexto}</time>
                  </span>
                  <span className="lista-artigos__seta" aria-hidden="true" />
                  <span className="somente-leitor">{aberto ? f.ocultarResumo : f.mostrarResumo}</span>
                </button>
                <div id={`resumo-${i.id}`} className="lista-artigos__resumo" hidden={!aberto}>
                  <p className="lista-artigos__resumo-rotulo">{r.comum.resumo}</p>
                  {i.resumoHtml ? (
                    <div className="lista-artigos__resumo-texto" dangerouslySetInnerHTML={{ __html: i.resumoHtml }} />
                  ) : (
                    <p className="lista-artigos__resumo-vazio">{f.semResumo}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visiveis.length > 0 && (
        <Paginacao
          idioma={idioma}
          pagina={pagina}
          totalPaginas={totalPaginas}
          porPagina={porPagina}
          aoMudarPagina={irPara}
          aoMudarPorPagina={setPorPagina}
          rotuloPorPagina={f.porPagina}
          rotuloPaginas={f.paginas}
        />
      )}
    </div>
  );
}
