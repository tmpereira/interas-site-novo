// Publicações: _legado/INTERAS_20260415_ate202604.bib → content/publicacoes.json
// Também cruza os autores com pessoas.json para preencher `pessoas`.

import fs from "node:fs";
import path from "node:path";
import { parse } from "@retorquere/bibtex-parser";
import type { Pessoa, Publicacao } from "../../src/lib/esquemas.ts";
import { doi as esquemaDoi, url as esquemaUrl } from "../../src/lib/esquemas.ts";
import { compararPublicacoes } from "../../src/lib/conteudo.ts";
import { compararAutor } from "../../src/lib/autores.ts";
import { FONTE_BIB, LEGADO, redirecionar, relatorio } from "./util.ts";

const ARQUIVO_BIB = "INTERAS_20260415_ate202604.bib";

type Criador = { lastName?: string; firstName?: string; name?: string };

/**
 * Limpa a marcação que o parser produz a partir do LaTeX:
 * <i>/<em> → *itálico*, <b>/<strong> → **negrito**, <p> → parágrafo,
 * <span style=...> (versalete) → texto puro. Espaços repetidos são colapsados.
 */
export function limparTextoBib(texto: string): string {
  return texto
    .replace(/<\/?(i|em)>/g, "*")
    .replace(/<\/?(b|strong)>/g, "**")
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/g, "$1")
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<\/?p>/g, "\n\n")
    .split(/\n{2,}/)
    .map((par) => par.replace(/\s+/g, " ").replace(/\*\s+([^*]+?)\s*\*/g, "*$1*").trim())
    .filter(Boolean)
    .join("\n\n");
}

function texto(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  const t = limparTextoBib(String(valor));
  return t === "" ? null : t;
}

function nomeAutor(c: Criador): string {
  if (c.name) return c.name.trim();
  return [c.lastName, c.firstName].filter(Boolean).join(", ").replace(/\s+/g, " ").trim();
}

/** "2024" → 2024-01-01; "2024-03" → 2024-03-01. */
function normalizarData(valor: string): string {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
  if (/^\d{4}$/.test(v)) return `${v}-01-01`;
  throw new Error(`data inesperada no .bib: "${valor}"`);
}

export function migrarPublicacoes(): Publicacao[] {
  const bib = fs.readFileSync(path.join(LEGADO, ARQUIVO_BIB), "utf8");
  // english: false → não aplica "sentence case" (mantém a capitalização dos títulos)
  const lib = parse(bib, { english: false, unsupported: "tex" });
  for (const e of lib.errors) relatorio.anotar("Publicações: avisos do parser BibTeX", JSON.stringify(e));

  const publicacoes: Publicacao[] = [];
  for (const entrada of lib.entries) {
    const f = entrada.fields as Record<string, unknown>;
    const onde = `${ARQUIVO_BIB} › ${entrada.key}`;

    const data = normalizarData(String(f.date ?? f.year ?? ""));
    let doi = f.doi ? String(f.doi).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : null;
    if (doi && !esquemaDoi.safeParse(doi).success) {
      relatorio.anotar("Publicações: DOI inválido descartado", `${onde}: "${doi}"`);
      doi = null;
    }
    let url = f.url ? String(f.url).trim() : null;
    if (url && !esquemaUrl.safeParse(url).success) {
      relatorio.anotar("Publicações: URL inválida descartada", `${onde}: "${url}"`);
      url = null;
    }
    const autores = ((f.author as Criador[] | undefined) ?? []).map(nomeAutor).filter(Boolean);
    if (autores.length === 0) relatorio.anotar("Publicações: sem autores no .bib", entrada.key);

    const palavras = f.keywords;
    publicacoes.push({
      id: entrada.key,
      tipo: entrada.type === "article" ? "artigo" : "outro",
      titulo: texto(f.title) ?? "",
      autores,
      ano: Number(data.slice(0, 4)),
      data,
      periodico: texto(f.journaltitle),
      volume: texto(f.volume),
      numero: texto(f.number ?? f.issue),
      paginas: texto(f.pages),
      doi,
      url,
      resumo: texto(f.abstract),
      palavras_chave: Array.isArray(palavras) ? palavras.map(String) : palavras ? [String(palavras)] : [],
      pessoas: [],
      grupos: [],
      citacoes: null,
      fator_impacto: null,
      qualis: null,
      fonte: FONTE_BIB,
    });
    redirecionar(`publicacoes/artigos/${entrada.key}.qmd`, `/publicacoes/${entrada.key}/`);
  }

  // Observações para o relatório
  for (const p of publicacoes) {
    if (p.tipo === "outro") relatorio.anotar("Publicações: entradas @misc (tipo \"outro\")", `${p.id}: ${p.titulo}`);
    if (p.titulo === p.titulo.toUpperCase()) relatorio.anotar("Publicações: títulos todos em maiúsculas (mantidos como no .bib)", `${p.id}: ${p.titulo}`);
    if (/\\/.test(`${p.titulo} ${p.resumo ?? ""}`)) relatorio.anotar("Publicações: barra invertida (\\) restante no texto", p.id);
    if (!p.doi) relatorio.anotar("Publicações: sem DOI", `${p.id}: ${p.titulo}`);
  }
  const semResumo = publicacoes.filter((p) => !p.resumo).length;
  relatorio.anotar("Publicações: campos vazios", `${semResumo} sem resumo; ${publicacoes.filter((p) => !p.periodico).length} sem periódico; ${publicacoes.filter((p) => !p.volume).length} sem volume`);

  return publicacoes.sort(compararPublicacoes);
}

