import type { PontoGrafico } from "@/lib/consultas";

type Props = {
  titulo: string;
  /** Texto curto abaixo do título (o que é medido). */
  descricao?: string;
  pontos: PontoGrafico[];
  /** Nome da unidade para leitores de tela e dica ao passar o mouse (ex.: "artigos"). */
  unidade: string;
  casasDecimais?: number;
  /** Topo da escala; gráficos lado a lado usam o mesmo máximo para serem comparáveis. */
  maximo?: number;
  /** Observação abaixo do gráfico (cobertura dos dados, ano incompleto...). */
  nota?: string;
  /** Versão menor, para gráficos lado a lado. */
  compacto?: boolean;
};

const formatar = (valor: number, casas: number) => valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/**
 * Gráfico de barras verticais simples, renderizado no build.
 * Cada barra é um SVG esticado na altura da coluna; valores e anos ficam em HTML.
 */
export default function GraficoBarras({ titulo, descricao, pontos, unidade, casasDecimais = 0, maximo, nota, compacto = false }: Props) {
  const topo = maximo ?? Math.max(...pontos.map((p) => p.valor), 1);
  return (
    <figure className={`grafico-barras${compacto ? " grafico-barras--compacto" : ""}`}>
      <figcaption className="grafico-barras__cabecalho">
        <span className="grafico-barras__titulo">{titulo}</span>
        {descricao && <span className="grafico-barras__descricao">{descricao}</span>}
      </figcaption>
      <ol className="grafico-barras__colunas">
        {pontos.map((p) => {
          const valor = formatar(p.valor, casasDecimais);
          return (
            <li key={p.rotulo} className="grafico-barras__coluna" title={`${p.rotulo}: ${valor} ${unidade}`}>
              <span className="grafico-barras__valor" aria-hidden="true">
                {valor}
              </span>
              <svg className="grafico-barras__barra" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x="0" y={100 - (p.valor / topo) * 100} width="10" height={(p.valor / topo) * 100} />
              </svg>
              <span className="grafico-barras__rotulo" aria-hidden="true">
                {compacto && /^\d{4}$/.test(p.rotulo) ? `’${p.rotulo.slice(2)}` : p.rotulo}
              </span>
              <span className="somente-leitor">
                {p.rotulo}: {valor} {unidade}
              </span>
            </li>
          );
        })}
      </ol>
      {nota && <p className="grafico-barras__nota">{nota}</p>}
    </figure>
  );
}
