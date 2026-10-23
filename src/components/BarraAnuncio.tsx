"use client";

import { useSyncExternalStore } from "react";

type Props = {
  id: string;
  icone: string | null;
  /** Texto do aviso já convertido de Markdown para HTML. */
  html: string;
};

const chave = (id: string) => `anuncio-fechado-${id}`;
const EVENTO = "anuncio-alterado";
/** Avisos fechados nesta sessão, para o caso de o armazenamento do navegador estar bloqueado. */
const fechadosNaSessao = new Set<string>();

function inscrever(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

function jaFechado(id: string): boolean {
  if (fechadosNaSessao.has(id)) return true;
  try {
    return localStorage.getItem(chave(id)) === "1";
  } catch {
    return false;
  }
}

/**
 * Barra de aviso no topo. O visitante pode fechar; o aviso só volta se o `id` mudar.
 * No HTML gerado ela começa oculta e aparece no navegador se ainda não foi fechada (como no site antigo).
 */
export default function BarraAnuncio({ id, icone, html }: Props) {
  const fechado = useSyncExternalStore(
    inscrever,
    () => jaFechado(id),
    () => true,
  );

  const fechar = () => {
    fechadosNaSessao.add(id);
    try {
      localStorage.setItem(chave(id), "1");
    } catch {
      // armazenamento bloqueado: vale só nesta sessão
    }
    window.dispatchEvent(new Event(EVENTO));
  };

  if (fechado) return null;
  return (
    <div className="anuncio" role="region" aria-label="Aviso">
      {icone && <i className={`anuncio__icone bi bi-${icone}`} aria-hidden="true" />}
      <div className="anuncio__texto" dangerouslySetInnerHTML={{ __html: html }} />
      <button type="button" className="anuncio__fechar" aria-label="Fechar aviso" onClick={fechar}>
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>
  );
}
