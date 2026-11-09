// `npm run validar`: confere todos os JSON de content/ e as notícias, sem gerar o site.
//
// Traduções para o inglês (seção 13.8 do CLAUDE.md):
//   npm run validar                  resumo por arquivo dos campos ainda sem `_en` (só aviso)
//   npm run validar -- --en          lista cada item e campo sem tradução
//   npm run validar -- --en-estrito  campos sem tradução viram erro (usar antes de publicar);
//                                    notícias sem versão em inglês não contam (elas só não aparecem em /en/)

import { validarConteudo } from "../src/lib/conteudo.ts";

const detalhar = process.argv.includes("--en");
const estrito = process.argv.includes("--en-estrito");

const { conteudo, erros, avisos, pendenciasTraducao, noticiasSemIngles } = validarConteudo();

for (const a of avisos) console.warn(`⚠ ${a}`);

if (!conteudo) {
  console.error(`\n✗ Conteúdo inválido (${erros.length} ${erros.length === 1 ? "erro" : "erros"}):`);
  for (const e of erros) console.error(`  • ${e}`);
  process.exit(1);
}

// Traduções pendentes
const totalPendentes = Object.values(pendenciasTraducao).reduce((s, l) => s + l.length, 0);
if (totalPendentes > 0 || noticiasSemIngles.length > 0) {
  console.warn(`\n⚠ Tradução para o inglês${detalhar ? "" : " (detalhes: npm run validar -- --en)"}:`);
  for (const [arquivo, lista] of Object.entries(pendenciasTraducao)) {
    const itens = new Set(lista.map((p) => p.local)).size;
    console.warn(`  ${arquivo}: ${lista.length} ${lista.length === 1 ? "campo" : "campos"} sem tradução em ${itens} ${itens === 1 ? "item" : "itens"}`);
    if (detalhar) {
      const porLocal = new Map<string, string[]>();
      for (const p of lista) porLocal.set(p.local, [...(porLocal.get(p.local) ?? []), p.campo]);
      for (const [local, campos] of porLocal) console.warn(`    - ${local || "(raiz)"}: ${campos.map((c) => `${c}_en`).join(", ")}`);
    }
  }
  if (noticiasSemIngles.length > 0) {
    console.warn(`  content/noticias: ${noticiasSemIngles.length} de ${conteudo.noticias.length} notícias sem versão em inglês (não aparecem em /en/)`);
    if (detalhar) for (const id of noticiasSemIngles) console.warn(`    - ${id}`);
  }
}

if (estrito && totalPendentes > 0) {
  console.error(`\n✗ --en-estrito: ${totalPendentes} ${totalPendentes === 1 ? "campo traduzível está" : "campos traduzíveis estão"} sem a versão em inglês.`);
  process.exit(1);
}

console.log(
  [
    "\n✓ Conteúdo válido:",
    `  ${conteudo.pessoas.length} pessoas`,
    `  ${conteudo.alunos.length} alunos`,
    `  ${conteudo.publicacoes.length} publicações`,
    `  ${conteudo.patentes.length} patentes`,
    `  ${conteudo.grupos.length} grupos`,
    `  ${conteudo.noticias.length} notícias (${conteudo.noticias.length - noticiasSemIngles.length} em inglês)`,
    `  ${conteudo.videos.length} vídeos`,
    `  ${conteudo.paginas.length} páginas`,
    avisos.length ? `  (${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"})` : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
