import type { ReactNode } from "react";
import type { MapaInternacional as DadosMapa, PeriodoMapa } from "@/lib/internacional";

type Props = {
  mapa: DadosMapa;
  /** Período mostrado; `null` quando o período não existe nos dados do mapa. */
  periodo: PeriodoMapa | null;
  /** Rótulo do período ("Todos", "2025"), para as frases. */
  rotuloPeriodo: string;
  seletor: ReactNode;
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Tons de laranja da escala (1 = mais claro, poucos artigos; NIVEIS = mais escuro). */
const NIVEIS = 5;
/** Nível do tom em escala logarítmica, relativa ao país com mais artigos no período. */
const nivel = (artigos: number, maximo: number) => (maximo <= 1 ? NIVEIS : Math.max(1, Math.ceil((Math.log(artigos + 1) / Math.log(maximo + 1)) * NIVEIS)));

/** Mapa-múndi com os países dos coautores: Brasil em azul, países parceiros em laranja (mais escuro = mais artigos). */
export default function MapaInternacional({ mapa, periodo, rotuloPeriodo, seletor }: Props) {
  const artigos = periodo?.artigos ?? {};
  const semDados = !periodo || periodo.artigosComPaises === 0;
  const maximo = periodo?.parceiros[0]?.artigos ?? 0;
  const classe = (iso2: string | null) => {
    if (!iso2 || !artigos[iso2]) return "mapa-internacional__pais";
    if (iso2 === "BR") return "mapa-internacional__pais mapa-internacional__pais--brasil";
    return `mapa-internacional__pais mapa-internacional__pais--nivel-${nivel(artigos[iso2], maximo)}`;
  };
  const noPeriodo = rotuloPeriodo === "Todos" ? "" : ` em ${rotuloPeriodo}`;

  return (
    <figure className="mapa-internacional">
      <figcaption className="mapa-internacional__cabecalho">
        <span className="mapa-internacional__titulo">Países dos coautores</span>
        <span className="mapa-internacional__legenda">
          <span className="mapa-internacional__chave mapa-internacional__chave--brasil">Brasil</span>
          <span className="mapa-internacional__escala">
            Países parceiros: {maximo > 1 ? "1" : "menos"}
            <span className="mapa-internacional__degraus" aria-hidden="true">
              {Array.from({ length: NIVEIS }, (_, i) => (
                <span key={i} className={`mapa-internacional__degrau mapa-internacional__degrau--nivel-${i + 1}`} />
              ))}
            </span>
            {maximo > 1 ? plural(maximo, "artigo", "artigos") : "mais artigos"}
          </span>
          {periodo && !semDados && (
            <span className="mapa-internacional__resumo">
              {plural(periodo.parceiros.length, "país parceiro", "países parceiros")} · {plural(periodo.artigosInternacionais, "artigo", "artigos")} com coautoria
              internacional{noPeriodo}
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
              ? `Mapa-múndi sem dados de países${noPeriodo}.`
              : `Mapa-múndi: artigos com coautores de ${periodo.parceiros.map((p) => p.nome).join(", ")}. A lista abaixo traz os mesmos dados.`
          }
        >
          {mapa.paises.map((p, i) => (
            <path key={p.iso2 ?? `sem-codigo-${i}`} className={classe(p.iso2)} d={p.d}>
              <title>{p.iso2 && artigos[p.iso2] ? `${p.nome}: ${plural(artigos[p.iso2], "artigo", "artigos")}` : p.nome}</title>
            </path>
          ))}
        </svg>
      </div>

      {semDados ? (
        <p className="mapa-internacional__nota">Ainda não há dados de países dos autores para os artigos{noPeriodo}.</p>
      ) : (
        <>
          <ul className="mapa-internacional__parceiros">
            {periodo.parceiros.map((p) => (
              <li key={p.iso2} className="mapa-internacional__parceiro">
                {p.nome} <span className="mapa-internacional__contagem">{p.artigos}</span>
              </li>
            ))}
          </ul>
          <p className="mapa-internacional__nota">
            Países das instituições dos autores, informados em {periodo.artigosComPaises} de {plural(periodo.totalArtigos, "artigo", "artigos")}
            {noPeriodo}. O número ao lado de cada país é a quantidade de artigos em coautoria.
          </p>
        </>
      )}
    </figure>
  );
}
