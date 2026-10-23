// Utilitários da migração única do site Quarto (_legado/) para content/.

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const RAIZ = process.cwd();
export const LEGADO = path.join(RAIZ, "_legado");
export const CONTEUDO = path.join(RAIZ, "content");
export const PUBLICO = path.join(RAIZ, "public");
export const PASTA_MIGRACAO = path.join(RAIZ, "scripts", "migracao");

/** Data de geração do .bib usado como fonte das publicações. */
export const FONTE_BIB = "bib-2026-04-15";

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

type Secao = { titulo: string; linhas: string[] };

/** Acumula as observações da migração para o RELATORIO.md. */
export class Relatorio {
  secoes = new Map<string, Secao>();

  anotar(secao: string, linha: string) {
    if (!this.secoes.has(secao)) this.secoes.set(secao, { titulo: secao, linhas: [] });
    this.secoes.get(secao)!.linhas.push(linha);
  }
}

export const relatorio = new Relatorio();

// ---------------------------------------------------------------------------
// Leitura dos .qmd
// ---------------------------------------------------------------------------

export type Qmd = { meta: Record<string, unknown>; corpo: string; arquivo: string };

/** Lê um .qmd: cabeçalho YAML + corpo. */
export function lerQmd(arquivo: string): Qmd {
  const texto = fs.readFileSync(arquivo, "utf8").replace(/\r\n/g, "\n");
  const m = texto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, corpo: texto, arquivo };
  return { meta: (YAML.parse(m[1]) ?? {}) as Record<string, unknown>, corpo: m[2], arquivo };
}

/** Caminho relativo a _legado/, para mensagens. */
export function rel(arquivo: string): string {
  return path.relative(LEGADO, arquivo);
}

/**
 * Divide um texto Markdown em seções pelo nível de título indicado.
 * Devolve o trecho antes do primeiro título e a lista de seções.
 */
export function dividirPorTitulo(texto: string, nivel: number) {
  const marca = "#".repeat(nivel) + " ";
  const linhas = texto.split("\n");
  const antes: string[] = [];
  const secoes: { titulo: string; linhas: string[] }[] = [];
  let emCodigo = false;
  for (const linha of linhas) {
    if (linha.startsWith("```")) emCodigo = !emCodigo;
    if (!emCodigo && linha.startsWith(marca)) secoes.push({ titulo: linha.slice(marca.length).trim(), linhas: [] });
    else if (secoes.length) secoes[secoes.length - 1].linhas.push(linha);
    else antes.push(linha);
  }
  return {
    antes: antes.join("\n"),
    secoes: secoes.map((s) => ({ titulo: s.titulo, texto: s.linhas.join("\n") })),
  };
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

/** Minúsculas, sem acentos, só letras/números separados por hífen. */
export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nome de arquivo seguro para URL: troca espaços por hífen (mantém o resto). */
export function nomeArquivoSeguro(nome: string): string {
  return nome.replace(/\s+/g, "-").replace(/-{2,}/g, "-");
}

/** Normaliza linhas em branco: tira espaços no fim das linhas e colapsa 3+ quebras. */
export function limparMarkdown(texto: string): string {
  return texto
    .replace(/ /g, " ")
    .split("\n")
    .map((l) => (/^\s*$/.test(l) ? "" : l.replace(/[ \t]+$/, (m) => (m.length >= 2 ? "  " : ""))))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Conversão Quarto → Markdown padrão
// ---------------------------------------------------------------------------

/** Mapeia links internos antigos (.qmd/.html) para as rotas novas. */
export function converterLinkInterno(href: string): string {
  let m = href.match(/^\/?pessoas\/[^/]+\/([^/.]+)\.(qmd|html)$/);
  if (m) return `/equipe/${m[1]}/`;
  m = href.match(/^\/?videos\/videos_arqs\/([^/.]+)\.(qmd|html)$/);
  if (m) return `/videos/${slugificar(m[1])}/`;
  if (/^\/?videos\/(index\.(qmd|html))?$/.test(href)) return "/videos/";
  if (/^\/?noticias\/(index\.(qmd|html))?$/.test(href)) return "/noticias/";
  if (/^\/?publicacoes\/(index\.(qmd|html))?$/.test(href)) return "/publicacoes/";
  m = href.match(/^\/?grupos\.(qmd|html)(#category=(.*))?$/);
  if (m) return m[3] ? `/grupos/?tema=${slugificar(decodeURIComponent(m[3]))}` : "/grupos/";
  return href;
}

/**
 * Converte o Markdown do Quarto para Markdown padrão:
 * - remove atributos {target="_blank"}, {.lightbox}, {width=...};
 * - callouts (::: {.callout-*}) viram citações (>), com o título em negrito;
 * - demais blocos ::: (colunas, cartões, grade) são removidos, mantendo o conteúdo;
 * - links internos .qmd viram rotas novas;
 * - imagens relativas ganham o prefixo `prefixoImagens`.
 */
export function quartoParaMarkdown(texto: string, opcoes: { prefixoImagens?: string; arquivo: string }): string {
  const saida: string[] = [];
  // Pilha de blocos ::: abertos: true = callout (linhas viram citação)
  const pilha: boolean[] = [];
  for (const linhaOriginal of texto.replace(/\r\n/g, "\n").split("\n")) {
    const abre = linhaOriginal.match(/^:{3,}\s*\{([^}]*)\}\s*$/) ?? linhaOriginal.match(/^:{3,}\s*([.#][^\s].*)$/);
    if (abre) {
      const attrs = abre[1];
      const callout = /\.callout-/.test(attrs);
      pilha.push(callout);
      if (callout) {
        const titulo = attrs.match(/title="([^"]*)"/)?.[1];
        saida.push("");
        if (titulo) saida.push(`> **${titulo}**`, ">");
      }
      continue;
    }
    if (/^:{3,}\s*$/.test(linhaOriginal)) {
      if (pilha.length === 0) relatorio.anotar("Conversão de texto", `${opcoes.arquivo}: fechamento ::: sem abertura (ignorado)`);
      else if (pilha.pop()) saida.push("");
      continue;
    }

    let linha = linhaOriginal
      .replace(/\$\^\{(\d+)\}\\text\{([^}]*)\}\$/g, (_t, n: string, resto: string) => sobrescrito(n) + resto)
      .replace(/(\]\([^)]*\))\{[^}]*\}/g, "$1")
      .replace(/\]\(([^)\s]+)\)/g, (_t, href: string) => `](${converterLinkInterno(href)})`);

    if (opcoes.prefixoImagens) {
      linha = linha.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (t, alt: string, src: string) =>
        /^(https?:|\/)/.test(src) ? t : `![${alt}](${opcoes.prefixoImagens}/${nomeArquivoSeguro(src)})`,
      );
    }
    linha = linha.replace(/!\[([^\]]*)\]\(\/([^)]+)\)/g, (_t, alt: string, src: string) => `![${alt}](/${nomeArquivoSeguro(src)})`);

    if (pilha.includes(true)) linha = linha === "" ? ">" : `> ${linha}`;
    saida.push(linha);
  }
  if (pilha.length) relatorio.anotar("Conversão de texto", `${opcoes.arquivo}: ${pilha.length} bloco(s) ::: sem fechamento`);
  return limparMarkdown(compactarCitacoes(saida).join("\n"));
}

