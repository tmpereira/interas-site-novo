import Image from "next/image";
import Link from "next/link";
import type { Pessoa } from "@/lib/esquemas";

/** Cartão de pessoa na listagem da equipe; mostra a foto quando a pessoa tem uma. */
export default function CardPessoa({ pessoa }: { pessoa: Pessoa }) {
  return (
    <article className="card-pessoa">
      <Link href={`/equipe/${pessoa.slug}/`} className="card-pessoa__link">
        {pessoa.foto && (
          <div className="card-pessoa__foto">
            <Image src={pessoa.foto} alt="" fill sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw" className="card-pessoa__img" />
          </div>
        )}
        <div className="card-pessoa__corpo">
          <h3 className="card-pessoa__nome">{pessoa.nome}</h3>
          {pessoa.cargo && <p className="card-pessoa__cargo">{pessoa.cargo}</p>}
        </div>
      </Link>
    </article>
  );
}
