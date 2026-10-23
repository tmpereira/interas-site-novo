"use client";

import { useState } from "react";
import MapaInternacional from "@/components/MapaInternacional";
import RedeCoautoria from "@/components/RedeCoautoria";
import type { MapaInternacional as DadosMapa } from "@/lib/internacional";
import type { Rede } from "@/lib/rede";

type Props = { rede: Rede; mapa: DadosMapa };

/**
 * Seções "Colaboração entre pesquisadores" (rede de coautoria) e "Internacionalização" (mapa),
 * com um único período escolhido: as pílulas aparecem nas duas e ficam sincronizadas.
 */
export default function PainelColaboracao({ rede, mapa }: Props) {
  const [chave, setChave] = useState(rede.periodos[0].chave);
  const periodoRede = rede.periodos.find((p) => p.chave === chave) ?? rede.periodos[0];
  const periodoMapa = mapa.periodos.find((p) => p.chave === periodoRede.chave) ?? null;

  const seletor = (
    <div className="seletor-periodo" role="group" aria-label="Escolher o período">
      {rede.periodos.map((p) => (
        <button key={p.chave} type="button" className="seletor-periodo__opcao" aria-pressed={p.chave === periodoRede.chave} onClick={() => setChave(p.chave)}>
          {p.rotulo}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <section className="secao-numeros" aria-labelledby="numeros-coautoria">
        <h2 id="numeros-coautoria" className="secao-numeros__titulo">
          Colaboração entre pesquisadores
        </h2>
        <RedeCoautoria rede={rede} periodo={periodoRede} seletor={seletor} />
      </section>

      <section className="secao-numeros" aria-labelledby="numeros-internacional">
        <h2 id="numeros-internacional" className="secao-numeros__titulo">
          Internacionalização
        </h2>
        <MapaInternacional mapa={mapa} periodo={periodoMapa} rotuloPeriodo={periodoRede.rotulo} seletor={seletor} />
      </section>
    </>
  );
}
