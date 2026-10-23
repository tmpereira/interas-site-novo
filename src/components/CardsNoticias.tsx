import Image from "next/image";
import Link from "next/link";
import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";

/** Grade de cartões de notícias (imagem, título e data). */
export default function CardsNoticias({ noticias }: { noticias: Noticia[] }) {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
      {noticias.map((n) => (
        <div key={n.id} className="col">
          <article className="card-noticia">
            <Link href={`/noticias/${n.id}/`} className="card-noticia__link">
              <div className="card-noticia__imagem">
                <Image src={n.imagem} alt="" fill sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw" className="card-noticia__img" />
              </div>
              <div className="card-noticia__corpo">
                <h3 className="card-noticia__titulo">{n.titulo}</h3>
                <p className="card-noticia__data mb-0">{formatarData(n.data)}</p>
              </div>
            </Link>
          </article>
        </div>
      ))}
    </div>
  );
}
