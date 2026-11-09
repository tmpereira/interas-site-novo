"use client";

import { useState } from "react";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

/** Opções do seletor "itens por página". */
export const OPCOES_POR_PAGINA = [10, 20, 50, 100];

/**
 * Estado da paginação de uma lista. `chave` resume os filtros: quando ela muda (ou o número
 * por página muda), a lista volta para a página 1. `aoTrocarPagina` roda ao clicar numa página
 * (ex.: rolar até o início da lista).
 */
export function usePaginacao<T>(itens: T[], chave: string, aoTrocarPagina?: () => void) {
  const [porPagina, setPorPagina] = useState(OPCOES_POR_PAGINA[0]);
  const chaveCompleta = `${chave}|${porPagina}`;
  const [estado, setEstado] = useState({ chave: chaveCompleta, pagina: 1 });
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const pagina = estado.chave === chaveCompleta ? Math.min(estado.pagina, totalPaginas) : 1;
  const primeiro = (pagina - 1) * porPagina;
  return {
    daPagina: itens.slice(primeiro, primeiro + porPagina),
    primeiro,
    pagina,
    totalPaginas,
    porPagina,
    setPorPagina,
    irPara: (n: number) => {
      setEstado({ chave: chaveCompleta, pagina: n });
      aoTrocarPagina?.();
    },
  };
}

/** Páginas a mostrar: janela de 5 em volta da atual, mais a primeira e a última; "…" nos saltos. */
function paginasVisiveis(atual: number, total: number): (number | "…")[] {
  const inicio = Math.max(1, Math.min(atual - 2, total - 4));
  const janela = Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
  const numeros = [...new Set([1, ...janela, total])].sort((a, b) => a - b);
  return numeros.flatMap((n, i) => (i > 0 && n - numeros[i - 1] > 1 ? (["…", n] as const) : [n]));
}

type Props = {
  idioma: Idioma;
  pagina: number;
  totalPaginas: number;
  porPagina: number;
  aoMudarPagina: (n: number) => void;
  aoMudarPorPagina: (n: number) => void;
  /** Rótulo do seletor (ex.: "Artigos por página"). */
  rotuloPorPagina: string;
  /** Rótulo da navegação para leitores de tela (ex.: "Páginas de artigos"). */
  rotuloPaginas: string;
  opcoes?: number[];
};

/** Paginação: itens por página à esquerda, páginas numeradas à direita. */
export default function Paginacao({ idioma, pagina, totalPaginas, porPagina, aoMudarPagina, aoMudarPorPagina, rotuloPorPagina, rotuloPaginas, opcoes = OPCOES_POR_PAGINA }: Props) {
  const p = rotulos(idioma).paginacao;
  return (
    <div className="paginacao">
      <label className="paginacao__por-pagina">
        <span>{rotuloPorPagina}</span>
        <select value={porPagina} onChange={(e) => aoMudarPorPagina(Number(e.target.value))} className="filtro-publicacoes__entrada">
          {opcoes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {totalPaginas > 1 && (
        <nav className="paginacao__paginas" aria-label={rotuloPaginas}>
          <button type="button" className="paginacao__botao" disabled={pagina === 1} onClick={() => aoMudarPagina(pagina - 1)}>
            {p.anterior.antes}
            <span className="somente-leitor">{p.anterior.oculto}</span>
            {p.anterior.depois}
          </button>
          {paginasVisiveis(pagina, totalPaginas).map((n, i) =>
            n === "…" ? (
              <span key={`salto-${i}`} className="paginacao__salto" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className="paginacao__botao paginacao__botao--numero"
                aria-current={n === pagina ? "page" : undefined}
                aria-label={p.pagina(n)}
                onClick={() => aoMudarPagina(n)}
              >
                {n}
              </button>
            ),
          )}
          <button type="button" className="paginacao__botao" disabled={pagina === totalPaginas} onClick={() => aoMudarPagina(pagina + 1)}>
            {p.proxima.antes}
            <span className="somente-leitor">{p.proxima.oculto}</span>
            {p.proxima.depois}
          </button>
        </nav>
      )}
    </div>
  );
}
