import type { Patente } from "@/lib/esquemas";
import { ROTULOS_TIPO_PATENTE, formatarData } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";

/** Remove o título ("### Detalhes da Patente") que abre o texto migrado; o <summary> já cumpre esse papel. */
const semTitulo = (texto: string) => texto.replace(/^\s*#{1,6} .*\n+/, "");

/** Patentes, softwares e marcas, com os detalhes do registro em um bloco expansível. */
export default function ListaPatentes({ patentes }: { patentes: Patente[] }) {
  return (
    <ul className="lista-patentes">
      {patentes.map((p) => (
        <li key={p.id} className="lista-patentes__item">
          <div className="lista-patentes__meta">
            <time className="lista-patentes__data" dateTime={p.data}>
              {formatarData(p.data)}
            </time>
            <p className="lista-patentes__autores">{p.autores.join("; ")}</p>
          </div>
          <div className="lista-patentes__corpo">
            <h3 className="lista-patentes__titulo">{p.titulo}</h3>
            <p className="lista-patentes__registro">
              {[p.numero && `Nº ${p.numero}`, p.orgao].filter(Boolean).join(" | ")}
            </p>
            <p className="lista-patentes__etiquetas">
              <span className="etiqueta">{ROTULOS_TIPO_PATENTE[p.tipo]}</span>
              {p.categorias.map((c) => (
                <span key={c} className="etiqueta">
                  {c}
                </span>
              ))}
            </p>
            {p.conteudo && (
              <details className="lista-patentes__detalhes">
                <summary>Detalhes do registro</summary>
                <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(semTitulo(p.conteudo)) }} />
              </details>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
