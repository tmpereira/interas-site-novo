"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export type Faixa = "luz" | "cura" | "moleculas";

type EstadoRealce = {
  /** Faixa fixada por um botão. */
  fixada: Faixa | null;
  setFixada: (f: Faixa | null) => void;
  /** Faixa da linha de pesquisa sob o mouse. */
  sobre: Faixa | null;
  setSobre: (f: Faixa | null) => void;
};

const Realce = createContext<EstadoRealce | null>(null);

function useRealce(): EstadoRealce {
  const estado = useContext(Realce);
  if (!estado) throw new Error("Espectro e LinhasPesquisa precisam estar dentro de <ProvedorEspectro>");
  return estado;
}

/** Guarda a faixa realçada, compartilhada entre o espectro e as linhas de pesquisa da página. */
export function ProvedorEspectro({ children }: { children: ReactNode }) {
  const [fixada, setFixada] = useState<Faixa | null>(null);
  const [sobre, setSobre] = useState<Faixa | null>(null);
  return <Realce.Provider value={{ fixada, setFixada, sobre, setSobre }}>{children}</Realce.Provider>;
}

// Posição x (0–1000) das décadas de comprimento de onda no eixo logarítmico
const EIXO = [
  { x: 30, rotulo: "100 µm", ancora: "start" },
  { x: 134, rotulo: "10 µm" },
  { x: 239, rotulo: "1 µm" },
  { x: 343, rotulo: "100 nm" },
  { x: 447, rotulo: "10 nm" },
  { x: 552, rotulo: "1 nm" },
  { x: 657, rotulo: "100 pm" },
  { x: 761, rotulo: "10 pm" },
  { x: 866, rotulo: "1 pm" },
  // O último rótulo (0,1 pm) tem casa decimal e vem dos rótulos do idioma
  { x: 970, rotulo: null, ancora: "end" },
] as const;

/**
 * Espectro eletromagnético em escala logarítmica, com as faixas onde o INTERAS atua.
 * Os botões (um por linha de pesquisa com faixa) fixam o realce de uma faixa.
 */
export default function Espectro({ idioma, faixas }: { idioma: Idioma; faixas: { chave: Faixa; titulo: string }[] }) {
  const r = rotulos(idioma).espectro;
  const { fixada, setFixada, sobre } = useRealce();
  const ativa = sobre ?? fixada;
  const id = useId();
  const idGradiente = `${id}-visivel`;
  const idTitulo = `${id}-titulo`;
  const classeFaixa = (f: Faixa) => `espectro__grupo${ativa === f ? " espectro__grupo--ativo" : ""}`;

  return (
    <figure className="espectro">
      <figcaption className="espectro__legenda">
        <span className="espectro__legenda-titulo">{r.legenda}</span>
        <span className="espectro__legenda-escala">{r.escala}</span>
      </figcaption>
      <div className="espectro__rolagem">
        <svg className={`espectro__svg${ativa ? " espectro__svg--realce" : ""}`} viewBox="0 0 1000 190" role="img" aria-labelledby={idTitulo}>
          <title id={idTitulo}>{r.descricao}</title>
          <defs>
            <linearGradient id={idGradiente} x1="0" x2="1">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                <stop key={o} offset={o} className={`espectro__parada espectro__parada--${i + 1}`} />
              ))}
            </linearGradient>
          </defs>

          <rect className="espectro__base" x="30" y="70" width="940" height="28" rx="2" />
          {/* Radiação ionizante a partir de ~100 nm */}
          <rect className="espectro__ionizante" x="343" y="70" width="627" height="28" />
          <line className="espectro__divisa" x1="343" y1="58" x2="343" y2="110" />
          <text className="espectro__texto" x="337" y="54" textAnchor="end">
            {r.naoIonizante}
          </text>
          <text className="espectro__texto" x="349" y="54">
            {r.ionizante}
          </text>

          {/* A Luz que Revela: infravermelho e visível */}
          <g className={classeFaixa("luz")}>
            <rect className="espectro__faixa espectro__faixa--suave" x="93" y="70" width="104" height="28" />
            <rect x="255" y="70" width="25" height="28" fill={`url(#${idGradiente})`} />
            <line className="espectro__marcador" x1="250" y1="62" x2="250" y2="106" />
            <text className="espectro__rotulo" x="93" y="128">
              {r.infravermelho}
            </text>
            <text className="espectro__texto" x="250" y="146" textAnchor="middle">
              {r.raman}
            </text>
          </g>
          {/* Radiação que Cura: raios X e gama */}
          <g className={classeFaixa("cura")}>
            <rect className="espectro__faixa" x="447" y="76" width="460" height="16" />
            <text className="espectro__rotulo" x="447" y="128">
              {r.raiosX}
            </text>
          </g>
          {/* Moléculas Inteligentes: 140 keV (SPECT) e 511 keV (PET) */}
          <g className={classeFaixa("moleculas")}>
            <circle className="espectro__pico" cx="767" cy="84" r="7" />
            <circle className="espectro__pico" cx="825" cy="84" r="7" />
            <text className="espectro__texto" x="767" y="160" textAnchor="middle">
              SPECT 140 keV
            </text>
            <text className="espectro__texto" x="842" y="176" textAnchor="middle">
              PET 511 keV
            </text>
            <line className="espectro__guia" x1="767" y1="92" x2="767" y2="148" />
            <line className="espectro__guia" x1="825" y1="92" x2="830" y2="164" />
          </g>
          <rect className="espectro__varredura" x="30" y="66" width="2" height="36" />

          {EIXO.map((m) => (
            <g key={m.x}>
              <text className="espectro__texto" x={m.x} y="24" textAnchor={"ancora" in m ? m.ancora : "middle"}>
                {m.rotulo ?? r.eixoMenor}
              </text>
              <line className="espectro__marca" x1={m.x} y1="32" x2={m.x} y2="40" />
            </g>
          ))}
        </svg>
      </div>
      {faixas.length > 0 && (
        <div className="espectro__botoes" role="group" aria-label={r.destacar}>
          {faixas.map((f) => (
            <button key={f.chave} type="button" className="espectro__botao" aria-pressed={fixada === f.chave} onClick={() => setFixada(fixada === f.chave ? null : f.chave)}>
              {f.titulo}
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}

/** Linhas de pesquisa já renderizadas no servidor; passar o mouse sobre uma realça a faixa dela no espectro. */
export function LinhasPesquisa({ pilares }: { pilares: { id: string; faixa: Faixa | null; elemento: ReactNode }[] }) {
  const { fixada, sobre, setSobre } = useRealce();
  const ativa = sobre ?? fixada;
  return (
    <ul className="linhas-pesquisa">
      {pilares.map((p) => (
        <li
          key={p.id}
          className={`linhas-pesquisa__item${p.faixa && ativa === p.faixa ? " linhas-pesquisa__item--ativo" : ""}`}
          onMouseEnter={() => p.faixa && setSobre(p.faixa)}
          onMouseLeave={() => setSobre(null)}
        >
          {p.elemento}
        </li>
      ))}
    </ul>
  );
}
