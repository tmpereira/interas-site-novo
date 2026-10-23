// Leitura e validação de todo o conteúdo do site (content/*.json e content/noticias/*.md).
// Usado pelas páginas no build e pelo `npm run validar`.
// Qualquer erro interrompe o build com uma mensagem em português indicando arquivo, item e campo.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import {
  ARQUIVOS_JSON,
  CATEGORIAS_PESSOA,
  cabecalhoNoticia,
  idNoticia,
  type Grupo,
  type Home,
  type Noticia,
  type Pagina,
  type Patente,
  type Pessoa,
  type Publicacao,
  type Site,
  type Video,
} from "./esquemas.ts";

export const PASTA_CONTEUDO = path.join(process.cwd(), "content");
export const PASTA_NOTICIAS = path.join(PASTA_CONTEUDO, "noticias");
export const PASTA_PUBLICA = path.join(process.cwd(), "public");

export type Conteudo = {
  site: Site;
  home: Home;
  pessoas: Pessoa[];
  publicacoes: Publicacao[];
  patentes: Patente[];
  grupos: Grupo[];
  videos: Video[];
  paginas: Pagina[];
  noticias: Noticia[];
};

export type ResultadoValidacao = {
  conteudo: Conteudo | null;
  erros: string[];
  avisos: string[];
};

export class ErroConteudo extends Error {
  erros: string[];
  constructor(erros: string[]) {
    super(
      `Conteúdo inválido (${erros.length} ${erros.length === 1 ? "erro" : "erros"}):\n` +
        erros.map((e) => `  • ${e}`).join("\n"),
    );
    this.name = "ErroConteudo";
    this.erros = erros;
  }
}

// ---------------------------------------------------------------------------
// Ordem estável de cada coleção (usada para avisar quando o arquivo sai da ordem
// e pelos scripts que gravam os JSON)
// ---------------------------------------------------------------------------

const comparaTexto = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Pessoas: categoria (ordem de exibição), depois `ordem` (null por último), depois nome. */
export function compararPessoas(ordemCategorias: readonly string[] = CATEGORIAS_PESSOA) {
  return (a: Pessoa, b: Pessoa) =>
    ordemCategorias.indexOf(a.categoria) - ordemCategorias.indexOf(b.categoria) ||
    (a.ordem ?? Infinity) - (b.ordem ?? Infinity) ||
    comparaTexto(a.nome, b.nome);
}

/** Publicações: data decrescente, depois id. */
export const compararPublicacoes = (a: Publicacao, b: Publicacao) =>
  b.data.localeCompare(a.data) || a.id.localeCompare(b.id);

/** Patentes: data decrescente, depois id. */
export const compararPatentes = (a: Patente, b: Patente) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id);

/** Vídeos: data decrescente, depois slug. */
export const compararVideos = (a: Video, b: Video) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug);

/** Grupos: título em ordem alfabética. */
export const compararGrupos = (a: Grupo, b: Grupo) => comparaTexto(a.titulo, b.titulo);

/** Notícias: data decrescente, depois id. */
export const compararNoticias = (a: Noticia, b: Noticia) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Normaliza DOI para comparação: minúsculas e sem prefixo de URL. */
export function normalizarDoi(doi: string): string {
  return doi
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "");
}

/** Normaliza título para detectar duplicatas: sem acentos, pontuação e espaços extras. */
export function normalizarTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Descreve um item pelo seu identificador, para as mensagens de erro. */
function descreverItem(item: unknown): string {
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>;
    if (typeof o.slug === "string") return ` (slug "${o.slug}")`;
    if (typeof o.id === "string") return ` (id "${o.id}")`;
    if (typeof o.chave === "string") return ` (chave "${o.chave}")`;
    if (typeof o.titulo === "string") return ` ("${o.titulo}")`;
  }
  return "";
}

