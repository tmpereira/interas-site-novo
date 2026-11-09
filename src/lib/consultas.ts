// Consultas sobre o conteúdo validado, usadas pelas páginas.

import { carregarConteudo, conteudoNoIdioma } from "./conteudo.ts";
import { NIVEIS_ALUNO, type Aluno, type CategoriaPessoa, type Grupo, type NivelAluno, type Noticia, type Pagina, type Pessoa, type Publicacao } from "./esquemas.ts";
import { type Idioma, LOCALE } from "./i18n/rotas.ts";
import { rotulos } from "./i18n/rotulos.ts";
import { markdownParaTexto, truncarTexto } from "./markdown.ts";

/** Página institucional ou texto de abertura de uma listagem (content/paginas.json), no idioma. */
export function paginaPorSlug(slug: string, idioma: Idioma): Pagina {
  const pagina = conteudoNoIdioma(idioma).paginas.find((p) => p.slug === slug);
  if (!pagina) throw new Error(`content/paginas.json: não existe a página "${slug}"`);
  return pagina;
}

/** Pessoas ativas agrupadas por categoria, na ordem de exibição e com os títulos de site.json. */
export function equipePorCategoria(idioma: Idioma): { chave: CategoriaPessoa; titulo: string; pessoas: Pessoa[] }[] {
  const { site, pessoas } = conteudoNoIdioma(idioma);
  return site.categorias_pessoas
    .map(({ chave, titulo }) => ({ chave, titulo, pessoas: pessoas.filter((p) => p.ativo && p.categoria === chave) }))
    .filter((c) => c.pessoas.length > 0);
}

/** Nomes curtos dos países em português (código ISO de 2 letras), exibidos nos cartões de artigos e no mapa. */
const NOMES_PAISES: Record<string, string> = {
  AE: "EAU",
  AR: "Argentina",
  BE: "Bélgica",
  BR: "Brasil",
  CA: "Canadá",
  CL: "Chile",
  CN: "China",
  CO: "Colômbia",
  DE: "Alemanha",
  EC: "Equador",
  ES: "Espanha",
  FR: "França",
  GB: "R. Unido",
  ID: "Indonésia",
  IE: "Irlanda",
  IL: "Israel",
  IN: "Índia",
  IT: "Itália",
  KZ: "Cazaquistão",
  LT: "Lituânia",
  MY: "Malásia",
  NG: "Nigéria",
  PE: "Peru",
  PT: "Portugal",
  RE: "Reunião",
  SE: "Suécia",
  US: "EUA",
  UY: "Uruguai",
  VE: "Venezuela",
};

/**
 * Nomes em inglês que fogem do padrão de `Intl.DisplayNames` (curtos, como em português,
 * ou sem "&" e parênteses). Os demais países vêm do próprio `Intl`, sem lista à mão.
 */
const NOMES_PAISES_EN: Record<string, string> = {
  AE: "UAE",
  BA: "Bosnia and Herzegovina",
  CD: "DR Congo",
  CG: "Republic of the Congo",
  GB: "UK",
  MM: "Myanmar",
  TT: "Trinidad and Tobago",
  US: "USA",
};
const nomesIntlEn = new Intl.DisplayNames("en", { type: "region" });

/** Nome de um país em inglês pelo código ISO; `null` se o `Intl` não o conhecer. */
export function nomePaisEn(codigo: string): string | null {
  if (NOMES_PAISES_EN[codigo]) return NOMES_PAISES_EN[codigo];
  try {
    const nome = nomesIntlEn.of(codigo);
    return nome && nome !== codigo ? nome : null;
  } catch {
    return null;
  }
}

/** Nome curto de um país pelo código ISO de 2 letras (o próprio código, se não houver nome). */
export const nomeCurtoPais = (codigo: string, idioma: Idioma) => (idioma === "en" ? nomePaisEn(codigo) : NOMES_PAISES[codigo]) ?? codigo;

/** Países estrangeiros (sem o Brasil), com nome curto; código desconhecido aparece como está. */
export const paisesEstrangeiros = (idioma: Idioma, codigos: string[] = []) => codigos.filter((c) => c !== "BR").map((c) => nomeCurtoPais(c, idioma));

