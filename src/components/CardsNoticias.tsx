import Link from "next/link";
import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";
import { type Idioma, rota } from "@/lib/i18n/rotas";

/** Notícias recentes da home em células (categoria, data e título). */
export default function CardsNoticias({ noticias, idioma }: { noticias: Noticia[]; idioma: Idioma }) {
  return (
    <ul className="celulas-noticias">
      {noticias.map((n) => (
        <li key={n.id}>
          <Link href={rota("noticias", idioma, n.id)} className="celulas-noticias__link">
            <span className="celulas-noticias__meta">
              {n.categorias?.[0] && <span className="celulas-noticias__categoria">{n.categorias[0]}</span>}
              <time dateTime={n.data}>{formatarData(n.data, idioma)}</time>
            </span>
            <span className="celulas-noticias__titulo">{n.titulo}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
