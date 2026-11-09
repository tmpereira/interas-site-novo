"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { PeriodoRede, Rede } from "@/lib/rede";

type Props = {
  rede: Rede;
  /** Período mostrado (escolhido fora, no mesmo seletor do mapa). */
  periodo: PeriodoRede;
  /** Pílulas de período, desenhadas abaixo da legenda. */
  seletor: ReactNode;
};

const ROTULOS_GRUPO = {
  pesquisador: "Pesquisador(a)",
  bolsista: "Bolsista",
} as const;
const arredondar = (n: number) => Math.round(n * 10) / 10;
/** Espessura da linha: cresce com o número de artigos em comum, com limite. */
const espessura = (peso: number) => arredondar(Math.min(1 + (peso - 1) * 0.6, 9));

/**
 * Rede de coautoria: bolinha = membro (tamanho = publicações), linha = artigos em comum.
 * Passar o mouse numa pessoa realça as conexões dela. As posições são as mesmas em todos
 * os períodos, para facilitar a comparação.
 */
export default function RedeCoautoria({ rede, periodo, seletor }: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const porSlug = useMemo(() => new Map(rede.nos.map((n) => [n.slug, n])), [rede.nos]);
  const nosVisiveis = rede.nos.filter((n) => periodo.publicacoes[n.slug] !== undefined);
  const vizinhos = useMemo(() => {
    if (!ativo) return null;
    const v = new Set([ativo]);
    for (const a of periodo.arestas) {
      if (a.a === ativo) v.add(a.b);
      if (a.b === ativo) v.add(a.a);
    }
    return v;
  }, [ativo, periodo.arestas]);
  const paresOrdenados = useMemo(() => [...periodo.arestas].sort((x, y) => y.peso - x.peso || x.a.localeCompare(y.a)), [periodo.arestas]);

  return (
    <figure className="rede-coautoria">
      <figcaption className="rede-coautoria__cabecalho">
        <span className="rede-coautoria__titulo">Coautoria entre pesquisadores do INTERAS</span>
        <span className="rede-coautoria__legenda">
          <span className="rede-coautoria__explicacao">Bolinha maior = mais publicações · linha mais grossa = mais artigos juntos</span>
        </span>
      </figcaption>

      {seletor}

      <div className="rede-coautoria__rolagem">
        <svg
          className={`rede-coautoria__svg${ativo ? " rede-coautoria__svg--realce" : ""}`}
          viewBox={`0 0 ${rede.largura} ${rede.altura}`}
          role="img"
          aria-label={`Rede de coautoria (${periodo.chave === "todos" ? "todos os anos" : periodo.rotulo}) com ${nosVisiveis.length} pesquisadores e ${periodo.arestas.length} pares de coautores. A tabela abaixo traz os mesmos dados.`}
          onMouseLeave={() => setAtivo(null)}
        >
          <g className="rede-coautoria__arestas">
            {periodo.arestas.map((a) => {
              const n1 = porSlug.get(a.a);
              const n2 = porSlug.get(a.b);
              if (!n1 || !n2) return null;
              const destaque = ativo !== null && (a.a === ativo || a.b === ativo);
              return (
                <line
                  key={`${a.a}|${a.b}`}
                  className={`rede-coautoria__aresta${destaque ? " rede-coautoria__aresta--ativa" : ""}`}
                  x1={arredondar(n1.x)}
                  y1={arredondar(n1.y)}
                  x2={arredondar(n2.x)}
                  y2={arredondar(n2.y)}
                  strokeWidth={espessura(a.peso)}
                />
              );
            })}
          </g>
          <g className="rede-coautoria__nos">
            {nosVisiveis.map((n) => {
              const publicacoes = periodo.publicacoes[n.slug];
              const raio = periodo.raios[n.slug];
              return (
                <g
                  key={n.slug}
                  className={`rede-coautoria__no rede-coautoria__no--${n.grupo}${vizinhos?.has(n.slug) ? " rede-coautoria__no--ativo" : ""}`}
                  onMouseEnter={() => setAtivo(n.slug)}
                >
                  <title>{`${n.nome} · ${ROTULOS_GRUPO[n.grupo]} · ${publicacoes} ${publicacoes === 1 ? "publicação" : "publicações"}`}</title>
                  <circle cx={arredondar(n.x)} cy={arredondar(n.y)} r={arredondar(raio)} />
                  <text x={arredondar(n.x)} y={arredondar(n.y - raio - 6)}>
                    {n.rotulo}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {periodo.isolados.length > 0 && (
        <p className="rede-coautoria__nota">
          Sem coautoria com outro membro do INTERAS
          {periodo.chave === "todos" ? "" : ` em ${periodo.rotulo}`}: {periodo.isolados.map((i) => i.nome).join(", ")}.
        </p>
      )}

      <details className="rede-coautoria__tabela">
        <summary>Ver tabela de coautorias ({periodo.arestas.length})</summary>
        <div className="tabela-alunos__rolagem">
          <table className="tabela-alunos tabela-alunos--resumo">
            <thead>
              <tr>
                <th scope="col">Membro</th>
                <th scope="col">Membro</th>
                <th scope="col" className="tabela-alunos__numero">
                  Artigos juntos
                </th>
              </tr>
            </thead>
            <tbody>
              {paresOrdenados.map((a) => (
                <tr key={`${a.a}|${a.b}`}>
                  <td>{porSlug.get(a.a)?.nome}</td>
                  <td>{porSlug.get(a.b)?.nome}</td>
                  <td className="tabela-alunos__numero">{a.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
