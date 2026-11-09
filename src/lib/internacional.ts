// Internacionalização: artigos por país (campo `paises` das publicações) e contornos do mapa-múndi.

import { carregarConteudo } from "./conteudo.ts";
import { nomeCurtoPais, nomePaisEn } from "./consultas.ts";
import type { Publicacao } from "./esquemas.ts";
import { type Idioma, LOCALE } from "./i18n/rotas.ts";
import mapaMundi from "./mapa-mundi.json" with { type: "json" };

/** Contorno de um país no mapa (gerado por scripts/ferramentas/gerar-mapa-mundi.mjs). */
export type PaisMapa = { iso2: string | null; nome: string; d: string };

export type PeriodoMapa = {
  /** "todos" ou o ano ("2025"), as mesmas chaves dos períodos da rede de coautoria. */
  chave: string;
  /** Artigos por país (código ISO de 2 letras), inclusive o Brasil. */
  artigos: Record<string, number>;
  /** Países estrangeiros com nome curto e número de artigos, do maior para o menor. */
  parceiros: { iso2: string; nome: string; artigos: number }[];
  totalArtigos: number;
  artigosComPaises: number;
  /** Artigos com pelo menos um país além do Brasil. */
  artigosInternacionais: number;
};

export type MapaInternacional = {
  largura: number;
  altura: number;
  paises: PaisMapa[];
  periodos: PeriodoMapa[];
};

function periodo(chave: string, publicacoes: Publicacao[], idioma: Idioma): PeriodoMapa {
  const comPaises = publicacoes.filter((p) => p.paises && p.paises.length > 0);
  const artigos: Record<string, number> = {};
  for (const p of comPaises) for (const c of new Set(p.paises)) artigos[c] = (artigos[c] ?? 0) + 1;
  const parceiros = Object.entries(artigos)
    .filter(([iso2]) => iso2 !== "BR")
    .map(([iso2, n]) => ({ iso2, nome: nomeCurtoPais(iso2, idioma), artigos: n }))
    .sort((a, b) => b.artigos - a.artigos || a.nome.localeCompare(b.nome, LOCALE[idioma]));
  const artigosInternacionais = comPaises.filter((p) => p.paises?.some((c) => c !== "BR")).length;
  return { chave, artigos, parceiros, totalArtigos: publicacoes.length, artigosComPaises: comPaises.length, artigosInternacionais };
}

/** Dados do mapa no idioma: os nomes dos países no arquivo do mapa estão em português. */
export function mapaInternacional(idioma: Idioma): MapaInternacional {
  const { publicacoes } = carregarConteudo();
  const anos = [...new Set(publicacoes.map((p) => p.ano))].sort((a, b) => a - b);
  return {
    largura: mapaMundi.largura,
    altura: mapaMundi.altura,
    paises: idioma === "pt" ? mapaMundi.paises : mapaMundi.paises.map((p) => ({ ...p, nome: (p.iso2 && nomePaisEn(p.iso2)) || p.nome })),
    periodos: [periodo("todos", publicacoes, idioma), ...anos.map((ano) => periodo(String(ano), publicacoes.filter((p) => p.ano === ano), idioma))],
  };
}