export type AlunoComOrientador = Aluno & { pessoaOrientadora: Pessoa };

/** Em andamento primeiro (início mais recente antes), depois concluídos (conclusão mais recente antes), depois nome. */
export const compararAlunos = (idioma: Idioma) => (a: Aluno, b: Aluno) =>
  (a.situacao === "em-andamento" ? 0 : 1) - (b.situacao === "em-andamento" ? 0 : 1) ||
  (b.ano_conclusao ?? b.ano_inicio ?? 0) - (a.ano_conclusao ?? a.ano_inicio ?? 0) ||
  a.nome.localeCompare(b.nome, LOCALE[idioma], { sensitivity: "base" });

/** Alunos (content/alunos.json) agrupados por nível, na ordem de exibição, com a pessoa orientadora. */
export function alunosPorNivel(idioma: Idioma): { nivel: NivelAluno; titulo: string; alunos: AlunoComOrientador[] }[] {
  const { alunos } = carregarConteudo();
  return NIVEIS_ALUNO.map((nivel) => ({
    nivel,
    titulo: rotulos(idioma).alunos.niveis[nivel],
    alunos: alunos
      .filter((a) => a.nivel === nivel)
      .sort(compararAlunos(idioma))
      .map((a) => ({ ...a, pessoaOrientadora: pessoaPorSlug(a.orientador) })),
  })).filter((n) => n.alunos.length > 0);
}

/** Período de uma orientação: "2021–2024", "desde 2024", "2024" ou "—". */
export function periodoAluno(a: Aluno, idioma: Idioma): string {
  if (a.situacao === "em-andamento") return a.ano_inicio ? rotulos(idioma).alunos.desde(a.ano_inicio) : "—";
  if (a.ano_inicio && a.ano_conclusao && a.ano_inicio !== a.ano_conclusao) return `${a.ano_inicio}–${a.ano_conclusao}`;
  return String(a.ano_conclusao ?? a.ano_inicio ?? "—");
}

/**
 * Orientações de uma pessoa (perfil): em andamento e concluídas, cada uma dividida por nível
 * (na ordem de NIVEIS_ALUNO) e, dentro do nível, mais recentes primeiro. Níveis vazios ficam de fora.
 */
export function orientacoesDaPessoa(slug: string, idioma: Idioma) {
  const alunos = carregarConteudo().alunos.filter((a) => a.orientador === slug).sort(compararAlunos(idioma));
  const porNivel = (situacao: Aluno["situacao"]) =>
    NIVEIS_ALUNO.map((nivel) => ({
      nivel,
      titulo: rotulos(idioma).alunos.niveis[nivel],
      alunos: alunos.filter((a) => a.situacao === situacao && a.nivel === nivel),
    })).filter((n) => n.alunos.length > 0);
  return { total: alunos.length, emAndamento: porNivel("em-andamento"), concluidas: porNivel("concluida") };
}

/** Pessoa pelo slug, no idioma (o português, se omitido: só nome e dados que não se traduzem). */
export function pessoaPorSlug(slug: string, idioma: Idioma = "pt"): Pessoa {
  const pessoa = conteudoNoIdioma(idioma).pessoas.find((p) => p.slug === slug);
  if (!pessoa) throw new Error(`content/pessoas.json: não existe a pessoa "${slug}"`);
  return pessoa;
}

/** Publicações em que a pessoa é autora (campo `pessoas` de cada publicação). */
export function publicacoesDaPessoa(slug: string): Publicacao[] {
  return carregarConteudo().publicacoes.filter((p) => p.pessoas.includes(slug));
}

/** Grupos dos quais a pessoa participa (campo `grupos` da pessoa). */
export function gruposDaPessoa(pessoa: Pessoa, idioma: Idioma): Grupo[] {
  const { grupos } = conteudoNoIdioma(idioma);
  return pessoa.grupos.map((s) => grupos.find((g) => g.slug === s)).filter((g): g is Grupo => Boolean(g));
}

