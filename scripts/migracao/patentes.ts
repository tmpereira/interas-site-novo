// Patentes: _legado/publicacoes/patentes/*.qmd → content/patentes.json

import fs from "node:fs";
import path from "node:path";
import type { Patente } from "../../src/lib/esquemas.ts";
import { compararPatentes } from "../../src/lib/conteudo.ts";
import { LEGADO, lerQmd, quartoParaMarkdown, redirecionar, rel, relatorio } from "./util.ts";

/** Tipo a partir das categorias antigas. */
function tipoPatente(categorias: string[]): Patente["tipo"] {
  if (categorias.includes("Software")) return "software";
  if (categorias.includes("Marca Registrada")) return "marca";
  if (categorias.includes("Privilégio de Inovação")) return "patente";
  return "outro";
}

export function migrarPatentes(): Patente[] {
  const dir = path.join(LEGADO, "publicacoes", "patentes");
  const patentes: Patente[] = [];
  for (const nomeArquivo of fs.readdirSync(dir).filter((f) => f.endsWith(".qmd")).sort()) {
    const arquivo = path.join(dir, nomeArquivo);
    const { meta, corpo } = lerQmd(arquivo);
    const categorias = ((meta.categories as string[] | undefined) ?? []).map(String);
    // description: "Nº BR1020230061575 | INPI - Privilégio de Inovação (Depósito)"
    const desc = String(meta.description ?? "");
    const m = desc.match(/^N[º°o]\s*(\S+)\s*\|\s*(.+)$/);
    if (!m) relatorio.anotar("Patentes: descrição fora do padrão \"Nº ... | ...\"", `${rel(arquivo)}: ${desc}`);
    const tipo = tipoPatente(categorias);
    if (tipo === "outro") relatorio.anotar("Patentes: tipo não identificado (\"outro\")", rel(arquivo));

    patentes.push({
      id: nomeArquivo.replace(/\.qmd$/, ""),
      titulo: String(meta.title).trim(),
      tipo,
      autores: String(meta.author ?? "")
        .split(";")
        .map((a) => a.trim())
        .filter(Boolean),
      numero: m ? m[1] : null,
      orgao: m ? m[2].trim() : null,
      data: String(meta.date),
      categorias,
      pessoas: [],
      conteudo: quartoParaMarkdown(corpo, { arquivo: rel(arquivo) }) || null,
    });
    // As patentes não têm página própria no site novo: aparecem na seção de patentes de /publicacoes/.
    redirecionar(`publicacoes/patentes/${nomeArquivo}`, "/publicacoes/#patentes");
  }
  return patentes.sort(compararPatentes);
}
