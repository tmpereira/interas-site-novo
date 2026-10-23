import Link from "next/link";
import type { Publicacao } from "@/lib/esquemas";
import { formatarData } from "@/lib/formatadores";
import { markdownEmLinha } from "@/lib/markdown";

/** Lista simples de publicações (data e título com link para a página de detalhe). */
export default function ListaPublicacoes({ publicacoes }: { publicacoes: Publicacao[] }) {
  return (
    <ul className="lista-publicacoes">
      {publicacoes.map((p) => (
        <li key={p.id} className="lista-publicacoes__item">
          <time className="lista-publicacoes__data" dateTime={p.data}>
            {formatarData(p.data)}
          </time>
          <Link href={`/publicacoes/${p.id}/`} className="lista-publicacoes__titulo">
            <span dangerouslySetInnerHTML={{ __html: markdownEmLinha(p.titulo) }} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
