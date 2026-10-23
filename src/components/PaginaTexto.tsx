import type { ReactNode } from "react";
import type { Pagina } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";
import Breadcrumb from "./Breadcrumb";

/** Página institucional: título, subtítulo e texto em Markdown (content/paginas.json). */
export default function PaginaTexto({ pagina, rotuloTrilha, children }: { pagina: Pagina; rotuloTrilha: string; children?: ReactNode }) {
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: rotuloTrilha }]} />
      <article className="leitura">
        <header>
          <h1 className="leitura__titulo">{pagina.titulo}</h1>
          {pagina.descricao && <p className="leitura__subtitulo">{pagina.descricao}</p>}
        </header>
        {pagina.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, { rebaixarTitulos: false }) }} />}
        {children}
      </article>
    </div>
  );
}
