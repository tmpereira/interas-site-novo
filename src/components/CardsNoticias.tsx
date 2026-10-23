import Link from "next/link";
import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";

/** Notícias recentes da home em células (categoria, data e título). */
export default function CardsNoticias({ noticias }: { noticias: Noticia[] }) {
  return (
    <ul className="celulas-noticias">
      {noticias.map((n) => (
        <li key={n.id}>
          <Link href={`/noticias/${n.id}/`} className="celulas-noticias__link">
            <span className="celulas-noticias__meta">
              {n.categorias?.[0] && <span className="celulas-noticias__categoria">{n.categorias[0]}</span>}
              <time dateTime={n.data}>{formatarData(n.data)}</time>
            </span>
            <span className="celulas-noticias__titulo">{n.titulo}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
