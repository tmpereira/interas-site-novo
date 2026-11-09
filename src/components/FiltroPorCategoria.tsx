"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { slugificar } from "@/lib/formatadores";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export type ItemFiltravel = {
  id: string;
  /** Chaves das categorias do item (as mesmas de `categorias`). */
  categorias: string[];
  /** Conteúdo já renderizado no servidor. */
  elemento: ReactNode;
};

type Props = {
  idioma: Idioma;
  categorias: { chave: string; rotulo: string }[];
  itens: ItemFiltravel[];
  /** Classe da lista (ul) e de cada item (li). */
  classeLista: string;
  classeItem?: string;
  /** Aceita `?tema=` e `#category=` na URL como filtro inicial (links antigos). */
  lerDaUrl?: boolean;
};

function inscrever(aviso: () => void) {
  window.addEventListener("hashchange", aviso);
  window.addEventListener("popstate", aviso);
  return () => {
    window.removeEventListener("hashchange", aviso);
    window.removeEventListener("popstate", aviso);
  };
}

/** Categoria pedida na URL: `?tema=diagnostico` ou `#category=intelig%C3%AAncia%20artificial`. */
function categoriaDaUrl(): string {
  const consulta = new URLSearchParams(window.location.search).get("tema");
  const ancora = /category=([^&]+)/.exec(window.location.hash)?.[1];
  const bruta = consulta ?? (ancora ? decodeURIComponent(ancora) : "");
  return bruta ? slugificar(bruta) : "";
}

/** Lista com filtro por categoria (barra lateral à direita, como no Quarto). */
export default function FiltroPorCategoria({ idioma, categorias, itens, classeLista, classeItem, lerDaUrl = false }: Props) {
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const daUrl = useSyncExternalStore(
    inscrever,
    () => (lerDaUrl ? categoriaDaUrl() : ""),
    () => "",
  );
  const ativa = escolhida ?? daUrl;
  const r = rotulos(idioma);

  const contagens = categorias
    .map((c) => ({ ...c, total: itens.filter((i) => i.categorias.includes(c.chave)).length }))
    .filter((c) => c.total > 0);
  // Ignora uma categoria desconhecida vinda da URL
  const ativaValida = contagens.some((c) => c.chave === ativa) ? ativa : "";
  const visiveis = ativaValida ? itens.filter((i) => i.categorias.includes(ativaValida)) : itens;

  return (
    <div className="filtro-categorias">
      <nav className="filtro-categorias__barra" aria-label={r.filtroCategorias.titulo}>
        <h2 className="filtro-categorias__titulo">{r.filtroCategorias.titulo}</h2>
        <ul className="filtro-categorias__lista">
          <li>
            <button type="button" className={`filtro-categorias__opcao${ativaValida === "" ? " active" : ""}`} aria-pressed={ativaValida === ""} onClick={() => setEscolhida("")}>
              {r.comum.todos} ({itens.length})
            </button>
          </li>
          {contagens.map((c) => (
            <li key={c.chave}>
              <button type="button" className={`filtro-categorias__opcao${ativaValida === c.chave ? " active" : ""}`} aria-pressed={ativaValida === c.chave} onClick={() => setEscolhida(c.chave)}>
                {c.rotulo} ({c.total})
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <ul className={`filtro-categorias__itens ${classeLista}`}>
        {visiveis.map((i) => (
          <li key={i.id} className={classeItem}>
            {i.elemento}
          </li>
        ))}
      </ul>
    </div>
  );
}
