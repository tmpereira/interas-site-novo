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
  /** Cartão de vídeo: mostra o botão de play sobre a capa. */
  video?: boolean;
};

/** Cartão com imagem, título, etiquetas, descrição e data: vídeos e grupos. */
export default function CartaoConteudo({ href, imagem, titulo, descricao, data, etiquetas, video }: Props) {
  return (
    <article className={`card-noticia${video ? " card-noticia--video" : ""}`}>
      <Link href={href} className="card-noticia__link">
        {imagem && (
          <div className="card-noticia__imagem">
            <Image src={imagem} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="card-noticia__img" />
            {video && <span className="card-noticia__play" aria-hidden="true" />}
          </div>
        )}
        <div className="card-noticia__corpo">
          {(data || (etiquetas && etiquetas.length > 0)) && (
            <p className="card-noticia__meta">
              {etiquetas?.map((e) => (
                <span key={e} className="card-noticia__etiqueta">
                  {e}
                </span>
              ))}
              {data && (
                <time className="card-noticia__data" dateTime={data.dateTime}>
                  {data.texto}
                </time>
              )}
            </p>
          )}
          <h3 className="card-noticia__titulo">{titulo}</h3>
          {descricao && <p className="card-noticia__descricao">{descricao}</p>}
        </div>
      </Link>
    </article>
  );
}
