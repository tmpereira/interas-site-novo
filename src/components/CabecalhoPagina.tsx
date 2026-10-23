import type { ReactNode } from "react";
import { carregarConteudo } from "@/lib/conteudo";
import { entradaDaPagina, temItens } from "@/lib/menu";

type Props = {
  /** Caminho da página (ex.: "/equipe/"): define o sobretítulo, a partir do menu. */
  caminho: string;
  titulo: string;
  /** Título em HTML (Markdown em linha já convertido), quando tiver itálico. */
  tituloHtml?: string;
  /** Substitui o sobretítulo vindo do menu. */
  sobretitulo?: string | null;
  descricao?: string | null;
  etiquetas?: string[];
  /** Imagem ao lado do título (ex.: foto no perfil). */
  midia?: ReactNode;
  children?: ReactNode;
};

/** Topo das páginas internas: sobretítulo, <h1> e descrição. A navegação fica só no menu do topo. */
export default function CabecalhoPagina({ caminho, titulo, tituloHtml, sobretitulo, descricao, etiquetas, midia, children }: Props) {
  const { site } = carregarConteudo();
  const entrada = entradaDaPagina(site.menu, caminho);
  const secao = entrada && temItens(entrada) ? entrada : null;
  const rotuloSecao = sobretitulo !== undefined ? sobretitulo : secao?.rotulo;
  return (
    <header className="cabecalho-pagina">
      <div className={`cabecalho-pagina__principal${midia ? " cabecalho-pagina__principal--com-midia" : ""}`}>
        {midia && <div className="cabecalho-pagina__midia">{midia}</div>}
        <div className="cabecalho-pagina__corpo">
          {rotuloSecao && <p className="cabecalho-pagina__sobretitulo">{rotuloSecao}</p>}
          {tituloHtml ? (
            <h1 className="cabecalho-pagina__titulo" dangerouslySetInnerHTML={{ __html: tituloHtml }} />
          ) : (
            <h1 className="cabecalho-pagina__titulo">{titulo}</h1>
          )}
          {descricao && <p className="cabecalho-pagina__subtitulo">{descricao}</p>}
          {etiquetas && etiquetas.length > 0 && (
            <p className="cabecalho-pagina__etiquetas">
              {etiquetas.map((e) => (
                <span key={e} className="etiqueta">
                  {e}
                </span>
              ))}
            </p>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
