// Leitura e validação de todo o conteúdo do site (content/*.json, content/noticias/*.md e as
// versões em inglês das notícias em content/noticias/en/*.md).
// Usado pelas páginas no build e pelo `npm run validar`.
// Qualquer erro interrompe o build com uma mensagem em português indicando arquivo, item e campo.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import {
  ARQUIVOS_JSON,
  CATEGORIAS_PESSOA,
  arquivoHome,
  arquivoSite,
  cabecalhoNoticia,
  cabecalhoNoticiaEn,
  grupo,
  idNoticia,
  pagina,
  patente,
  pessoa,
  video,
  type Aluno,
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
import type { Idioma } from "./i18n/rotas.ts";
import { localizar, type Pendencia, verificarTraducoes } from "./i18n/traduzir.ts";

export const PASTA_CONTEUDO = path.join(process.cwd(), "content");
export const PASTA_NOTICIAS = path.join(PASTA_CONTEUDO, "noticias");
/** Versões em inglês das notícias: mesmo nome de arquivo do original. */
export const PASTA_NOTICIAS_EN = path.join(PASTA_NOTICIAS, "en");
export const PASTA_PUBLICA = path.join(process.cwd(), "public");

export type Conteudo = {
  site: Site;
  home: Home;
  pessoas: Pessoa[];
  alunos: Aluno[];
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
  /** Campos traduzíveis ainda sem a versão em inglês, por arquivo (seção 13.8 do CLAUDE.md). */
  pendenciasTraducao: Record<string, Pendencia[]>;
  /** Ids das notícias sem versão em inglês (elas não aparecem em /en/; não é erro). */
  noticiasSemIngles: string[];
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
  const pendenciasTraducao: Record<string, Pendencia[]> = {};

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
    if (r.success) {
      lido[nome] = r.data;
      const t = verificarTraducoes(esquema as z.ZodType, r.data);
      erros.push(...t.erros.map((e) => `${rel} › ${e}`));
      if (t.pendencias.length > 0) pendenciasTraducao[rel] = t.pendencias;
    } else erros.push(...formatarProblemas(rel, r.error, dados));
  }

  // 2. Notícias (um .md por notícia)
  const noticias: Noticia[] = [];
  const arquivosNoticias = fs.existsSync(PASTA_NOTICIAS)
    ? fs.readdirSync(PASTA_NOTICIAS).filter((f) => !f.startsWith(".") && f !== "en")
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

  // 3. Versões em inglês das notícias (content/noticias/en/<mesmo nome>.md)
  const arquivosEn = fs.existsSync(PASTA_NOTICIAS_EN) ? fs.readdirSync(PASTA_NOTICIAS_EN).filter((f) => !f.startsWith(".")) : [];
  for (const arquivo of arquivosEn.sort()) {
    const rel = `content/noticias/en/${arquivo}`;
    const original = noticias.find((n) => `${n.id}.md` === arquivo);
    if (!original) {
      erros.push(`${rel}: não existe a notícia original content/noticias/${arquivo} (a versão em inglês deve ter o mesmo nome de arquivo)`);
      continue;
    }
    let lidoMd: matter.GrayMatterFile<string>;
    try {
      lidoMd = matter(fs.readFileSync(path.join(PASTA_NOTICIAS_EN, arquivo), "utf8"));
    } catch (e) {
      erros.push(`${rel}: cabeçalho mal formado — ${(e as Error).message}`);
      continue;
    }
    const r = cabecalhoNoticiaEn.safeParse(lidoMd.data);
    if (!r.success) {
      erros.push(...formatarProblemas(`${rel} › cabeçalho`, r.error, lidoMd.data));
      continue;
    }
    if (!lidoMd.content.trim()) erros.push(`${rel}: o texto da notícia está vazio`);
    if ((original.categorias?.length ?? 0) > 0 && !r.data.categorias?.length) {
      (pendenciasTraducao[rel] ??= []).push({ local: "cabeçalho", campo: "categorias" });
    }
    original.en = { ...r.data, corpo: lidoMd.content };
  }
  const noticiasSemIngles = noticias.filter((n) => !n.en).map((n) => n.id);

  if (erros.length > 0) return { conteudo: null, erros, avisos, pendenciasTraducao, noticiasSemIngles };

  const conteudo: Conteudo = {
    site: lido["site.json"] as Site,
    home: lido["home.json"] as Home,
    pessoas: (lido["pessoas.json"] as { pessoas: Pessoa[] }).pessoas,
    alunos: (lido["alunos.json"] as { alunos: Aluno[] }).alunos,
    publicacoes: (lido["publicacoes.json"] as { publicacoes: Publicacao[] }).publicacoes,
    patentes: (lido["patentes.json"] as { patentes: Patente[] }).patentes,
    grupos: (lido["grupos.json"] as { grupos: Grupo[] }).grupos,
    videos: (lido["videos.json"] as { videos: Video[] }).videos,
    paginas: (lido["paginas.json"] as { paginas: Pagina[] }).paginas,
    noticias: [...noticias].sort(compararNoticias),
  };

  verificarReferencias(conteudo, erros, avisos);
  return { conteudo: erros.length > 0 ? null : conteudo, erros, avisos, pendenciasTraducao, noticiasSemIngles };
}

/** Checagens entre coleções: ids únicos, referências existentes, imagens, ordem dos arquivos. */
function verificarReferencias(c: Conteudo, erros: string[], avisos: string[]) {
  const { site, home, pessoas, alunos, publicacoes, patentes, grupos, videos, paginas, noticias } = c;

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
  alunos.forEach((a, i) =>
    conferir("content/alunos.json", `[${i}] ("${a.nome}")`, "orientador", [a.orientador], slugsPessoas, "pessoas.json"),
  );
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

const cacheIdiomas = new Map<Idioma, Conteudo>();

/**
 * Conteúdo no idioma da página. Em português, é o próprio `carregarConteudo()`. Em inglês,
 * cada campo traduzível vem da versão `_en` (quando preenchida; senão fica o português) e as
 * notícias são só as que têm versão em inglês, com título, resumo, categorias e texto dela.
 * Coleções que não se traduzem (publicações, alunos) ficam como estão.
 */
export function conteudoNoIdioma(idioma: Idioma): Conteudo {
  const c = carregarConteudo();
  if (idioma === "pt") return c;
  const guardado = cacheIdiomas.get(idioma);
  if (guardado) return guardado;
  const lista = <T>(esquema: z.ZodType, itens: T[]) => itens.map((i) => localizar(esquema, i, idioma));
  const traduzido: Conteudo = {
    ...c,
    site: localizar(arquivoSite, c.site, idioma),
    home: localizar(arquivoHome, c.home, idioma),
    pessoas: lista(pessoa, c.pessoas),
    patentes: lista(patente, c.patentes),
    grupos: lista(grupo, c.grupos),
    videos: lista(video, c.videos),
    paginas: lista(pagina, c.paginas),
    noticias: c.noticias.flatMap((n) =>
      n.en
        ? [{ ...n, titulo: n.en.titulo, resumo: n.en.resumo ?? null, categorias: n.en.categorias?.length ? n.en.categorias : n.categorias, corpo: n.en.corpo }]
        : [],
    ),
  };
  if (process.env.NODE_ENV === "production") cacheIdiomas.set(idioma, traduzido);
  return traduzido;
}
