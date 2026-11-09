/**
 * Traduções do conteúdo (CLAUDE.md, seção 13.4): cada campo traduzível `x` tem um irmão
 * `x_en` no mesmo item. Quais campos são traduzíveis está nos esquemas Zod (esquemas.ts):
 * é traduzível todo campo que tem o irmão `_en` declarado no esquema.
 *
 * - `traduzir(item, campo, idioma)`: um campo; em inglês, usa `campo_en` se preenchido.
 * - `localizar(esquema, dados, idioma)`: os dados inteiros, guiado pelo esquema (usado por
 *   `conteudoNoIdioma`, em conteudo.ts, para que as páginas leiam `item.titulo` já traduzido).
 * - `verificarTraducoes(esquema, dados)`: campos sem tradução e listas `_en` de tamanho errado
 *   (usado pela validação).
 */
import { z } from "zod";
import type { Idioma } from "./rotas.ts";

const SUFIXO = "_en";

/** Tradução preenchida? `null`, ausente, texto vazio (ou só espaços) e lista vazia contam como vazio. */
export function preenchido(valor: unknown): boolean {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
}

/** Campos de `T` que têm o irmão `_en` (só esses podem ser passados a `traduzir`). */
export type CamposTraduziveis<T> = { [K in keyof T & string]: `${K}_en` extends keyof T ? K : never }[keyof T & string];

/** Valor de `campo` no idioma: em inglês, `campo_en` se estiver preenchido; senão, o português. */
export function traduzir<T extends object, K extends CamposTraduziveis<T>>(item: T, campo: K, idioma: Idioma): T[K] {
  if (idioma === "en") {
    const valor = (item as Record<string, unknown>)[`${campo}${SUFIXO}`];
    if (preenchido(valor)) return valor as T[K];
  }
  return item[campo];
}

// ---------------------------------------------------------------------------
// Percurso dos dados guiado pelo esquema
// ---------------------------------------------------------------------------

/** Tira os invólucros `optional`/`nullable` de um esquema. */
function desembrulhar(esquema: z.ZodType): z.ZodType {
  let atual = esquema;
  while (atual instanceof z.ZodOptional || atual instanceof z.ZodNullable) atual = atual.unwrap() as z.ZodType;
  return atual;
}

/** Campos traduzíveis de um objeto do esquema: os que têm o irmão `_en` declarado. */
function camposTraduziveis(objeto: z.ZodObject): string[] {
  const forma = objeto.shape;
  return Object.keys(forma)
    .filter((k) => k.endsWith(SUFIXO) && k.slice(0, -SUFIXO.length) in forma)
    .map((k) => k.slice(0, -SUFIXO.length));
}

/** Numa união (ex.: entrada do menu: link ou submenu), a opção que aceita o valor. */
const opcaoDaUniao = (uniao: z.ZodUnion, valor: unknown) => (uniao.options as z.ZodType[]).find((o) => o.safeParse(valor).success);

type Visita = (objeto: Record<string, unknown>, esquema: z.ZodObject, caminho: string) => Record<string, unknown> | void;

/**
 * Percorre `dados` junto com o `esquema` e chama `visita` em cada objeto (depois dos filhos).
 * Se `visita` devolver um objeto, ele substitui o original (os dados originais não são alterados).
 */
function percorrer(esquema: z.ZodType, valor: unknown, caminho: string, visita: Visita): unknown {
  if (valor === null || valor === undefined) return valor;
  const e = desembrulhar(esquema);
  if (e instanceof z.ZodArray && Array.isArray(valor)) {
    return valor.map((v, i) => percorrer(e.element as z.ZodType, v, `${caminho}[${i}]${descrever(v)}`, visita));
  }
  if (e instanceof z.ZodUnion) {
    const opcao = opcaoDaUniao(e, valor);
    return opcao ? percorrer(opcao, valor, caminho, visita) : valor;
  }
  if (e instanceof z.ZodObject && typeof valor === "object" && !Array.isArray(valor)) {
    const objeto = { ...(valor as Record<string, unknown>) };
    for (const [chave, filho] of Object.entries(e.shape)) {
      if (chave in objeto) objeto[chave] = percorrer(filho as z.ZodType, objeto[chave], caminho ? `${caminho} › ${chave}` : chave, visita);
    }
    return visita(objeto, e, caminho) ?? objeto;
  }
  return valor;
}

/** Identificação curta de um item de lista, para as mensagens. */
function descrever(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const o = item as Record<string, unknown>;
  for (const k of ["slug", "id", "chave"]) if (typeof o[k] === "string") return ` (${k} "${o[k]}")`;
  for (const k of ["titulo", "rotulo"]) if (typeof o[k] === "string") return ` ("${o[k]}")`;
  return "";
}

/** Dados com cada campo traduzível trocado pela versão no idioma (português: os próprios dados). */
export function localizar<T>(esquema: z.ZodType, dados: T, idioma: Idioma): T {
  if (idioma === "pt") return dados;
  return percorrer(esquema, dados, "", (objeto, e) => {
    for (const campo of camposTraduziveis(e)) {
      if (preenchido(objeto[`${campo}${SUFIXO}`])) objeto[campo] = objeto[`${campo}${SUFIXO}`];
    }
    return objeto;
  }) as T;
}

/** Campo traduzível ainda sem a versão em inglês. */
export type Pendencia = { local: string; campo: string };

/**
 * Confere as traduções de um arquivo: devolve os campos com texto em português e sem `_en`
 * (pendências) e os erros (lista `_en` com tamanho diferente da original).
 */
export function verificarTraducoes(esquema: z.ZodType, dados: unknown): { pendencias: Pendencia[]; erros: string[] } {
  const pendencias: Pendencia[] = [];
  const erros: string[] = [];
  percorrer(esquema, dados, "", (objeto, e, caminho) => {
    for (const campo of camposTraduziveis(e)) {
      const original = objeto[campo];
      const traducao = objeto[`${campo}${SUFIXO}`];
      if (!preenchido(original)) continue;
      if (!preenchido(traducao)) pendencias.push({ local: caminho, campo });
      else if (Array.isArray(original) && Array.isArray(traducao) && traducao.length !== original.length) {
        erros.push(`${caminho ? `${caminho} › ` : ""}${campo}${SUFIXO}: tem ${traducao.length} itens, mas ${campo} tem ${original.length} (a tradução deve ter o mesmo tamanho e a mesma ordem)`);
      }
    }
  });
  return { pendencias, erros };
}
