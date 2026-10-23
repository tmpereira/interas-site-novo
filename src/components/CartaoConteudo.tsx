import Image from "next/image";
import Link from "next/link";

type Props = {
  href: string;
  imagem: string | null;
  titulo: string;
  descricao?: string | null;
  /** Data já formatada (ex.: "24 de set. de 2026"); `dateTime` é a data no formato AAAA-MM-DD. */
  data?: { texto: string; dateTime: string };
  etiquetas?: string[];
  /** Imagem mais alta (cartões de grupos). */
  imagemAlta?: boolean;
};

/** Cartão com imagem, título, etiquetas, descrição e data: notícias, vídeos e grupos. */
export default function CartaoConteudo({ href, imagem, titulo, descricao, data, etiquetas, imagemAlta }: Props) {
  return (
    <article className="card-noticia">
      <Link href={href} className="card-noticia__link">
        {imagem && (
          <div className={`card-noticia__imagem${imagemAlta ? " card-noticia__imagem--alta" : ""}`}>
            <Image src={imagem} alt="" fill sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw" className="card-noticia__img" />
          </div>
        )}
        <div className="card-noticia__corpo">
          <h3 className="card-noticia__titulo">{titulo}</h3>
          {etiquetas && etiquetas.length > 0 && (
            <p className="card-noticia__etiquetas">
              {etiquetas.map((e) => (
                <span key={e} className="etiqueta">
                  {e}
                </span>
              ))}
            </p>
          )}
          {descricao && <p className="card-noticia__descricao">{descricao}</p>}
          {data && (
            <time className="card-noticia__data" dateTime={data.dateTime}>
              {data.texto}
            </time>
          )}
        </div>
      </Link>
    </article>
  );
}
