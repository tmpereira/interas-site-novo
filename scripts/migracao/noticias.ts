// Notícias: _legado/noticias/posts/<pasta>/index.qmd → content/noticias/<aaaa-mm-dd>-<slug>.md
// Imagens referenciadas vão para public/noticias/<id>/.

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  CONTEUDO,
  LEGADO,
  copiarParaPublico,
  imagensDoMarkdown,
  lerQmd,
  nomeArquivoSeguro,
  quartoParaMarkdown,
  redirecionar,
  rel,
  relatorio,
} from "./util.ts";

/**
 * Tabelas da notícia "pesquisadores influentes". No site antigo eram geradas por R
 * a partir de arquivos .RDS; aqui foram copiadas do site no ar (www.interas.org) em 2026-10-23.
 */
const TABELAS_INFLUENTES: Record<string, string> = {
  career: `**Pesquisadores do INTERAS na Lista de Top Influentes – Toda Carreira**  
Análise baseada na base de dados Scopus/Elsevier (2024)

| Nome Completo | Filiação Principal | Área de Pesquisa | Página no INTERAS |
|---|---|---|---|
| Ifor D.W. Samuel | University of St Andrews | Applied Physics | [Acessar Perfil](/equipe/ifor-david-william-samuel/) |
| John Michael Girkin | Durham University | Optics | [Acessar Perfil](/equipe/john-michael-girkin/) |
| Nicholas Stone | University of Exeter | Analytical Chemistry | [Acessar Perfil](/equipe/nicholas-stone/) |
| Niklaus Ursus Wetter | Instituto de Pesquisas Energeticas e Nucleares, Sao Paulo | Optoelectronics & Photonics | [Acessar Perfil](/equipe/niklaus-ursus-wetter/) |

Fonte: [Dados compilados a partir da base de dados Elsevier](https://elsevier.digitalcommonsdata.com/datasets/btchxktzyw/8) e do site oficial do INCT INTERAS.`,
  yr2024: `**Pesquisadores do INTERAS na Lista de Top Influentes – Ano 2024**  
Análise baseada na base de dados Scopus/Elsevier (2024)

| Nome Completo | Filiação Principal | Área de Pesquisa | Página no INTERAS |
|---|---|---|---|
| Ifor D.W. Samuel | University of St Andrews | Applied Physics | [Acessar Perfil](/equipe/ifor-david-william-samuel/) |
| Leandro Luongo Matos | Universidade de São Paulo | Otorhinolaryngology | [Acessar Perfil](/equipe/leandro-luongo-de-matos/) |
| Martha Simões Ribeiro | Instituto de Pesquisas Energeticas e Nucleares, Sao Paulo | Biophysics | [Acessar Perfil](/equipe/martha-simoes-ribeiro/) |
| Nicholas Stone | University of Exeter | Analytical Chemistry | [Acessar Perfil](/equipe/nicholas-stone/) |
| Niklaus Ursus Wetter | Instituto de Pesquisas Energeticas e Nucleares, Sao Paulo | Optoelectronics & Photonics | [Acessar Perfil](/equipe/niklaus-ursus-wetter/) |
| Sajid Farooq | Zhejiang Normal University | Optoelectronics & Photonics | [Acessar Perfil](/equipe/sajid-farooq/) |

Fonte: [Dados compilados a partir da base de dados Elsevier](https://elsevier.digitalcommonsdata.com/datasets/btchxktzyw/8) e do site oficial do INCT INTERAS.`,
};

/** Ajustes pontuais no corpo de notícias específicas (pasta antiga → [de, para, motivo]). */
const AJUSTES: Record<string, [RegExp | string, string, string][]> = {
  "202510-pesquisadores-influentes": [
    [/```\{r\}\n#\| echo: false[\s\S]*?```\n/, "", "bloco R de configuração removido"],
    [/```\{r\}\nreadRDS\("tabela_final_career\.RDS"\)\n```/, TABELAS_INFLUENTES.career, "tabela R (toda a carreira) convertida em tabela Markdown, copiada do site no ar"],
    [/```\{r\}\nreadRDS\("tabela_final_yr2024\.RDS"\)\n```/, TABELAS_INFLUENTES.yr2024, "tabela R (ano 2024) convertida em tabela Markdown, copiada do site no ar"],
    ["consulte os ![dados publicados pela Elsevier]", "consulte os [dados publicados pela Elsevier]", "link escrito como imagem (![...]) corrigido para link"],
  ],
};

