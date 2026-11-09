import type { Metadata } from "next";
import PaginaTexto from "@/components/PaginaTexto";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("contato").titulo, descricao: rotulos(idioma).contato.descricaoPagina, caminho: rota("contato", idioma) });
}

type Cartao = { titulo: string; icone?: string; conteudo: string };

export default function Contato({ idioma }: { idioma: Idioma }) {
  const pagina = paginaPorSlug("contato");
  const cartoes = (pagina.cartoes as Cartao[] | undefined) ?? [];
  return (
    <PaginaTexto pagina={pagina} caminho={rota("contato", idioma)}>
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
