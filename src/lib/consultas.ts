// Consultas sobre o conteúdo validado, usadas pelas páginas.

import { carregarConteudo } from "./conteudo.ts";
import { NIVEIS_ALUNO, type Aluno, type CategoriaPessoa, type Grupo, type NivelAluno, type Noticia, type Pagina, type Pessoa, type Publicacao } from "./esquemas.ts";
import { markdownParaTexto, truncarTexto } from "./markdown.ts";

/** Página institucional ou texto de abertura de uma listagem (content/paginas.json). */
export function paginaPorSlug(slug: string): Pagina {
  const pagina = carregarConteudo().paginas.find((p) => p.slug === slug);
  if (!pagina) throw new Error(`content/paginas.json: não existe a página "${slug}"`);
  return pagina;
}

/** Pessoas ativas agrupadas por categoria, na ordem de exibição e com os títulos de site.json. */
export function equipePorCategoria(): { chave: CategoriaPessoa; titulo: string; pessoas: Pessoa[] }[] {
  const { site, pessoas } = carregarConteudo();
  return site.categorias_pessoas
    .map(({ chave, titulo }) => ({ chave, titulo, pessoas: pessoas.filter((p) => p.ativo && p.categoria === chave) }))
    .filter((c) => c.pessoas.length > 0);
}

/** Títulos das seções da página "Alunos". */
export const TITULOS_NIVEL_ALUNO: Record<NivelAluno, string> = {
  "iniciacao-cientifica": "Iniciação científica",
  mestrado: "Mestrado",
  doutorado: "Doutorado",
  "pos-doutorado": "Pós-doutorado",
};

/** Nomes curtos dos países (código ISO de 2 letras), exibidos nos cartões de artigos. */
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

/** Nome curto de um país pelo código ISO de 2 letras (o próprio código, se não houver nome). */
export const nomeCurtoPais = (codigo: string) => NOMES_PAISES[codigo] ?? codigo;

/** Países estrangeiros (sem o Brasil), com nome curto; código desconhecido aparece como está. */
export const paisesEstrangeiros = (codigos: string[] = []) => codigos.filter((c) => c !== "BR").map(nomeCurtoPais);

export type AlunoComOrientador = Aluno & { pessoaOrientadora: Pessoa };

/** Em andamento primeiro (início mais recente antes), depois concluídos (conclusão mais recente antes), depois nome. */
const compararAlunos = (a: Aluno, b: Aluno) =>
  (a.situacao === "em-andamento" ? 0 : 1) - (b.situacao === "em-andamento" ? 0 : 1) ||
  (b.ano_conclusao ?? b.ano_inicio ?? 0) - (a.ano_conclusao ?? a.ano_inicio ?? 0) ||
  a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });

/** Alunos (content/alunos.json) agrupados por nível, na ordem de exibição, com a pessoa orientadora. */
export function alunosPorNivel(): { nivel: NivelAluno; titulo: string; alunos: AlunoComOrientador[] }[] {
  const { alunos } = carregarConteudo();
  return NIVEIS_ALUNO.map((nivel) => ({
    nivel,
    titulo: TITULOS_NIVEL_ALUNO[nivel],
    alunos: alunos
      .filter((a) => a.nivel === nivel)
      .sort(compararAlunos)
      .map((a) => ({ ...a, pessoaOrientadora: pessoaPorSlug(a.orientador) })),
  })).filter((n) => n.alunos.length > 0);
}

export function pessoaPorSlug(slug: string): Pessoa {
  const pessoa = carregarConteudo().pessoas.find((p) => p.slug === slug);
  if (!pessoa) throw new Error(`content/pessoas.json: não existe a pessoa "${slug}"`);
  return pessoa;
}

/** Publicações em que a pessoa é autora (campo `pessoas` de cada publicação). */
export function publicacoesDaPessoa(slug: string): Publicacao[] {
  return carregarConteudo().publicacoes.filter((p) => p.pessoas.includes(slug));
}

/** Grupos dos quais a pessoa participa (campo `grupos` da pessoa). */
export function gruposDaPessoa(pessoa: Pessoa): Grupo[] {
  const { grupos } = carregarConteudo();
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
export function estatisticas() {
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
      titulo: TITULOS_NIVEL_ALUNO[nivel],
      pontos: faixaAlunos.map((ano): PontoGrafico => ({ rotulo: String(ano), valor: concluidos.filter((a) => a.nivel === nivel && a.ano_conclusao === ano).length })),
    })),
    /** Ano mais recente das publicações (pode estar incompleto). */
    anoAtual: anos[anos.length - 1],
  };
}
