// Gera src/lib/mapa-mundi.json (contornos dos países em SVG) — rodado UMA vez; o site não depende
// destes pacotes. Para regenerar, numa pasta temporária fora do projeto:
//   npm i world-atlas@2 topojson-client@3 d3-geo@3 i18n-iso-countries@7
//   node gerar-mapa-mundi.mjs <caminho>/src/lib/mapa-mundi.json
// Dados: Natural Earth 1:110m (domínio público). Projeção Natural Earth, 1000 × 520.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { feature } = require("topojson-client");
const { geoNaturalEarth1, geoPath } = require("d3-geo");
const paises = require("i18n-iso-countries");
paises.registerLocale(require("i18n-iso-countries/langs/pt.json"));
const topo = require("world-atlas/countries-110m.json");
// O i18n-iso-countries traz os nomes dos dois Congos trocados em português
const CORRECOES_NOMES = { CD: "República Democrática do Congo", CG: "República do Congo" };
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== "Antarctica");
const W = 1000, H = 520;
const proj = geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], fc);
const path = geoPath(proj).digits(0);
const lista = fc.features.map((f) => {
  const iso2 = f.id ? paises.numericToAlpha2(f.id) : null;
  return { iso2: iso2 ?? null, nome: iso2 ? (CORRECOES_NOMES[iso2] ?? paises.getName(iso2, "pt")) : f.properties.name, d: path(f) };
}).filter((p) => p.d);
lista.sort((a, b) => (a.iso2 ?? "ZZ").localeCompare(b.iso2 ?? "ZZ") || a.nome.localeCompare(b.nome));
const saida = { fonte: "Natural Earth 1:110m (domínio público), via world-atlas@2; projeção Natural Earth", largura: W, altura: H, paises: lista };
fs.writeFileSync(process.argv[2], JSON.stringify(saida) + "\n");
console.log(lista.length, "países;", lista.filter((p) => !p.iso2).map((p) => p.nome).join(", "), "sem código");