/** Converte os problemas do Zod em linhas "arquivo › item › campo: mensagem". */
function formatarProblemas(arquivo: string, erro: z.ZodError, dados: unknown): string[] {
  return erro.issues.map((p) => {
    let local = "";
    let atual: unknown = dados;
    for (const parte of p.path) {
      atual = (atual as Record<PropertyKey, unknown> | undefined)?.[parte as PropertyKey];
      if (typeof parte === "number") local += `[${parte}]${descreverItem(atual)}`;
      else local += `${local ? " › " : ""}${String(parte)}`;
    }
    const ausente = p.code === "invalid_type" && atual === undefined;
    const mensagem = ausente ? "campo obrigatório ausente (use null se não houver valor)" : p.message;
    return `${arquivo}${local ? ` › ${local}` : ""}: ${mensagem}`;
  });
}

/** Lê uma data do cabeçalho YAML (que pode virar objeto Date) como "AAAA-MM-DD". */
function dataYaml(valor: unknown): unknown {
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : valor;
}

function arquivoPublicoExiste(caminho: string): boolean {
  try {
    return fs.statSync(path.join(PASTA_PUBLICA, decodeURI(caminho.split(/[?#]/)[0]))).isFile();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/** Lê e valida todo o conteúdo. Não lança erro: devolve erros e avisos. */
export function validarConteudo(): ResultadoValidacao {
  const erros: string[] = [];
  const avisos: string[] = [];
  const lido: Record<string, unknown> = {};

  // 1. Arquivos JSON
  for (const [nome, esquema] of Object.entries(ARQUIVOS_JSON)) {
    const rel = `content/${nome}`;
    const caminho = path.join(PASTA_CONTEUDO, nome);
    if (!fs.existsSync(caminho)) {
      erros.push(`${rel}: arquivo não encontrado`);
      continue;
    }
    let dados: unknown;
    try {
      dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
    } catch (e) {
      erros.push(`${rel}: JSON mal formado — ${(e as Error).message}`);
      continue;
    }
    const r = (esquema as z.ZodType).safeParse(dados);
    if (r.success) lido[nome] = r.data;
    else erros.push(...formatarProblemas(rel, r.error, dados));
  }

  // 2. Notícias (um .md por notícia)
  const noticias: Noticia[] = [];
  const arquivosNoticias = fs.existsSync(PASTA_NOTICIAS)
    ? fs.readdirSync(PASTA_NOTICIAS).filter((f) => !f.startsWith("."))
    : [];
  for (const arquivo of arquivosNoticias.sort()) {
    const rel = `content/noticias/${arquivo}`;
    if (!arquivo.endsWith(".md")) {
      erros.push(`${rel}: só arquivos .md são permitidos nesta pasta`);
      continue;
    }
    const id = arquivo.slice(0, -3);
    const rId = idNoticia.safeParse(id);
    if (!rId.success) {
      erros.push(`${rel}: ${rId.error.issues[0].message}`);
      continue;
    }
    let lidoMd: matter.GrayMatterFile<string>;
    try {
      lidoMd = matter(fs.readFileSync(path.join(PASTA_NOTICIAS, arquivo), "utf8"));
    } catch (e) {
      erros.push(`${rel}: cabeçalho mal formado — ${(e as Error).message}`);
      continue;
    }
    const cabecalho = { ...lidoMd.data, data: dataYaml(lidoMd.data.data) };
    const r = cabecalhoNoticia.safeParse(cabecalho);
    if (!r.success) {
      erros.push(...formatarProblemas(`${rel} › cabeçalho`, r.error, cabecalho));
      continue;
    }
    if (r.data.data !== id.slice(0, 10)) {
      avisos.push(`${rel}: a data do cabeçalho (${r.data.data}) não coincide com a do nome do arquivo (${id.slice(0, 10)})`);
    }
    noticias.push({ ...r.data, id, corpo: lidoMd.content });
  }

  if (erros.length > 0) return { conteudo: null, erros, avisos };

  const conteudo: Conteudo = {
    site: lido["site.json"] as Site,
    home: lido["home.json"] as Home,
    pessoas: (lido["pessoas.json"] as { pessoas: Pessoa[] }).pessoas,
    publicacoes: (lido["publicacoes.json"] as { publicacoes: Publicacao[] }).publicacoes,
    patentes: (lido["patentes.json"] as { patentes: Patente[] }).patentes,
    grupos: (lido["grupos.json"] as { grupos: Grupo[] }).grupos,
    videos: (lido["videos.json"] as { videos: Video[] }).videos,
    paginas: (lido["paginas.json"] as { paginas: Pagina[] }).paginas,
    noticias: [...noticias].sort(compararNoticias),
  };

  verificarReferencias(conteudo, erros, avisos);
  return { conteudo: erros.length > 0 ? null : conteudo, erros, avisos };
}

/** Checagens entre coleções: ids únicos, referências existentes, imagens, ordem dos arquivos. */
function verificarReferencias(c: Conteudo, erros: string[], avisos: string[]) {
  const { site, home, pessoas, publicacoes, patentes, grupos, videos, paginas, noticias } = c;

  // Identificadores únicos
  const unicos = <T>(arquivo: string, lista: T[], chave: (x: T) => string, nomeCampo: string) => {
    const vistos = new Set<string>();
    for (const item of lista) {
      const k = chave(item);
      if (vistos.has(k)) erros.push(`${arquivo}: ${nomeCampo} "${k}" aparece mais de uma vez`);
      vistos.add(k);
    }
    return vistos;
  };
  const slugsPessoas = unicos("content/pessoas.json", pessoas, (p) => p.slug, "slug");
  const slugsGrupos = unicos("content/grupos.json", grupos, (g) => g.slug, "slug");
  unicos("content/publicacoes.json", publicacoes, (p) => p.id, "id");
  unicos("content/patentes.json", patentes, (p) => p.id, "id");
  unicos("content/videos.json", videos, (v) => v.slug, "slug");
  unicos("content/paginas.json", paginas, (p) => p.slug, "slug");
  const slugsTemas = unicos("content/site.json › temas_grupos", site.temas_grupos, (t) => t.slug, "slug");
  const chavesCategorias = unicos("content/site.json › categorias_pessoas", site.categorias_pessoas, (t) => t.chave, "chave");
  for (const cat of CATEGORIAS_PESSOA) {
    if (!chavesCategorias.has(cat)) erros.push(`content/site.json › categorias_pessoas: falta o título da categoria "${cat}"`);
  }

  // Referências
  const conferir = (arquivo: string, item: string, campo: string, valores: string[], validos: Set<string>, alvo: string) => {
    for (const v of valores) {
      if (!validos.has(v)) erros.push(`${arquivo} › ${item} › ${campo}: "${v}" não existe em ${alvo}`);
    }
  };
  for (const p of pessoas) conferir("content/pessoas.json", `slug "${p.slug}"`, "grupos", p.grupos, slugsGrupos, "grupos.json");
  for (const p of publicacoes) {
    conferir("content/publicacoes.json", `id "${p.id}"`, "pessoas", p.pessoas, slugsPessoas, "pessoas.json");
    conferir("content/publicacoes.json", `id "${p.id}"`, "grupos", p.grupos, slugsGrupos, "grupos.json");
  }
  for (const p of patentes) conferir("content/patentes.json", `id "${p.id}"`, "pessoas", p.pessoas, slugsPessoas, "pessoas.json");
  for (const g of grupos) {
    conferir("content/grupos.json", `slug "${g.slug}"`, "coordenacao", g.coordenacao, slugsPessoas, "pessoas.json");
    conferir("content/grupos.json", `slug "${g.slug}"`, "temas", g.temas, slugsTemas, "temas_grupos de site.json");
  }

  // Publicações: ano coerente com a data e duplicatas
  const porDoi = new Map<string, string>();
  const porTitulo = new Map<string, string>();
  for (const p of publicacoes) {
    if (String(p.ano) !== p.data.slice(0, 4)) {
      erros.push(`content/publicacoes.json › id "${p.id}": ano (${p.ano}) diferente do ano da data (${p.data})`);
    }
    if (p.doi) {
      const d = normalizarDoi(p.doi);
      const outro = porDoi.get(d);
      if (outro) erros.push(`content/publicacoes.json: "${p.id}" e "${outro}" têm o mesmo DOI (${p.doi})`);
      porDoi.set(d, p.id);
    } else {
      const t = `${normalizarTitulo(p.titulo)}|${p.ano}`;
      const outro = porTitulo.get(t);
      if (outro) avisos.push(`content/publicacoes.json: "${p.id}" e "${outro}" parecem duplicadas (mesmo título e ano, sem DOI)`);
      porTitulo.set(t, p.id);
    }
  }

  // Imagens referenciadas precisam existir em public/
  const imagens: [string, string | null][] = [
    ["content/site.json › logo", site.logo],
    ["content/site.json › favicon", site.favicon],
    ["content/site.json › imagem_compartilhamento", site.imagem_compartilhamento],
    ["content/site.json › rodape › logo", site.rodape.logo],
    ["content/home.json › hero › imagem", home.hero.imagem],
    ...home.destaques.map((d, i): [string, string] => [`content/home.json › destaques[${i}] ("${d.titulo}") › imagem`, d.imagem]),
    ...pessoas.map((p): [string, string | null] => [`content/pessoas.json › slug "${p.slug}" › foto`, p.foto]),
    ...grupos.map((g): [string, string | null] => [`content/grupos.json › slug "${g.slug}" › imagem`, g.imagem]),
    ...videos.map((v): [string, string | null] => [`content/videos.json › slug "${v.slug}" › capa`, v.capa]),
    ...noticias.map((n): [string, string] => [`content/noticias/${n.id}.md › imagem`, n.imagem]),
  ];
  for (const [onde, caminho] of imagens) {
    if (caminho && !arquivoPublicoExiste(caminho)) erros.push(`${onde}: arquivo "public${caminho}" não encontrado`);
  }

  // Ordem dos arquivos (só aviso: não quebra o site, mas suja os diffs)
  const emOrdem = <T>(arquivo: string, lista: T[], comparar: (a: T, b: T) => number, regra: string) => {
    for (let i = 1; i < lista.length; i++) {
      if (comparar(lista[i - 1], lista[i]) > 0) {
        avisos.push(`${arquivo}: itens fora da ordem esperada (${regra}), a partir do item ${i}${descreverItem(lista[i])}`);
        return;
      }
    }
  };
  const ordemCategorias = site.categorias_pessoas.map((c) => c.chave);
  emOrdem("content/pessoas.json", pessoas, compararPessoas(ordemCategorias), "categoria, ordem, nome");
  emOrdem("content/publicacoes.json", publicacoes, compararPublicacoes, "data decrescente, id");
  emOrdem("content/patentes.json", patentes, compararPatentes, "data decrescente, id");
  emOrdem("content/videos.json", videos, compararVideos, "data decrescente, slug");
  emOrdem("content/grupos.json", grupos, compararGrupos, "título alfabético");
}

// ---------------------------------------------------------------------------
// Acesso pelas páginas
// ---------------------------------------------------------------------------

let cache: Conteudo | null = null;

/**
 * Devolve todo o conteúdo validado. Lança ErroConteudo se houver qualquer erro.
 * Em produção (build) lê os arquivos uma vez; em desenvolvimento relê a cada chamada,
 * para que edições nos JSON apareçam sem reiniciar o `npm run dev`.
 */
export function carregarConteudo(): Conteudo {
  if (cache) return cache;
  const { conteudo, erros, avisos } = validarConteudo();
  for (const a of avisos) console.warn(`Aviso: ${a}`);
  if (!conteudo) throw new ErroConteudo(erros);
  if (process.env.NODE_ENV === "production") cache = conteudo;
  return conteudo;
}
