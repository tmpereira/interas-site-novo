// `npm run migrar`: migração ÚNICA do site Quarto (_legado/) para content/ e public/.
// Apaga e regera tudo o que produz; pode ser rodado de novo enquanto a migração estiver em revisão.
// Depois de aprovada, o site não depende mais destes scripts.

import fs from "node:fs";
import path from "node:path";
import { validarConteudo } from "../../src/lib/conteudo.ts";
import { migrarGrupos, temasEncontrados } from "./grupos.ts";
import { migrarNoticias } from "./noticias.ts";
import { migrarPaginas } from "./paginas.ts";
import { migrarPatentes } from "./patentes.ts";
import { migrarPessoas } from "./pessoas.ts";
import { cruzarAutores, migrarPublicacoes } from "./publicacoes.ts";
import { migrarHome, migrarSite } from "./site.ts";
import {
  CONTEUDO,
  LEGADO,
  PASTA_MIGRACAO,
  PUBLICO,
  copiados,
  gravarJson,
  listarArquivos,
  redirecionamentos,
  rel,
  relatorio,
} from "./util.ts";
import { migrarVideos } from "./videos.ts";

// 0. Conferir _legado/
for (const item of ["_quarto.yml", "pessoas", "publicacoes", "noticias", "grupos", "videos", "images", "INTERAS_20260415_ate202604.bib"]) {
  if (!fs.existsSync(path.join(LEGADO, item))) throw new Error(`_legado/ incompleta: falta ${item}`);
}

// 1. Limpar o que a migração gera
for (const nome of fs.readdirSync(CONTEUDO)) {
  if (nome.endsWith(".json")) fs.rmSync(path.join(CONTEUDO, nome));
}
for (const pasta of [path.join(CONTEUDO, "noticias"), ...["images", "fotos", "noticias", "videos", "arquivos"].map((p) => path.join(PUBLICO, p))]) {
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
}

// 2. Migrar cada coleção
const pessoas = migrarPessoas();
const publicacoes = migrarPublicacoes();
const grupos = migrarGrupos(pessoas); // também preenche pessoa.grupos
cruzarAutores(publicacoes, pessoas);
const patentes = migrarPatentes();
const videos = migrarVideos();
const totalNoticias = migrarNoticias();
const paginas = migrarPaginas();
const site = migrarSite(temasEncontrados);
const home = migrarHome();

gravarJson("site.json", site);
gravarJson("home.json", home);
gravarJson("pessoas.json", { $schema: "./schemas/pessoas.schema.json", pessoas });
gravarJson("publicacoes.json", { $schema: "./schemas/publicacoes.schema.json", publicacoes });
gravarJson("patentes.json", { $schema: "./schemas/patentes.schema.json", patentes });
gravarJson("grupos.json", { $schema: "./schemas/grupos.schema.json", grupos });
gravarJson("videos.json", { $schema: "./schemas/videos.schema.json", videos });
gravarJson("paginas.json", { $schema: "./schemas/paginas.schema.json", paginas });
fs.mkdirSync(path.join(PUBLICO, "fotos", "pessoas"), { recursive: true });

// 3. Arquivos antigos que não foram copiados por não serem usados
const IMAGEM_OU_PDF = /\.(png|jpe?g|gif|webp|svg|ico|pdf)$/i;
for (const arquivo of [...listarArquivos(path.join(LEGADO, "images")), ...listarArquivos(path.join(LEGADO, "videos"))]) {
  if (IMAGEM_OU_PDF.test(arquivo) && !copiados.has(path.resolve(arquivo))) {
    relatorio.anotar("Arquivos não copiados (sem referência)", rel(arquivo));
  }
}
relatorio.anotar(
  "Arquivos não copiados (sem referência)",
  "Obs.: images/2026-INTERAS-ProgramaPreliminar.pdf não é linkado em nenhuma página, por isso não foi para public/arquivos/",
);

// 4. Redirecionamentos (URL antiga → rota nova)
redirecionamentos.sort((a, b) => a.de.localeCompare(b.de));
fs.writeFileSync(path.join(PASTA_MIGRACAO, "redirecionamentos.json"), JSON.stringify(redirecionamentos, null, 2) + "\n");

// 5. Validação
const { erros, avisos } = validarConteudo();

