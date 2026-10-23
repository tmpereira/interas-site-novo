// Grupos: _legado/grupos/*.qmd → content/grupos.json + public/images/grupos/
// O trecho antes de ::: {.panel-tabset} vira `conteudo`; cada aba "### " vira um item de `abas`.

import fs from "node:fs";
import path from "node:path";
import type { Grupo, Pessoa } from "../../src/lib/esquemas.ts";
import { compararGrupos } from "../../src/lib/conteudo.ts";
import {
  LEGADO,
  copiarParaPublico,
  dividirPorTitulo,
  imagensDoMarkdown,
  lerQmd,
  quartoParaMarkdown,
  redirecionar,
  rel,
  relatorio,
  slugificar,
} from "./util.ts";

/** Instituição-sede de cada grupo, conforme o texto "Com sede no/na ..." de cada página. */
const INSTITUICOES: Record<string, string> = {
  "lab-biofotonica": "IPEN-CNEN",
  "resgroup-cinas": "IPEN-CNEN",
  "lab-cardioimunologia": "UFRJ",
  "lab-imunologiacardio-ufabc": "UFABC",
  "lab-investigacaomedica28": "FMUSP",
};

/** Temas usados nos grupos antigos (slug → rótulo exibido no filtro antigo). */
export const temasEncontrados = new Map<string, string>();

export function migrarGrupos(pessoas: Pessoa[]): Grupo[] {
  const grupos: Grupo[] = [];
  const slugsPessoas = new Set(pessoas.map((p) => p.slug));
  const dir = path.join(LEGADO, "grupos");

  for (const nomeArquivo of fs.readdirSync(dir).filter((f) => f.endsWith(".qmd")).sort()) {
    const arquivo = path.join(dir, nomeArquivo);
    const onde = rel(arquivo);
    const { meta, corpo } = lerQmd(arquivo);
    const slug = slugificar(nomeArquivo.replace(/\.qmd$/, ""));

    // Separa o trecho antes das abas e o conteúdo das abas
    const [antes, ...resto] = corpo.split(/^:{3,}\s*\{\.panel-tabset\}\s*$/m);
    let abasTexto = resto.join("\n");
    abasTexto = abasTexto.replace(/\n:{3,}\s*$/, ""); // fechamento do panel-tabset
    const { secoes } = dividirPorTitulo(abasTexto, 3);

    const conteudo = quartoParaMarkdown(antes, { arquivo: onde });
    const abas = secoes.map((s) => ({ titulo: s.titulo, conteudo: quartoParaMarkdown(s.texto, { arquivo: onde }) }));

    // Coordenação: pessoas linkadas na seção "#### Coordenação" das abas
    const textoAbas = abas.map((a) => a.conteudo).join("\n");
    const coordSecao = dividirPorTitulo(textoAbas, 4).secoes.find((s) => s.titulo === "Coordenação")?.texto ?? "";
    const coordenacao = [...coordSecao.matchAll(/\]\(\/equipe\/([^/]+)\/\)/g)].map((m) => m[1]);
    if (coordenacao.length === 0) relatorio.anotar("Grupos: sem coordenação identificada", onde);

    // Membros com link para perfil → `grupos` da pessoa
    const linkados = new Set([...`${conteudo}\n${textoAbas}`.matchAll(/\]\(\/equipe\/([^/]+)\/\)/g)].map((m) => m[1]));
    for (const s of linkados) {
      if (!slugsPessoas.has(s)) relatorio.anotar("Grupos: link para pessoa inexistente", `${onde}: ${s}`);
      const p = pessoas.find((x) => x.slug === s);
      if (p && !p.grupos.includes(slug)) p.grupos.push(slug);
    }

    // Site do laboratório: link "Visite a [página ...](url)"
    const site = conteudo.match(/Visite a \[[^\]]*\]\((https?:[^)]+)\)/)?.[1] ?? null;

    // Temas
    const categorias = (meta.categories as string[] | undefined) ?? [];
    const temas = categorias.map((c) => {
      const t = slugificar(c);
      temasEncontrados.set(t, c);
      return t;
    });

    // Imagens: capa e fotos no corpo
    const imagem = meta.image ? String(meta.image) : null;
    for (const img of [imagem, ...imagensDoMarkdown(`${conteudo}\n${textoAbas}`)]) {
      if (!img) continue;
      const original = decodeURI(img);
      const nomeOriginal = fs
        .readdirSync(path.join(LEGADO, "images", "grupos"))
        .find((f) => f.replace(/\s+/g, "-").replace(/-{2,}/g, "-") === path.basename(original));
      if (!nomeOriginal) relatorio.anotar("Arquivos ausentes", `${onde}: imagem ${img}`);
      else copiarParaPublico(path.join(LEGADO, "images", "grupos", nomeOriginal), img);
    }

    grupos.push({
      slug,
      titulo: String(meta.title).trim(),
      resumo: meta.description ? String(meta.description).trim() : null,
      imagem,
      temas,
      instituicao: INSTITUICOES[slug] ?? null,
      site,
      coordenacao,
      abas,
      conteudo,
    });
    redirecionar(`grupos/${nomeArquivo}`, `/grupos/${slug}/`);
  }
  redirecionar("grupos.qmd", "/grupos/");
  return grupos.sort(compararGrupos);
}
