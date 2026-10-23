import Image from "next/image";
import Link from "next/link";
import { resumoDaNoticia } from "@/lib/consultas";
import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";

/** Item da lista de notícias: data e autor, título, categorias, resumo e imagem. */
export default function ItemNoticia({ noticia }: { noticia: Noticia }) {
  const href = `/noticias/${noticia.id}/`;
  return (
    <article className="item-noticia">
      <div className="item-noticia__meta">
        <time dateTime={noticia.data}>{formatarData(noticia.data)}</time>
        {noticia.autor && <p className="item-noticia__autor">{noticia.autor}</p>}
      </div>
      <div className="item-noticia__corpo">
        <h2 className="item-noticia__titulo">
          <Link href={href}>{noticia.titulo}</Link>
        </h2>
        {noticia.categorias && noticia.categorias.length > 0 && (
          <p className="item-noticia__etiquetas">
            {noticia.categorias.map((c) => (
              <span key={c} className="etiqueta">
                {c}
              </span>
            ))}
          </p>
        )}
        <p className="item-noticia__resumo">{resumoDaNoticia(noticia)}</p>
      </div>
      <Link href={href} className="item-noticia__imagem" tabIndex={-1} aria-hidden="true">
        <Image src={noticia.imagem} alt="" fill sizes="(min-width: 768px) 258px, 100vw" className="item-noticia__img" />
      </Link>
    </article>
  );
}
