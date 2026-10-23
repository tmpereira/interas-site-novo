import type { ReactNode } from "react";
import type { Pagina } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";
import CabecalhoPagina from "./CabecalhoPagina";

type Props = { pagina: Pagina; caminho: string; children?: ReactNode };

/** Página institucional: título, subtítulo e texto em Markdown (content/paginas.json). */
export default function PaginaTexto({ pagina, caminho, children }: Props) {
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={caminho} titulo={pagina.titulo} descricao={pagina.descricao} />
      <article className="leitura">
        {pagina.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, { rebaixarTitulos: false }) }} />}
        {children}
      </article>
    </div>
  );
}