/**
 * Resumo de uma notícia na listagem: o campo `resumo` ou, se vazio, o primeiro parágrafo do corpo
 * (sem títulos, imagens, listas, citações e tabelas), cortado em ~200 caracteres.
 */
export function resumoDaNoticia(noticia: Noticia): string {
  if (noticia.resumo) return noticia.resumo;
  const paragrafo = noticia.corpo
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find((b) => b && !/^(#|!\[|>|\||[-*+] |\d+\. |:::|---)/.test(b));
  return truncarTexto(markdownParaTexto(paragrafo ?? ""), 200);
}

/** Um ponto de um gráfico de barras: rótulo do eixo (ano) e valor. */
export type PontoGrafico = { rotulo: string; valor: number };

/** Anos de `inicio` a `fim`, sem buracos (ano sem dado vira barra zero). */
const faixaDeAnos = (inicio: number, fim: number) => Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);

/** Números da página "INTERAS em números", calculados a partir das coleções. */
export function estatisticas(idioma: Idioma) {
  const { publicacoes, patentes, pessoas, alunos } = carregarConteudo();
  const anosPub = publicacoes.map((p) => p.ano);
  const anos = faixaDeAnos(Math.min(...anosPub), Math.max(...anosPub));
  const doAno = (ano: number) => publicacoes.filter((p) => p.ano === ano);
  const comJcr = publicacoes.filter((p) => p.fator_impacto !== null);
  const comCitacoes = publicacoes.filter((p) => p.citacoes !== null);
  const media = (valores: number[]) => valores.reduce((s, v) => s + v, 0) / valores.length;

  // JCR médio só nos anos com algum valor; a cobertura vai para a nota do gráfico
  const jcrPorAno = anos
    .map((ano) => ({ ano, total: doAno(ano).length, valores: doAno(ano).flatMap((p) => (p.fator_impacto === null ? [] : [p.fator_impacto])) }))
    .filter((a) => a.valores.length > 0);

  const concluidos = alunos.filter((a) => a.situacao === "concluida" && a.ano_conclusao !== null);
  const anosAlunos = concluidos.map((a) => a.ano_conclusao as number);
  const faixaAlunos = anosAlunos.length > 0 ? faixaDeAnos(Math.min(...anosAlunos), Math.max(...anosAlunos)) : [];

  return {
    resumo: {
      artigos: publicacoes.length,
      patentes: patentes.length,
      citacoes: comCitacoes.reduce((s, p) => s + (p.citacoes ?? 0), 0),
      artigosComCitacoes: comCitacoes.length,
      jcrMedio: comJcr.length > 0 ? media(comJcr.map((p) => p.fator_impacto as number)) : null,
      artigosComJcr: comJcr.length,
      alunosFormados: alunos.filter((a) => a.situacao === "concluida").length,
      equipe: pessoas.filter((p) => p.ativo).length,
    },
    artigosPorAno: anos.map((ano): PontoGrafico => ({ rotulo: String(ano), valor: doAno(ano).length })),
    jcrPorAno: jcrPorAno.map((a): PontoGrafico => ({ rotulo: String(a.ano), valor: media(a.valores) })),
    /** Anos em que só parte dos artigos tem JCR: { ano, com, total }. */
    jcrIncompleto: jcrPorAno.filter((a) => a.valores.length < a.total).map((a) => ({ ano: a.ano, com: a.valores.length, total: a.total })),
    citacoesPorAno: anos
      .filter((ano) => doAno(ano).some((p) => p.citacoes !== null))
      .map((ano): PontoGrafico => ({ rotulo: String(ano), valor: doAno(ano).reduce((s, p) => s + (p.citacoes ?? 0), 0) })),
    alunosPorNivel: NIVEIS_ALUNO.map((nivel) => ({
      nivel,
      titulo: rotulos(idioma).alunos.niveis[nivel],
      pontos: faixaAlunos.map((ano): PontoGrafico => ({ rotulo: String(ano), valor: concluidos.filter((a) => a.nivel === nivel && a.ano_conclusao === ano).length })),
    })),
    /** Ano mais recente das publicações (pode estar incompleto). */
    anoAtual: anos[anos.length - 1],
  };
}
