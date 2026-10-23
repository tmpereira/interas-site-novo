// `npm run validar`: confere todos os JSON de content/ e as notícias, sem gerar o site.

import { validarConteudo } from "../src/lib/conteudo.ts";

const { conteudo, erros, avisos } = validarConteudo();

for (const a of avisos) console.warn(`⚠ ${a}`);

if (!conteudo) {
  console.error(`\n✗ Conteúdo inválido (${erros.length} ${erros.length === 1 ? "erro" : "erros"}):`);
  for (const e of erros) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(
  [
    "✓ Conteúdo válido:",
    `  ${conteudo.pessoas.length} pessoas`,
    `  ${conteudo.alunos.length} alunos`,
    `  ${conteudo.publicacoes.length} publicações`,
    `  ${conteudo.patentes.length} patentes`,
    `  ${conteudo.grupos.length} grupos`,
    `  ${conteudo.noticias.length} notícias`,
    `  ${conteudo.videos.length} vídeos`,
    `  ${conteudo.paginas.length} páginas`,
    avisos.length ? `  (${avisos.length} ${avisos.length === 1 ? "aviso" : "avisos"})` : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
