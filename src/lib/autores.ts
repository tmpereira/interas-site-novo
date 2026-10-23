// Correspondência entre o nome de um autor ("Sobrenome, Prenomes") e o nome completo de uma pessoa da equipe.
// Usada na migração (para preencher `pessoas` das publicações) e nas páginas (para linkar os autores).

const PARTICULAS = new Set(["de", "da", "do", "dos", "das", "e", "del", "van", "von", "der", "di"]);

/** Sobrenomes muito comuns: casar só pelas iniciais não é seguro. */
const SOBRENOMES_COMUNS = new Set(
  "silva santos souza sousa oliveira pereira lima costa ferreira rodrigues almeida gomes ribeiro carvalho alves martins araujo barbosa rocha dias moreira nascimento mendes freitas cardoso teixeira correia castro pinto lopes vieira machado fernandes reis cunha azevedo nunes monteiro campos cavalcanti moraes morais andrade marques ramos batista melo mello borges".split(" "),
);

/** Sufixos que o autor às vezes omite na assinatura ("Salinet, João" × "João Loures Salinet Junior"). */
const SUFIXOS = new Set(["junior", "jr", "filho", "neto", "sobrinho"]);

function tokens(texto: string): string[] {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s.-]/g, " ")
    .split(/[\s-]+/)
    .map((t) => t.replace(/\./g, ""))
    .filter((t) => t && !PARTICULAS.has(t));
}

/** seguro-iniciais: só iniciais, mas sobrenome pouco comum (marcado e listado para conferência). */
export type Resultado = "seguro" | "seguro-iniciais" | "duvidoso" | null;

/**
 * Compara "Sobrenome, Prenomes" (autor) com o nome completo da pessoa.
 * Seguro: o sobrenome do autor é o fim do nome da pessoa, o primeiro prenome
 * é igual por extenso e os demais prenomes/iniciais aparecem na ordem.
 * Só por iniciais: "seguro-iniciais" se o sobrenome for pouco comum, senão "duvidoso".
 */
export function compararAutor(autor: string, pessoa: string): Resultado {
  const nome = tokens(pessoa);
  const r = compararTokens(autor, nome);
  if (r || !SUFIXOS.has(nome[nome.length - 1])) return r;
  return compararTokens(autor, nome.slice(0, -1));
}

function compararTokens(autor: string, nome: string[]): Resultado {
  const [sobrenomeAutor, prenomesAutor = ""] = autor.split(",").map((s) => s.trim());
  const sob = tokens(sobrenomeAutor);
  const pre = tokens(prenomesAutor);
  if (sob.length === 0 || pre.length === 0 || nome.length <= sob.length) return null;
  const fim = nome.slice(nome.length - sob.length);
  if (fim.join(" ") !== sob.join(" ")) return null;
  const prenomesPessoa = nome.slice(0, nome.length - sob.length);

  // Cada prenome do autor (palavra ou inicial) deve aparecer em ordem nos prenomes da pessoa
  let j = 0;
  let primeiroPorExtenso = false;
  for (let i = 0; i < pre.length; i++) {
    const t = pre[i];
    const inicial = t.length === 1;
    while (j < prenomesPessoa.length && !(inicial ? prenomesPessoa[j][0] === t : prenomesPessoa[j] === t)) j++;
    if (j >= prenomesPessoa.length) return null;
    if (i === 0) {
      if (j !== 0) return null; // o primeiro prenome tem que ser o primeiro da pessoa
      primeiroPorExtenso = !inicial;
    }
    j++;
  }
  if (primeiroPorExtenso) return "seguro";
  return SOBRENOMES_COMUNS.has(sob[sob.length - 1]) ? "duvidoso" : "seguro-iniciais";
}

/**
 * Liga cada autor de uma publicação ao perfil da equipe. Só considera as pessoas já
 * marcadas na publicação (campo `pessoas`); se um autor combinar com mais de uma, não liga.
 */
export function vincularAutores(autores: string[], pessoasDaPublicacao: { slug: string; nome: string }[]): { nome: string; slug: string | null }[] {
  return autores.map((nome) => {
    const candidatas = pessoasDaPublicacao.filter((p) => compararAutor(nome, p.nome) !== null);
    return { nome, slug: candidatas.length === 1 ? candidatas[0].slug : null };
  });
}
