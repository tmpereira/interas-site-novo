import Image from "next/image";
import Link from "next/link";
import type { Home } from "@/lib/esquemas";
import { type Idioma, linkNoIdioma } from "@/lib/i18n/rotas";
import { markdownParaHtml } from "@/lib/markdown";

/** Linha de pesquisa da home: faixa do espectro à esquerda, texto no meio, imagem e etiquetas à direita. */
export default function Destaque({ destaque, idioma }: { destaque: Home["destaques"][number]; idioma: Idioma }) {
  const linhasFaixa = destaque.rotulo_faixa?.split("\n") ?? [];
  return (
    <article className="pilar">
      <p className="pilar__faixa">
        {linhasFaixa.map((l, i) => (
          <span key={i} className="pilar__faixa-linha">
            {l}
          </span>
        ))}
      </p>
      <div className="pilar__texto">
        <h3 className="pilar__titulo">{destaque.titulo}</h3>
        <div className="pilar__corpo" dangerouslySetInnerHTML={{ __html: markdownParaHtml(destaque.texto) }} />
        {destaque.botao && (
          <Link href={linkNoIdioma(destaque.botao.link, idioma)} className="pilar__botao">
            {destaque.botao.rotulo} →
          </Link>
        )}
      </div>
      <div className="pilar__lateral">
        <div className="pilar__imagem">
          <Image src={destaque.imagem} alt="" fill sizes="(min-width: 768px) 18rem, 100vw" className="pilar__img" />
        </div>
        {destaque.etiquetas && destaque.etiquetas.length > 0 && (
          <ul className="pilar__etiquetas">
            {destaque.etiquetas.map((e) => (
              <li key={e} className="pilar__etiqueta">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
