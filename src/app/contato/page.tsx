import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("contato").titulo, descricao: "Como entrar em contato com o INCT INTERAS.", caminho: "/contato/" });
}

type Cartao = { titulo: string; icone?: string; conteudo: string };

export default function Contato() {
  const pagina = paginaPorSlug("contato");
  const cartoes = (pagina.cartoes as Cartao[] | undefined) ?? [];
  return (
    <PaginaTexto pagina={pagina} caminho="/contato/">
      {cartoes.length > 0 && (
        <div className="cartoes-contato">
          {cartoes.map((c, i) => (
            <section key={c.titulo} className={`cartao-contato${i === 0 ? " cartao-contato--destaque" : ""}`}>
              <h2 className="cartao-contato__titulo">
                {c.icone && <i className={`bi bi-${c.icone}`} aria-hidden="true" />} {c.titulo}
              </h2>
              <div className="cartao-contato__corpo texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(c.conteudo) }} />
            </section>
          ))}
        </div>
      )}
    </PaginaTexto>
  );
}
