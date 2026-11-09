import Link from "next/link";
import type { Publicacao } from "@/lib/esquemas";
import { formatarCitacoes, formatarJcr } from "@/lib/formatadores";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { markdownEmLinha } from "@/lib/markdown";

/** Autores abreviados: os três primeiros e "et al." */
const autoresCurtos = (autores: string[]) => (autores.length > 3 ? `${autores.slice(0, 3).join("; ")} et al.` : autores.join("; "));

/** Lista de publicações em linhas: ano, título (link para o detalhe), autores, periódico e, quando houver, JCR e citações. */
export default function ListaPublicacoes({ publicacoes, idioma }: { publicacoes: Publicacao[]; idioma: Idioma }) {
  return (
    <ul className="lista-publicacoes">
      {publicacoes.map((p) => (
        <li key={p.id} className="lista-publicacoes__item">
          <time className="lista-publicacoes__ano" dateTime={p.data}>
            {p.ano}
          </time>
          <div className="lista-publicacoes__corpo">
            <Link href={rota("publicacoes", idioma, p.id)} className="lista-publicacoes__titulo">
              <span dangerouslySetInnerHTML={{ __html: markdownEmLinha(p.titulo, idioma) }} />
            </Link>
            {p.autores.length > 0 && <p className="lista-publicacoes__autores">{autoresCurtos(p.autores)}</p>}
            {p.periodico && <p className="lista-publicacoes__periodico">{p.periodico}</p>}
            {(p.fator_impacto !== null || p.citacoes !== null) && (
              <p className="lista-publicacoes__metricas">
                {p.fator_impacto !== null && <span className="pilula-metrica">JCR {formatarJcr(p.fator_impacto, idioma)}</span>}
                {p.citacoes !== null && <span className="pilula-metrica">{formatarCitacoes(p.citacoes, idioma)}</span>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
