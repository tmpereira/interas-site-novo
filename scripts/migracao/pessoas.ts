// Pessoas: _legado/pessoas/<pasta>/*.qmd → content/pessoas.json + public/fotos/pessoas/

import fs from "node:fs";
import path from "node:path";
import type { CategoriaPessoa, Pessoa } from "../../src/lib/esquemas.ts";
import { url as esquemaUrl } from "../../src/lib/esquemas.ts";
import { compararPessoas } from "../../src/lib/conteudo.ts";
import { LEGADO, copiarParaPublico, dividirPorTitulo, lerQmd, redirecionar, rel, relatorio } from "./util.ts";

/** Pasta antiga → categoria nova. */
export const PASTAS_CATEGORIAS: Record<string, CategoriaPessoa> = {
  coordenacao: "coordenacao",
  "membro-do-comite-gestor": "comite-gestor",
  pesquisador: "pesquisador",
  colaborador: "colaborador",
  "equipe-estrangeira": "equipe-estrangeira",
  "lider-de-laboratorio-associado": "lider-laboratorio",
  "apoio-tecnico": "apoio-tecnico",
  bolsista: "bolsista",
};

/** Títulos das seções em pessoas/coord-equipe.qmd, na ordem em que aparecem lá. */
export const TITULOS_CATEGORIAS: { chave: CategoriaPessoa; titulo: string }[] = [
  { chave: "coordenacao", titulo: "COORDENAÇÃO" },
  { chave: "comite-gestor", titulo: "COMITÊ GESTOR" },
  { chave: "pesquisador", titulo: "PESQUISADORES" },
  { chave: "colaborador", titulo: "COLABORADORES" },
  { chave: "equipe-estrangeira", titulo: "EQUIPE ESTRANGEIRA" },
  { chave: "lider-laboratorio", titulo: "LÍDERES DE LABORATÓRIOS ASSOCIADOS" },
  { chave: "apoio-tecnico", titulo: "APOIO TÉCNICO" },
  { chave: "bolsista", titulo: "BOLSISTAS" },
];

type LinkAbout = { icon?: string; text?: string; href?: string };

/** Valida um endereço; vazio vira null, inválido vira null e vai para o relatório. */
function urlOuNull(valor: unknown, onde: string): string | null {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v) return null;
  if (esquemaUrl.safeParse(v).success) return v;
  relatorio.anotar("Pessoas: links inválidos descartados", `${onde}: "${v}"`);
  return null;
}

/** Texto de uma seção do corpo; "-" ou vazio vira null. */
function textoSecao(secoes: { titulo: string; texto: string }[], titulo: string): string | null {
  const s = secoes.find((x) => x.titulo.toLowerCase() === titulo.toLowerCase());
  if (!s) return null;
  const t = s.texto.replace(/ /g, " ").trim();
  return t === "" || t === "-" ? null : t;
}

export function migrarPessoas(): Pessoa[] {
  const pessoas: Pessoa[] = [];
  const fotosUsadas = new Set<string>();

  for (const [pasta, categoria] of Object.entries(PASTAS_CATEGORIAS)) {
    const dir = path.join(LEGADO, "pessoas", pasta);
    for (const nomeArquivo of fs.readdirSync(dir).filter((f) => f.endsWith(".qmd")).sort()) {
      const arquivo = path.join(dir, nomeArquivo);
      const { meta, corpo } = lerQmd(arquivo);
      const slug = nomeArquivo.replace(/\.qmd$/, "");
      const onde = rel(arquivo);
      const about = (meta.about ?? {}) as { image?: string; links?: LinkAbout[] };
      const links = about.links ?? [];
      const link = (texto: string) => links.find((l) => (l.text ?? "").toLowerCase() === texto)?.href;

      // Corpo: seções "### Instituição", "### Áreas de Atuação", "### Atuação no Projeto"
      const { secoes } = dividirPorTitulo(corpo, 3);
      const titulos = secoes.map((s) => s.titulo);
      for (const t of titulos) {
        if (!["Instituição", "Áreas de Atuação", "Atuação no Projeto"].includes(t)) {
          relatorio.anotar("Pessoas: seções inesperadas no corpo (ignoradas)", `${onde}: "${t}"`);
        }
      }

      // Instituição: "[Nome](url)" ou texto simples
      let instituicao: Pessoa["instituicao"] = null;
      const textoInst = textoSecao(secoes, "Instituição");
      if (textoInst) {
        const m = textoInst.match(/^\[([^\]]+)\]\(([^)]*)\)\s*$/);
        const nome = (m ? m[1] : textoInst).replace(/\s+/g, " ").trim();
        const urlInst = urlOuNull(m ? m[2] : link("instituição"), `${onde} › instituição`);
        instituicao = { nome, url: urlInst };
      }

      // Foto
      let foto: string | null = null;
      if (about.image) {
        const origem = path.join(dir, about.image);
        const ext = path.extname(about.image).toLowerCase();
        foto = copiarParaPublico(origem, `/fotos/pessoas/${slug}${ext}`);
        fotosUsadas.add(path.resolve(origem));
      }

      const areas = textoSecao(secoes, "Áreas de Atuação");
      const atuacao = textoSecao(secoes, "Atuação no Projeto");
      const pessoa: Pessoa = {
        slug,
        nome: String(meta.title ?? "").trim(),
        categoria,
        cargo: meta.subtitle ? String(meta.subtitle).trim() : null,
        ordem: null,
        foto,
        instituicao,
        grupos: [],
        lattes: urlOuNull(link("lattes"), `${onde} › lattes`),
        scholar: urlOuNull(link("scholar"), `${onde} › scholar`),
        orcid: null,
        areas,
        atuacao,
        ativo: true,
      };
      pessoas.push(pessoa);
      redirecionar(path.join("pessoas", pasta, nomeArquivo), `/equipe/${slug}/`);
    }
  }

  // Fotos que existem nas pastas antigas mas não são usadas por ninguém
  for (const pasta of Object.keys(PASTAS_CATEGORIAS)) {
    const dirFotos = path.join(LEGADO, "pessoas", pasta, "fotos");
    if (!fs.existsSync(dirFotos)) continue;
    for (const f of fs.readdirSync(dirFotos)) {
      const p = path.resolve(dirFotos, f);
      if (!fotosUsadas.has(p)) relatorio.anotar("Arquivos não copiados (sem referência)", rel(p));
    }
  }

  redirecionar("pessoas/coord-equipe.qmd", "/equipe/");
  const ordem = TITULOS_CATEGORIAS.map((c) => c.chave);
  return pessoas.sort(compararPessoas(ordem));
}
