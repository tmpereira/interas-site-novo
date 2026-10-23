import Image from "next/image";
import Link from "next/link";
import type { Home } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";

type Props = {
  destaque: Home["destaques"][number];
  /** Posição na lista (1, 2, 3...), exibida como "01", "02"... */
  numero: number;
  /** Âncora do bloco (usada pelo índice no topo da página). */
  id: string;
};

/** Bloco de uma área de pesquisa: imagem de um lado; número, faixa, título, texto, etiquetas e botão do outro. */
export default function BlocoArea({ destaque, numero, id }: Props) {
  const lado = numero % 2 === 1 ? "esquerda" : "direita";
  const frente = destaque.faixa ? ` frente--${destaque.faixa}` : "";
  return (
    <article id={id} className={`bloco-area bloco-area--imagem-${lado}${frente}`} aria-labelledby={`${id}-titulo`}>
      <div className="bloco-area__imagem">
        <Image src={destaque.imagem} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="bloco-area__img" />
      </div>
      <div className="bloco-area__conteudo">
        <p className="bloco-area__topo">
          <span className="bloco-area__numero">{String(numero).padStart(2, "0")}</span>
          {destaque.rotulo_faixa && <span className="bloco-area__faixa">{destaque.rotulo_faixa.replace("\n", " · ")}</span>}
        </p>
        <h2 id={`${id}-titulo`} className="bloco-area__titulo">
          {destaque.titulo}
        </h2>
        <div className="bloco-area__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(destaque.texto) }} />
        {destaque.etiquetas && destaque.etiquetas.length > 0 && (
          <ul className="bloco-area__etiquetas">
            {destaque.etiquetas.map((e) => (
              <li key={e} className="bloco-area__etiqueta">
                {e}
              </li>
            ))}
          </ul>
        )}
        {destaque.botao && (
          <Link href={destaque.botao.link} className="bloco-area__botao">
            {destaque.botao.rotulo} →
          </Link>
        )}
      </div>
    </article>
  );
}