// ---------------------------------------------------------------------------
// Cruzamento de autores com pessoas.json
// ---------------------------------------------------------------------------

/** Preenche `publicacao.pessoas` com correspondências seguras; lista as duvidosas no relatório. */
export function cruzarAutores(publicacoes: Publicacao[], pessoas: Pessoa[]) {
  let seguros = 0;
  const porPessoa = new Map<string, number>();
  for (const pub of publicacoes) {
    for (const autor of pub.autores) {
      const candidatos = pessoas
        .map((p) => ({ p, r: compararAutor(autor, p.nome) }))
        .filter((c) => c.r !== null);
      if (candidatos.length === 0) continue;
      if (candidatos.length > 1) {
        relatorio.anotar(
          "Publicações: autores com mais de uma pessoa possível (não marcados)",
          `${pub.id}: "${autor}" → ${candidatos.map((c) => c.p.slug).join(", ")}`,
        );
        continue;
      }
      const { p, r } = candidatos[0];
      if (r === "duvidoso") {
        relatorio.anotar("Publicações: correspondências duvidosas (não marcadas)", `${pub.id}: "${autor}" → ${p.slug} (${p.nome})`);
        continue;
      }
      if (r === "seguro-iniciais") {
        relatorio.anotar("Publicações: marcadas pelas iniciais (sobrenome pouco comum) — conferir", `${pub.id}: "${autor}" → ${p.slug}`);
      }
      if (!pub.pessoas.includes(p.slug)) {
        pub.pessoas.push(p.slug);
        seguros++;
        porPessoa.set(p.slug, (porPessoa.get(p.slug) ?? 0) + 1);
      }
    }
  }
  const comPessoa = publicacoes.filter((p) => p.pessoas.length > 0).length;
  relatorio.anotar(
    "Publicações: cruzamento de autores",
    `${seguros} vínculos autor→pessoa em ${comPessoa} de ${publicacoes.length} publicações; ${porPessoa.size} pessoas com ao menos uma publicação`,
  );
  const semPub = pessoas.filter((p) => !porPessoa.has(p.slug) && ["coordenacao", "comite-gestor", "pesquisador", "lider-laboratorio"].includes(p.categoria));
  for (const p of semPub) relatorio.anotar("Publicações: pesquisadores sem nenhuma publicação vinculada", `${p.slug} (${p.categoria})`);
}
