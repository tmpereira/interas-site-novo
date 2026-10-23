"use client";

import { useRef, useState, type KeyboardEvent } from "react";

export type Aba = { titulo: string; html: string };

/** Abas acessíveis (setas, Home e End trocam de aba). O conteúdo de cada aba chega como HTML do build. */
export default function Abas({ abas, prefixo }: { abas: Aba[]; prefixo: string }) {
  const [atual, setAtual] = useState(0);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  const ir = (indice: number) => {
    const i = (indice + abas.length) % abas.length;
    setAtual(i);
    botoes.current[i]?.focus();
  };
  const aoTeclar = (e: KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight") ir(i + 1);
    else if (e.key === "ArrowLeft") ir(i - 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(abas.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="abas">
      <div className="abas__lista" role="tablist">
        {abas.map((a, i) => (
          <button
            key={a.titulo}
            ref={(el) => {
              botoes.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${prefixo}-aba-${i}`}
            aria-selected={atual === i}
            aria-controls={`${prefixo}-painel-${i}`}
            tabIndex={atual === i ? 0 : -1}
            className={`abas__aba${atual === i ? " active" : ""}`}
            onClick={() => setAtual(i)}
            onKeyDown={(e) => aoTeclar(e, i)}
          >
            {a.titulo}
          </button>
        ))}
      </div>
      {abas.map((a, i) => (
        <div
          key={a.titulo}
          role="tabpanel"
          id={`${prefixo}-painel-${i}`}
          aria-labelledby={`${prefixo}-aba-${i}`}
          hidden={atual !== i}
          className="abas__painel texto"
          dangerouslySetInnerHTML={{ __html: a.html }}
        />
      ))}
    </div>
  );
}
