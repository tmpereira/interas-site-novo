"use client";

import { useRef, type ReactNode } from "react";
import type { Idioma } from "@/lib/i18n/rotas";
import Paginacao, { usePaginacao } from "./Paginacao";

type Props = {
  idioma: Idioma;
  /** Itens já renderizados no servidor (cada um um `<li>` com `key`). */
  itens: ReactNode[];
  /** Classe da `<ul>`. */
  classeLista: string;
  rotuloPorPagina: string;
  rotuloPaginas: string;
};

/** Lista `<ul>` com paginação: mostra só os itens da página atual e a barra de páginas embaixo. */
export default function ListaPaginada({ idioma, itens, classeLista, rotuloPorPagina, rotuloPaginas }: Props) {
  const lista = useRef<HTMLUListElement>(null);
  const p = usePaginacao(itens, "", () => lista.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  return (
    <>
      <ul ref={lista} className={classeLista}>
        {p.daPagina}
      </ul>
      <Paginacao
        idioma={idioma}
        pagina={p.pagina}
        totalPaginas={p.totalPaginas}
        porPagina={p.porPagina}
        aoMudarPagina={p.irPara}
        aoMudarPorPagina={p.setPorPagina}
        rotuloPorPagina={rotuloPorPagina}
        rotuloPaginas={rotuloPaginas}
      />
    </>
  );
}