// 6. Relatório
const contar = (dir: string, filtro: (f: string) => boolean) => fs.readdirSync(path.join(LEGADO, dir)).filter(filtro).length;
const qmd = (f: string) => f.endsWith(".qmd");
const pessoasAntes = fs
  .readdirSync(path.join(LEGADO, "pessoas"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .reduce((n, d) => n + contar(path.join("pessoas", d.name), qmd), 0);

const linhas: string[] = [
  "# Relatório da migração Quarto → content/",
  "",
  `Gerado por \`npm run migrar\` em ${new Date().toISOString().slice(0, 10)}. Fonte: \`_legado/\` (cópia de interas-inct/interaswebsite).`,
  "",
  "## Contagens",
  "",
  "| Tipo | Antes (site Quarto) | Depois (content/) |",
  "|---|---|---|",
  `| Pessoas | ${pessoasAntes} arquivos .qmd | ${pessoas.length} em pessoas.json |`,
  `| Publicações | ${contar("publicacoes/artigos", qmd)} .qmd / 356 entradas no .bib | ${publicacoes.length} em publicacoes.json |`,
  `| Patentes | ${contar("publicacoes/patentes", qmd)} .qmd | ${patentes.length} em patentes.json |`,
  `| Grupos | ${contar("grupos", qmd)} .qmd | ${grupos.length} em grupos.json |`,
  `| Notícias | ${contar("noticias/posts", (f) => !f.startsWith("_"))} pastas | ${totalNoticias} arquivos em content/noticias/ |`,
  `| Vídeos | ${contar("videos/videos_arqs", qmd)} .qmd | ${videos.length} em videos.json |`,
  `| Páginas | 3 institucionais + 5 listagens | ${paginas.length} em paginas.json |`,
  `| Arquivos copiados para public/ | — | ${copiados.size} |`,
  `| Redirecionamentos | — | ${redirecionamentos.length} em scripts/migracao/redirecionamentos.json |`,
  "",
  "## Diferença 368 × 356 artigos",
  "",
  "A pasta `publicacoes/artigos/` tem exatamente 356 `.qmd`, com as mesmas chaves das 356 entradas do `.bib` (nenhuma sobrando de um lado ou de outro).",
  "No site no ar, a listagem de `/publicacoes/` tem 367 itens = 356 artigos + 11 patentes. O número 368 corresponde a essa listagem (mais a página-índice), não a artigos faltando.",
  "",
  "## Campos vazios",
  "",
  `- Pessoas sem foto: ${pessoas.filter((p) => !p.foto).length} de ${pessoas.length} (só a coordenação tinha foto no site antigo)`,
  `- Pessoas sem Lattes: ${pessoas.filter((p) => !p.lattes).length} — ${pessoas.filter((p) => !p.lattes).map((p) => p.slug).join(", ") || "nenhuma"}`,
  `- Pessoas sem Google Scholar: ${pessoas.filter((p) => !p.scholar).length}`,
  `- Pessoas sem instituição: ${pessoas.filter((p) => !p.instituicao).length} — ${pessoas.filter((p) => !p.instituicao).map((p) => p.slug).join(", ") || "nenhuma"}`,
  `- Pessoas com "Áreas de Atuação" vazia ("-"): ${pessoas.filter((p) => !p.areas).length}`,
  `- Pessoas com "Atuação no Projeto" vazia: ${pessoas.filter((p) => !p.atuacao).length} — ${pessoas.filter((p) => !p.atuacao).map((p) => p.slug).join(", ") || "nenhuma"}`,
  `- Pessoas sem grupo: ${pessoas.filter((p) => p.grupos.length === 0).length} (o vínculo pessoa→grupo só existe quando a página do grupo tinha link para o perfil)`,
  "",
];
for (const secao of relatorio.secoes.values()) {
  linhas.push(`## ${secao.titulo}`, "", ...secao.linhas.map((l) => `- ${l}`), "");
}
linhas.push("## Validação (`npm run validar`)", "");
linhas.push(erros.length ? `**${erros.length} erro(s):**` : "Sem erros.", ...erros.map((e) => `- ${e}`), "");
if (avisos.length) linhas.push(`${avisos.length} aviso(s):`, ...avisos.map((a) => `- ${a}`), "");
fs.writeFileSync(path.join(PASTA_MIGRACAO, "RELATORIO.md"), linhas.join("\n"));

console.log(`Migração concluída: ${pessoas.length} pessoas, ${publicacoes.length} publicações, ${patentes.length} patentes, ${grupos.length} grupos, ${totalNoticias} notícias, ${videos.length} vídeos, ${paginas.length} páginas.`);
console.log(`Relatório: scripts/migracao/RELATORIO.md`);
if (erros.length) {
  console.error(`\n✗ ${erros.length} erro(s) de validação:`);
  for (const e of erros) console.error(`  • ${e}`);
  process.exit(1);
}
console.log("✓ Validação sem erros" + (avisos.length ? ` (${avisos.length} avisos)` : ""));
