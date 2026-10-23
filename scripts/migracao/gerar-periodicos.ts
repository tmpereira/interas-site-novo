// Gera content/periodicos.json a partir do .bib antigo + publicacoes.json.
// Uso: node scripts/migracao/gerar-periodicos.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from '@retorquere/bibtex-parser';

const bib = parse(readFileSync('_legado/INTERAS_20260415_ate202604.bib', 'utf8'));
const pubs = JSON.parse(readFileSync('content/publicacoes.json', 'utf8')).publicacoes;

const limpa = (s: string) => s.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
const chave = (s: string) =>
  limpa(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s: string) => chave(s).replace(/ /g, '-');

const porId = new Map<string, any>();
for (const e of bib.entries) porId.set(e.key, e.fields);

const grupos = new Map<string, any>();
const semPeriodico: string[] = [];
for (const p of pubs) {
  if (!p.periodico) { semPeriodico.push(p.id); continue; }
  const k = chave(p.periodico);
  const g = grupos.get(k) ?? { nomes: new Map<string, number>(), abrev: new Map<string, number>(), issn: new Set<string>(), editora: new Set<string>(), anos: [] as number[], n: 0 };
  grupos.set(k, g);
  g.n++;
  g.anos.push(p.ano);
  g.nomes.set(p.periodico, (g.nomes.get(p.periodico) ?? 0) + 1);
  const f = porId.get(p.id);
  if (f) {
    if (f.issn) String(f.issn).split(/[,;]/).map((x) => x.trim()).filter(Boolean).forEach((x) => g.issn.add(x));
    if (f.shortjournal) { const a = limpa(String(f.shortjournal)); g.abrev.set(a, (g.abrev.get(a) ?? 0) + 1); }
    if (f.publisher) g.editora.add(limpa(String(f.publisher)));
  }
}
const maisComum = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

const lista = [...grupos.values()].map((g) => ({
  slug: slug(maisComum(g.nomes)!),
  nome: maisComum(g.nomes),
  abreviacao: maisComum(g.abrev),
  issn: [...g.issn].sort(),
  editora: g.editora.size ? [...g.editora][0] : null,
  quantidade_publicacoes: g.n,
  primeiro_ano: Math.min(...g.anos),
  ultimo_ano: Math.max(...g.anos),
})).sort((a, b) => a.nome!.localeCompare(b.nome!, 'pt'));

writeFileSync('content/periodicos.json', JSON.stringify({ periodicos: lista }, null, 2) + '\n');
console.log('periódicos:', lista.length, '| sem ISSN:', lista.filter((x) => !x.issn.length).length, '| pubs sem periódico:', semPeriodico.length);
console.log('slugs repetidos:', lista.length - new Set(lista.map((x) => x.slug)).size);
