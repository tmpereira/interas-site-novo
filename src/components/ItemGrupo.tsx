import Link from "next/link";
import type { Grupo } from "@/lib/esquemas";

type Props = {
  grupo: Grupo;
  /** Rótulos dos temas (slug → rótulo, de site.json). */
  rotulos: Map<string, string>;
  /** Nomes de quem coordena o grupo (de pessoas.json). */
  coordenacao: string[];
};

/** Linha da lista de grupos: título e tema principal, instituição, coordenação e demais temas, link. */
export default function ItemGrupo({ grupo, rotulos, coordenacao }: Props) {
  const [principal, ...outros] = grupo.temas;
  const href = `/grupos/${grupo.slug}/`;
  return (
    <article className="item-grupo">
      <div className="item-grupo__principal">
        <h2 className="item-grupo__titulo">
          <Link href={href}>{grupo.titulo}</Link>
        </h2>
        {principal && <p className={`item-grupo__tema frente frente--${principal}`}>{rotulos.get(principal) ?? principal}</p>}
      </div>
      <p className="item-grupo__instituicao">{grupo.instituicao}</p>
      <div className="item-grupo__detalhes">
        {coordenacao.length > 0 && <p className="item-grupo__coordenacao">{coordenacao.join(", ")}</p>}
        {outros.length > 0 && <p className="item-grupo__temas">{outros.map((t) => rotulos.get(t) ?? t).join(" · ")}</p>}
      </div>
      <Link href={href} className="item-grupo__link" aria-label={`Conhecer ${grupo.titulo}`}>
        Conhecer →
      </Link>
    </article>
  );
}
