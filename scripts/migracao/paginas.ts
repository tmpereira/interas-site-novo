// Páginas: sobre-o-interas.qmd, areas-de-pesquisa.qmd, contato.qmd e os textos de
// abertura das páginas de listagem (equipe, grupos, publicações, notícias, vídeos)
// → content/paginas.json

import path from "node:path";
import type { Pagina } from "../../src/lib/esquemas.ts";
import { LEGADO, dividirPorTitulo, lerQmd, quartoParaMarkdown, redirecionar, relatorio } from "./util.ts";

function ler(relativo: string) {
  return lerQmd(path.join(LEGADO, relativo));
}

function md(relativo: string, corpo: string): string {
  return quartoParaMarkdown(corpo, { arquivo: relativo });
}

/**
 * contato.qmd era montado com cartões em HTML/Bootstrap. O texto foi transcrito para
 * Markdown, mantendo os dois cartões como dados (`cartoes`), para o componente da
 * página reproduzir o layout. Comentários HTML (Instagram/LinkedIn desativados) foram descartados.
 */
const CARTOES_CONTATO = [
  {
    titulo: "Secretaria e Contatos",
    icone: "people-fill",
    conteudo: [
      "**Patrícia Neves**  ",
      "Secretaria INTERAS",
      "",
      "Telefone: +5511 2810-1646",
      "",
      "**Horário de Atendimento:**  ",
      "Segunda a Sexta-feira: 08h00 às 16h45",
    ].join("\n"),
  },
  {
    titulo: "Localização e Email",
    icone: "geo-alt-fill",
    conteudo: [
      "Para entrar em contato, use nosso email:",
      "",
      "### [inctinteras@gmail.com](mailto:inctinteras@gmail.com)",
      "",
      "**Endereço Físico:**",
      "",
      "Instituto de Pesquisas Energéticas e Nucleares - IPEN/CNEN, SP  ",
      "INTERAS - Centro de Lasers e Aplicações (CELAP)  ",
      "Av. Lineu Prestes, 2242 - Cidade Universitária  ",
      "CEP 05508-000 -- São Paulo/SP",
    ].join("\n"),
  },
];

export function migrarPaginas(): Pagina[] {
  const paginas: Pagina[] = [];

  // Institucionais
  const sobre = ler("sobre-o-interas.qmd");
  paginas.push({
    slug: "sobre-o-interas",
    titulo: String(sobre.meta.title),
    descricao: sobre.meta.subtitle ? String(sobre.meta.subtitle) : null,
    conteudo: md("sobre-o-interas.qmd", sobre.corpo),
  });

  const areas = ler("areas-de-pesquisa.qmd");
  const conteudoAreas = md("areas-de-pesquisa.qmd", areas.corpo);
  if (!conteudoAreas) relatorio.anotar("Páginas", "areas-de-pesquisa.qmd não tem texto (só o título) — migrada com conteúdo vazio");
  paginas.push({ slug: "areas-de-pesquisa", titulo: String(areas.meta.title), descricao: null, conteudo: conteudoAreas });

  const contato = ler("contato.qmd");
  const introContato = dividirPorTitulo(contato.corpo, 2);
  const sede = introContato.secoes.find((s) => s.titulo === "Sede do INTERAS")?.texto ?? "";
  const textoSede = sede.split(/^:::\s*\{\.grid\}/m)[0];
  paginas.push({
    slug: "contato",
    titulo: String(contato.meta.title),
    descricao: null,
    conteudo: md("contato.qmd", `## Sede do INTERAS\n${textoSede}`),
    cartoes: CARTOES_CONTATO,
  });
  relatorio.anotar("Páginas", "contato.qmd: cartões HTML transcritos para Markdown no campo `cartoes` (ver scripts/migracao/paginas.ts)");

  // Textos de abertura das páginas de listagem
  const equipe = ler("pessoas/coord-equipe.qmd");
  paginas.push({ slug: "equipe", titulo: String(equipe.meta.title), descricao: null, conteudo: "" });

  const grupos = ler("grupos.qmd");
  paginas.push({ slug: "grupos", titulo: String(grupos.meta.title), descricao: null, conteudo: md("grupos.qmd", grupos.corpo.replace(/:::\s*\{#lista-grupos\}\s*\n:::/, "")) });

  const pub = ler("publicacoes/index.qmd");
  paginas.push({
    slug: "publicacoes",
    titulo: String(pub.meta.pagetitle),
    descricao: null,
    conteudo: "",
    titulo_artigos: "Artigos Originais",
    titulo_patentes: "Propriedade Intelectual (Patentes e Softwares)",
  });

  const noticias = ler("noticias/index.qmd");
  paginas.push({ slug: "noticias", titulo: String(noticias.meta.title), descricao: null, conteudo: md("noticias/index.qmd", noticias.corpo) });

  const videos = ler("videos/index.qmd");
  paginas.push({
    slug: "videos",
    titulo: String(videos.meta.title),
    descricao: videos.meta.subtitle ? String(videos.meta.subtitle) : null,
    conteudo: md("videos/index.qmd", videos.corpo),
  });

  redirecionar("sobre-o-interas.qmd", "/sobre-o-interas/");
  redirecionar("areas-de-pesquisa.qmd", "/areas-de-pesquisa/");
  redirecionar("contato.qmd", "/contato/");
  redirecionar("publicacoes/index.qmd", "/publicacoes/");
  redirecionar("index.qmd", "/");
  return paginas;
}
