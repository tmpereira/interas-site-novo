import type { Metadata } from "next";
import { paginaPorSlug } from "@/lib/consultas";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  const p = paginaPorSlug("sobre-o-interas");
  return metadadosPagina({ titulo: p.titulo, descricao: p.descricao, caminho: "/sobre-o-interas/" });
}

/** "O INCT INTERAS": faixa escura com a missão e o cartão "Do laboratório ao SUS" (content/paginas.json). */
export default function Sobre() {
  const pagina = paginaPorSlug("sobre-o-interas");
  const { missao, etapas } = pagina;
  return (
    <>
      {missao ? (
        <section className="faixa-profunda apresentacao" aria-labelledby="missao-titulo">
          <div className="faixa-profunda__interno apresentacao__grade">
            <div>
              {missao.sobretitulo && <p className="apresentacao__sobretitulo">{missao.sobretitulo}</p>}
              <h1 id="missao-titulo" className="apresentacao__titulo" dangerouslySetInnerHTML={{ __html: markdownEmLinha(missao.titulo) }} />
            </div>
            <div>
              <div className="apresentacao__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(missao.texto) }} />
              {missao.etiquetas.length > 0 && (
                <ul className="apresentacao__etiquetas">
                  {missao.etiquetas.map((e) => (
                    <li key={e} className="apresentacao__etiqueta">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : (
        <h1 className="somente-leitor">{pagina.titulo}</h1>
      )}

      <div className="pagina">
        {etapas && (
          <section className="etapas" aria-labelledby="etapas-titulo">
            {etapas.sobretitulo && <p className="etapas__sobretitulo">{etapas.sobretitulo}</p>}
            <h2 id="etapas-titulo" className="etapas__titulo">
              {etapas.titulo}
            </h2>
            <ol className="etapas__lista">
              {etapas.itens.map((item, i) => (
                <li key={item.titulo} className="etapas__item">
                  <span className="etapas__numero">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="etapas__nome">{item.titulo}</h3>
                  <p className="etapas__texto">{item.texto}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
        {pagina.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(pagina.conteudo, { rebaixarTitulos: false }) }} />}
      </div>
    </>
  );
}