/** Dígitos em sobrescrito Unicode (ex.: "18" → "¹⁸"). */
function sobrescrito(numero: string): string {
  return [...numero].map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");
}

/** Remove linhas ">" vazias repetidas, no início ou no fim de uma citação. */
function compactarCitacoes(linhas: string[]): string[] {
  const ehCitacao = (l: string | undefined) => l !== undefined && l.startsWith(">");
  const ehVazia = (l: string | undefined) => l !== undefined && /^>\s*$/.test(l);
  const saida: string[] = [];
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (ehVazia(l)) {
      const anterior = saida[saida.length - 1];
      let j = i + 1;
      while (ehVazia(linhas[j])) j++;
      if (!ehCitacao(anterior) || ehVazia(anterior) || !ehCitacao(linhas[j])) continue;
    }
    saida.push(l);
  }
  return saida;
}

/** Imagens referenciadas num texto Markdown (caminhos como aparecem). */
export function imagensDoMarkdown(texto: string): string[] {
  return [...texto.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Arquivos
// ---------------------------------------------------------------------------

/** Grava um JSON com 2 espaços e quebra de linha final. */
export function gravarJson(nome: string, dados: unknown) {
  const destino = path.join(CONTEUDO, nome);
  fs.writeFileSync(destino, JSON.stringify(dados, null, 2) + "\n");
}

/** Arquivos de public/ copiados nesta migração (para o relatório). */
export const copiados = new Set<string>();

/** Copia um arquivo de _legado/ para public/, criando pastas. Devolve o caminho público ("/..."). */
export function copiarParaPublico(origem: string, destinoPublico: string): string {
  if (!fs.existsSync(origem)) {
    relatorio.anotar("Arquivos ausentes", `${rel(origem)} (esperado em public${destinoPublico})`);
    return destinoPublico;
  }
  const destino = path.join(PUBLICO, destinoPublico);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
  copiados.add(path.resolve(origem));
  return destinoPublico;
}

/** Lista recursiva de arquivos de uma pasta. */
export function listarArquivos(pasta: string): string[] {
  if (!fs.existsSync(pasta)) return [];
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(pasta, e.name);
    return e.isDirectory() ? listarArquivos(p) : [p];
  });
}

// ---------------------------------------------------------------------------
// Redirecionamentos (URL antiga → nova)
// ---------------------------------------------------------------------------

export const redirecionamentos: { de: string; para: string }[] = [];

/** Registra a URL antiga gerada a partir de um .qmd (relativo a _legado/) e a rota nova. */
export function redirecionar(qmdRelativo: string, para: string) {
  const de = "/" + qmdRelativo.replace(/\\/g, "/").replace(/\.qmd$/, ".html");
  redirecionamentos.push({ de, para });
}
