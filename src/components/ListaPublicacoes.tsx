import Link from "next/link";
import type { Publicacao } from "@/lib/esquemas";
import { formatarCitacoes, formatarJcr } from "@/lib/formatadores";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import { markdownEmLinha } from "@/lib/markdown";
import ListaPaginada from "./ListaPaginada";

/** Autores abreviados: os três primeiros e "et al." */
const autoresCurtos = (autores: string[]) =>
  autores.length > 3
    ? `${autores.slice(0, 3).join("; ")} et al.`
    : autores.join("; ");

/**
 * Lista de publicações em linhas: ano, título (link para o detalhe), autores, periódico e, quando houver,
 * JCR e citações. `paginada` (perfil da pessoa) mostra 10 por página com a barra de páginas embaixo.
 */
export default function ListaPublicacoes({
  publicacoes,
  idioma,
  paginada = false,
}: {
  publicacoes: Publicacao[];
  idioma: Idioma;
  paginada?: boolean;
}) {
  const itens = publicacoes.map((p) => (
    <li key={p.id} className="lista-publicacoes__item">
      <time className="lista-publicacoes__ano" dateTime={p.data}>
        {p.ano}
      </time>
      <div className="lista-publicacoes__corpo">
        <Link
          href={rota("publicacoes", idioma, p.id)}
          className="lista-publicacoes__titulo"
        >
          <span
            dangerouslySetInnerHTML={{
              __html: markdownEmLinha(p.titulo, idioma),
            }}
          />
        </Link>
        {p.autores.length > 0 && (
          <p className="lista-publicacoes__autores">
            {autoresCurtos(p.autores)}
          </p>
        )}
        {p.periodico && (
          <p className="lista-publicacoes__periodico">{p.periodico}</p>
        )}
        {(p.fator_impacto !== null || p.citacoes !== null) && (
          <p className="lista-publicacoes__metricas">
            {p.fator_impacto !== null && (
              <span className="pilula-metrica">
                JCR {formatarJcr(p.fator_impacto, idioma)}
              </span>
            )}
            {p.citacoes !== null && (
              <span className="pilula-metrica">
                {formatarCitacoes(p.citacoes, idioma)}
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  ));
  if (!paginada) return <ul className="lista-publicacoes">{itens}</ul>;
  const r = rotulos(idioma).perfil;
  return (
    <ListaPaginada
      idioma={idioma}
      itens={itens}
      classeLista="lista-publicacoes"
      rotuloPorPagina={r.porPagina}
      rotuloPaginas={r.paginas}
    />
  );
}
