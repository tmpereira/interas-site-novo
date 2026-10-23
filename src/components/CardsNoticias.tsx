import type { Noticia } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";
import CartaoConteudo from "./CartaoConteudo";

/** Grade de cartões de notícias (imagem, título e data), usada na home. */
export default function CardsNoticias({ noticias }: { noticias: Noticia[] }) {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
      {noticias.map((n) => (
        <div key={n.id} className="col">
          <CartaoConteudo href={`/noticias/${n.id}/`} imagem={n.imagem} titulo={n.titulo} data={{ texto: formatarData(n.data), dateTime: n.data }} />
        </div>
      ))}
    </div>
  );
}
