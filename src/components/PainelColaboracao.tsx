"use client";

import { useState } from "react";
import MapaInternacional from "@/components/MapaInternacional";
import RedeCoautoria from "@/components/RedeCoautoria";
import type { Idioma } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import type { MapaInternacional as DadosMapa } from "@/lib/internacional";
import type { Rede } from "@/lib/rede";

type Props = { idioma: Idioma; rede: Rede; mapa: DadosMapa };

/**
 * Seções "Colaboração entre pesquisadores" (rede de coautoria) e "Internacionalização" (mapa),
 * com um único período escolhido: as pílulas aparecem nas duas e ficam sincronizadas.
 */
export default function PainelColaboracao({ idioma, rede, mapa }: Props) {
  const r = rotulos(idioma);
  const [chave, setChave] = useState(rede.periodos[0].chave);
  const periodoRede = rede.periodos.find((p) => p.chave === chave) ?? rede.periodos[0];
  const periodoMapa = mapa.periodos.find((p) => p.chave === periodoRede.chave) ?? null;
  /** Período para as frases ("2025"); `null` = todos os anos. */
  const rotuloPeriodo = periodoRede.chave === "todos" ? null : periodoRede.rotulo;

  const seletor = (
    <div className="seletor-periodo" role="group" aria-label={r.numeros.escolherPeriodo}>
      {rede.periodos.map((p) => (
        <button key={p.chave} type="button" className="seletor-periodo__opcao" aria-pressed={p.chave === periodoRede.chave} onClick={() => setChave(p.chave)}>
          {p.chave === "todos" ? r.comum.todos : p.rotulo}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="secao-numeros" aria-labelledby="numeros-coautoria">
        <h2 id="numeros-coautoria" className="secao-numeros__titulo">
          {r.numeros.colaboracao}
        </h2>
        <RedeCoautoria idioma={idioma} rede={rede} periodo={periodoRede} rotuloPeriodo={rotuloPeriodo} seletor={seletor} />
      </section>

      <section className="secao-numeros" aria-labelledby="numeros-internacional">
        <h2 id="numeros-internacional" className="secao-numeros__titulo">
          {r.numeros.internacionalizacao}
        </h2>
        <MapaInternacional idioma={idioma} mapa={mapa} periodo={periodoMapa} rotuloPeriodo={rotuloPeriodo} seletor={seletor} />
      </section>
    </>
  );
}