/** Pasta "202504-prof-emiliano..." ou "20260507-interas..." → slug sem a data. */
function slugDaPasta(pasta: string): string {
  return pasta.replace(/^\d{6,8}-/, "");
}

export function migrarNoticias(): number {
  const dirPosts = path.join(LEGADO, "noticias", "posts");
  const destino = path.join(CONTEUDO, "noticias");
  fs.mkdirSync(destino, { recursive: true });
  let total = 0;

  for (const pasta of fs.readdirSync(dirPosts).sort()) {
    const dir = path.join(dirPosts, pasta);
    const arquivo = path.join(dir, "index.qmd");
    if (!fs.existsSync(arquivo)) continue;
    const onde = rel(arquivo);
    const { meta, corpo } = lerQmd(arquivo);
    const data = String(meta.date);
    const id = `${data}-${slugDaPasta(pasta)}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) relatorio.anotar("Notícias: data fora do padrão", `${onde}: ${data}`);

    // Ajustes pontuais antes da conversão
    let texto = corpo;
    for (const [de, para, motivo] of AJUSTES[pasta] ?? []) {
      const antes = texto;
      texto = typeof de === "string" ? texto.replace(de, para) : texto.replace(de, para);
      relatorio.anotar("Notícias: ajustes manuais", `${id}: ${motivo}${antes === texto ? " — NÃO APLICADO (padrão não encontrado)" : ""}`);
    }
    if (/```\{r\}/.test(texto)) relatorio.anotar("Notícias: código R restante", id);

    const md = quartoParaMarkdown(texto, { arquivo: onde, prefixoImagens: `/noticias/${id}` });

    // Imagens: capa + as do corpo
    const usadas = new Set<string>();
    const capa = String(meta.image);
    const imagem = copiarParaPublico(path.join(dir, capa), `/noticias/${id}/${nomeArquivoSeguro(capa)}`);
    usadas.add(capa);
    for (const img of imagensDoMarkdown(md)) {
      if (!img.startsWith(`/noticias/${id}/`)) continue;
      const nome = path.basename(img);
      const original = fs.readdirSync(dir).find((f) => nomeArquivoSeguro(f) === nome);
      if (!original) relatorio.anotar("Arquivos ausentes", `${onde}: ${img}`);
      else {
        copiarParaPublico(path.join(dir, original), img);
        usadas.add(original);
      }
    }
    for (const f of fs.readdirSync(dir)) {
      if (f !== "index.qmd" && !usadas.has(f)) relatorio.anotar("Arquivos não copiados (sem referência)", rel(path.join(dir, f)));
    }

    const cabecalho = {
      titulo: String(meta.title).trim(),
      data,
      autor: meta.author ? String(meta.author) : undefined,
      categorias: ((meta.categories as string[] | undefined) ?? []).map(String),
      imagem,
      resumo: "",
      destaque: false,
    };
    const yaml = YAML.stringify(cabecalho, { lineWidth: 0, flowCollectionPadding: false })
      .replace(/^categorias:\n((?:\s+- .*\n)+)/m, (_t, itens: string) => {
        const lista = itens.trim().split("\n").map((l) => l.replace(/^\s*- /, ""));
        return `categorias: [${lista.join(", ")}]\n`;
      });
    fs.writeFileSync(path.join(destino, `${id}.md`), `---\n${yaml}---\n\n${md}\n`);
    redirecionar(`noticias/posts/${pasta}/index.qmd`, `/noticias/${id}/`);
    total++;
  }
  redirecionar("noticias/index.qmd", "/noticias/");
  return total;
}
