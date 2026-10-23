// Configurações do site (_quarto.yml) → content/site.json
// Página inicial (index.qmd) → content/home.json

import path from "node:path";
import YAML from "yaml";
import fs from "node:fs";
import type { Home, Site } from "../../src/lib/esquemas.ts";
import { LEGADO, converterLinkInterno, copiarParaPublico, lerQmd, relatorio } from "./util.ts";
import { TITULOS_CATEGORIAS } from "./pessoas.ts";

/** Copia uma imagem de _legado/images/ para public/images/ e devolve o caminho público. */
function imagem(nome: string): string {
  return copiarParaPublico(path.join(LEGADO, "images", nome), `/images/${nome}`);
}

/** Converte HTML simples de parágrafo (<i>, </br>) em Markdown. */
function htmlParaMarkdown(html: string): string {
  return html
    .replace(/<\/?i>/g, "*")
    .replace(/<\/?br\s*\/?>/gi, "\n\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function migrarSite(temas: Map<string, string>): Site {
  const quarto = YAML.parse(fs.readFileSync(path.join(LEGADO, "_quarto.yml"), "utf8"));
  const site = quarto.website;
  const anuncio = site.announcement;
  const titulo = (qmd: string) => String(lerQmd(path.join(LEGADO, qmd)).meta.title);

  const config: Site = {
    $schema: "./schemas/site.schema.json",
    titulo: site.title,
    descricao: String(lerQmd(path.join(LEGADO, "index.qmd")).meta.pagetitle).split(" --- ")[0],
    url_base: "https://www.interas.org",
    logo: imagem(path.basename(site.navbar.logo)),
    logo_alt: site.navbar["logo-alt"],
    favicon: imagem(path.basename(site.favicon)),
    imagem_compartilhamento: null,
    menu: [
      {
        rotulo: "INCT INTERAS",
        itens: [
          { rotulo: "O INCT INTERAS", link: "/sobre-o-interas/" },
          { rotulo: titulo("pessoas/coord-equipe.qmd"), link: "/equipe/" },
          { rotulo: "ÁREAS DE PESQUISA", link: "/areas-de-pesquisa/" },
          { rotulo: "GRUPOS E LABORATÓRIOS", link: "/grupos/" },
          { rotulo: "CONTATO", link: "/contato/" },
        ],
      },
      {
        rotulo: "PRODUÇÃO",
        itens: [
          { rotulo: "ARTIGOS", link: "/publicacoes/#artigos" },
          { rotulo: "PATENTES", link: "/publicacoes/#patentes" },
        ],
      },
      { rotulo: titulo("noticias/index.qmd"), link: "/noticias/" },
      { rotulo: "VÍDEOS", link: "/videos/" },
    ],
    anuncio: {
      id: anuncio.id,
      ativo: true,
      icone: anuncio.icon,
      texto: String(anuncio.content).replace(/\]\(([^)]+)\)/g, (_t, h: string) => `](${converterLinkInterno(h)})`),
      link: null,
    },
    rodape: {
      logo: imagem("3125_bordas_minimas_redim.png"),
      texto: site["page-footer"].center,
      // Links antigos (GitHub do repositório antigo e twitter.com genérico) ficaram de fora a pedido do usuário.
      redes: [],
    },
    google_analytics: site["google-analytics"],
    categorias_pessoas: TITULOS_CATEGORIAS,
    temas_grupos: [...temas].map(([slug, rotulo]) => ({ slug, rotulo })),
  };
  relatorio.anotar("Configurações do site", "Rodapé: links do GitHub (ipencnensp/interaswebsite) e do Twitter (twitter.com) removidos, a pedido do usuário");
  relatorio.anotar("Configurações do site", "temas_grupos: rótulos mantidos como no site antigo (ex.: \"diagnostico\", \"inteligência artificial\")");
  return config;
}

export function migrarHome(): Home {
  const { meta, corpo } = lerQmd(path.join(LEGADO, "index.qmd"));

  // Hero: <h1> e <p class="lead"> dentro de .hero-section
  const hero = corpo.match(/<div class="hero-section">[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>[\s\S]*?<p class="lead[^"]*">([\s\S]*?)<\/p>/);
  // Apresentação: o primeiro <p class="lead "> fora do hero
  const depoisHero = corpo.slice(corpo.indexOf("</div>\n```") + 1);
  const apresentacao = depoisHero.match(/<p class="lead\s*">([\s\S]*?)<\/p>/);

  // Destaques: cada .feature-grid
  const destaques: Home["destaques"] = [];
  for (const bloco of corpo.split(/<div class="feature-grid\s+/).slice(1)) {
    const posicao = bloco.startsWith("grid-image-left") ? "esquerda" : "direita";
    const img = bloco.match(/background-image: url\('images\/([^']+)'\)/)?.[1];
    const titulo = bloco.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].trim();
    const texto = bloco.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1];
    const botao = bloco.match(/<a href="([^"]+)" class="btn[^"]*">\s*([\s\S]*?)\s*<\/a>/);
    if (!img || !titulo || !texto) {
      relatorio.anotar("Home: bloco de destaque não reconhecido", bloco.slice(0, 80));
      continue;
    }
    destaques.push({
      titulo,
      texto: htmlParaMarkdown(texto),
      imagem: imagem(img),
      posicao_imagem: posicao,
      botao: botao ? { rotulo: botao[2].replace(/\s+/g, " "), link: converterLinkInterno(botao[1]) } : null,
    });
  }

  // Nota de coordenação entre ">>" (sintaxe sem efeito no Quarto; aqui vira texto normal)
  const nota = corpo.match(/^>>\n([\s\S]*?)\n>>/m)?.[1];
  const notaMd = nota
    ? nota.replace(/\]\(([^)]+)\)/g, (_t, h: string) => `](${converterLinkInterno(h)})`).replace(/[ \t]+$/gm, "  ").trim()
    : null;

  const listagens = meta.listing as { id: string; "max-items": number }[];
  const qtd = (id: string) => listagens.find((l) => l.id === id)?.["max-items"] ?? 0;

  if (!hero || !apresentacao) throw new Error("index.qmd: hero ou apresentação não encontrados");
  return {
    $schema: "./schemas/home.schema.json",
    hero: {
      titulo: hero[1].trim(),
      texto: htmlParaMarkdown(hero[2]),
      // A imagem efetiva do hero vinha do custom.scss (.hero-section), não do _quarto.yml.
      imagem: imagem("topo_desvanecendo_sem_texto_logo_interas2.png"),
    },
    apresentacao: htmlParaMarkdown(apresentacao[1]),
    destaques,
    nota: notaMd,
    noticias: { titulo: "Últimas notícias do INTERAS", quantidade: qtd("noticias") },
    publicacoes: { titulo: "Últimas publicações do INTERAS", quantidade: qtd("publicacoes") },
  };
}
