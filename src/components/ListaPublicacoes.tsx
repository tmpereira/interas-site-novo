import Link from "next/link";
import type { Publicacao } from "@/lib/esquemas";
import { markdownEmLinha } from "@/lib/markdown";

/** Autores abreviados: os três primeiros e "et al." */
const autoresCurtos = (autores: string[]) => (autores.length > 3 ? `${autores.slice(0, 3).join("; ")} et al.` : autores.join("; "));

/** Lista de publicações em linhas: ano, título (link para o detalhe), autores e periódico. */
export default function ListaPublicacoes({ publicacoes }: { publicacoes: Publicacao[] }) {
  return (
    <ul className="lista-publicacoes">
      {publicacoes.map((p) => (
        <li key={p.id} className="lista-publicacoes__item">
          <time className="lista-publicacoes__ano" dateTime={p.data}>
            {p.ano}
          </time>
          <div className="lista-publicacoes__corpo">
            <Link href={`/publicacoes/${p.id}/`} className="lista-publicacoes__titulo">
              <span dangerouslySetInnerHTML={{ __html: markdownEmLinha(p.titulo) }} />
            </Link>
            {p.autores.length > 0 && <p className="lista-publicacoes__autores">{autoresCurtos(p.autores)}</p>}
            {p.periodico && <p className="lista-publicacoes__periodico">{p.periodico}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
