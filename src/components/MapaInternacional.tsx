import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import type { MapaInternacional as DadosMapa, PeriodoMapa } from "@/lib/internacional";

type Props = {
  idioma: Idioma;
  mapa: DadosMapa;
  /** Período mostrado; `null` quando o período não existe nos dados do mapa. */
  periodo: PeriodoMapa | null;
  /** Rótulo do período ("2025") para as frases; `null` = todos os anos. */
  rotuloPeriodo: string | null;
  seletor: ReactNode;
};

/** Tons de laranja da escala (1 = mais claro, poucos artigos; NIVEIS = mais escuro). */
const NIVEIS = 5;
/** Nível do tom em escala logarítmica, relativa ao país com mais artigos no período. */
const nivel = (artigos: number, maximo: number) => (maximo <= 1 ? NIVEIS : Math.max(1, Math.ceil((Math.log(artigos + 1) / Math.log(maximo + 1)) * NIVEIS)));

/** Mapa-múndi com os países dos coautores: Brasil em azul, países parceiros em laranja (mais escuro = mais artigos). */
export default function MapaInternacional({ idioma, mapa, periodo, rotuloPeriodo, seletor }: Props) {
  const r = rotulos(idioma).mapa;
  const artigos = periodo?.artigos ?? {};
  const semDados = !periodo || periodo.artigosComPaises === 0;
  const maximo = periodo?.parceiros[0]?.artigos ?? 0;
  const classe = (iso2: string | null) => {
    if (!iso2 || !artigos[iso2]) return "mapa-internacional__pais";
    if (iso2 === "BR") return "mapa-internacional__pais mapa-internacional__pais--brasil";
    return `mapa-internacional__pais mapa-internacional__pais--nivel-${nivel(artigos[iso2], maximo)}`;
  };

  return (
    <figure className="mapa-internacional">
      <figcaption className="mapa-internacional__cabecalho">
        <span className="mapa-internacional__titulo">{r.titulo}</span>
        <span className="mapa-internacional__legenda">
          <span className="mapa-internacional__chave mapa-internacional__chave--brasil">{r.brasil}</span>
          <span className="mapa-internacional__escala">
            {r.parceiros} {maximo > 1 ? "1" : r.menos}
            <span className="mapa-internacional__degraus" aria-hidden="true">
              {Array.from({ length: NIVEIS }, (_, i) => (
                <span key={i} className={`mapa-internacional__degrau mapa-internacional__degrau--nivel-${i + 1}`} />
              ))}
            </span>
            {maximo > 1 ? r.artigos(maximo) : r.maisArtigos}
          </span>
          {periodo && !semDados && (
            <span className="mapa-internacional__resumo">
              {r.resumo(periodo.parceiros.length, periodo.artigosInternacionais, rotuloPeriodo)}
            </span>
          )}
        </span>
      </figcaption>

      {seletor}

      <div className="mapa-internacional__desenho">
        <svg
          className="mapa-internacional__svg"
          viewBox={`0 0 ${mapa.largura} ${mapa.altura}`}
          role="img"
          aria-label={
            semDados
              ? r.descricaoSemDados(rotuloPeriodo)
              : r.descricao(periodo.parceiros.map((p) => p.nome).join(", "))
          }
        >
          {mapa.paises.map((p, i) => (
            <path key={p.iso2 ?? `sem-codigo-${i}`} className={classe(p.iso2)} d={p.d}>
              <title>{p.iso2 && artigos[p.iso2] ? `${p.nome}: ${r.artigos(artigos[p.iso2])}` : p.nome}</title>
            </path>
          ))}
        </svg>
      </div>

      {semDados ? (
        <p className="mapa-internacional__nota">{r.semDados(rotuloPeriodo)}</p>
      ) : (
        <>
          <ul className="mapa-internacional__parceiros">
            {periodo.parceiros.map((p) => (
              <li key={p.iso2} className="mapa-internacional__parceiro">
                {p.nome} <span className="mapa-internacional__contagem">{p.artigos}</span>
              </li>
            ))}
          </ul>
          <p className="mapa-internacional__nota">{r.nota(periodo.artigosComPaises, periodo.totalArtigos, rotuloPeriodo)}</p>
        </>
      )}
    </figure>
  );
}
