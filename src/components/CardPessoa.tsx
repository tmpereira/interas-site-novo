import Image from "next/image";
import Link from "next/link";
import type { Pessoa } from "@/lib/esquemas";

/** Iniciais do primeiro e do último nome, para quem não tem foto. */
const iniciais = (nome: string) => {
  const partes = nome.split(/\s+/).filter(Boolean);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
};

/** Foto redonda com anel; sem foto, mostra as iniciais. */
export function FotoPessoa({ pessoa, tamanho, alt = "" }: { pessoa: Pessoa; tamanho: "pequena" | "grande" | "perfil"; alt?: string }) {
  return (
    <span className={`foto-pessoa foto-pessoa--${tamanho}`}>
      <span className="foto-pessoa__moldura">
        {pessoa.foto ? (
          <Image src={pessoa.foto} alt={alt} fill sizes={tamanho === "perfil" ? "11rem" : "6rem"} className="foto-pessoa__img" />
        ) : (
          <span className="foto-pessoa__iniciais" aria-hidden="true">
            {iniciais(pessoa.nome)}
          </span>
        )}
      </span>
    </span>
  );
}

/** Cartão de pessoa na listagem da equipe. `destaque` = cartão grande (coordenação). */
export default function CardPessoa({ pessoa, destaque = false }: { pessoa: Pessoa; destaque?: boolean }) {
  return (
    <article className={`card-pessoa${destaque ? " card-pessoa--destaque" : ""}`}>
      <Link href={`/equipe/${pessoa.slug}/`} className="card-pessoa__link">
        <FotoPessoa pessoa={pessoa} tamanho={destaque ? "grande" : "pequena"} />
        <div className="card-pessoa__corpo">
          {destaque && pessoa.cargo && <p className="card-pessoa__cargo">{pessoa.cargo}</p>}
          <h3 className="card-pessoa__nome">{pessoa.nome}</h3>
          {!destaque && pessoa.cargo && <p className="card-pessoa__cargo">{pessoa.cargo}</p>}
          {pessoa.instituicao?.nome && <p className="card-pessoa__instituicao">{pessoa.instituicao.nome}</p>}
        </div>
      </Link>
    </article>
  );
}
