// Vídeos: _legado/videos/videos_arqs/*.qmd → content/videos.json + public/videos/

import fs from "node:fs";
import path from "node:path";
import type { Video } from "../../src/lib/esquemas.ts";
import { compararVideos } from "../../src/lib/conteudo.ts";
import {
  LEGADO,
  copiarParaPublico,
  dividirPorTitulo,
  lerQmd,
  quartoParaMarkdown,
  redirecionar,
  rel,
  relatorio,
  slugificar,
} from "./util.ts";

export function migrarVideos(): Video[] {
  const dir = path.join(LEGADO, "videos", "videos_arqs");
  const videos: Video[] = [];
  for (const nomeArquivo of fs.readdirSync(dir).filter((f) => f.endsWith(".qmd")).sort()) {
    const arquivo = path.join(dir, nomeArquivo);
    const onde = rel(arquivo);
    const { meta, corpo } = lerQmd(arquivo);
    const slug = slugificar(nomeArquivo.replace(/\.qmd$/, ""));
    const md = quartoParaMarkdown(corpo, { arquivo: onde });
    const { secoes } = dividirPorTitulo(md, 3);

    const descricao = secoes.find((s) => s.titulo === "Descrição")?.texto.trim() ?? null;
    const acesso = secoes.find((s) => s.titulo === "Acesso ao Conteúdo")?.texto ?? "";
    const links = [...acesso.matchAll(/^\*\s*\[(.+?)\]\((\S+?)\)\s*$/gm)].map((m) => ({
      rotulo: m[1].replace(/\*\*/g, "").trim(),
      url: m[2],
    }));
    for (const s of secoes) {
      if (!["Descrição", "Acesso ao Conteúdo"].includes(s.titulo)) relatorio.anotar("Vídeos: seções inesperadas", `${onde}: ${s.titulo}`);
    }
    if (links.length === 0) relatorio.anotar("Vídeos: sem links de acesso", onde);

    const capa = meta.image ? copiarParaPublico(path.join(dir, String(meta.image)), `/videos/${meta.image}`) : null;
    videos.push({
      slug,
      titulo: String(meta.title).trim(),
      data: String(meta.date),
      resumo: meta.description ? String(meta.description).trim() : null,
      capa,
      categorias: ((meta.categories as string[] | undefined) ?? []).map(String),
      links,
      conteudo: descricao,
    });
    redirecionar(`videos/videos_arqs/${nomeArquivo}`, `/videos/${slug}/`);
  }
  redirecionar("videos/index.qmd", "/videos/");
  return videos.sort(compararVideos);
}
