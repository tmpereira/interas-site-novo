import Image from "next/image";
import Link from "next/link";
import { resumoDaNoticia } from "@/lib/consultas";
import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";
import { type Idioma, rota } from "@/lib/i18n/rotas";

/** Item da lista de notícias: imagem, categoria e data, título, resumo e autor. */
export default function ItemNoticia({ noticia, idioma }: { noticia: Noticia; idioma: Idioma }) {
  const href = rota("noticias", idioma, noticia.id);
  return (
    <article className="item-noticia">
      <Link href={href} className="item-noticia__imagem" tabIndex={-1} aria-hidden="true">
        <Image src={noticia.imagem} alt="" fill sizes="(min-width: 768px) 12rem, 100vw" className="item-noticia__img" />
      </Link>
      <div className="item-noticia__corpo">
        <p className="item-noticia__meta">
          {noticia.categorias?.map((c) => (
            <span key={c} className="item-noticia__categoria">
              {c}
            </span>
          ))}
          <time dateTime={noticia.data}>{formatarData(noticia.data)}</time>
        </p>
        <h2 className="item-noticia__titulo">
          <Link href={href}>{noticia.titulo}</Link>
        </h2>
        <p className="item-noticia__resumo">{resumoDaNoticia(noticia)}</p>
        {noticia.autor && <p className="item-noticia__autor">{noticia.autor}</p>}
      </div>
    </article>
  );
}
