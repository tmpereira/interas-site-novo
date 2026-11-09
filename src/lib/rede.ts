// Rede de coautoria entre membros do INTERAS (campo `pessoas` das publicações),
// com as posições calculadas no build por um layout de forças simples e determinístico.

import { carregarConteudo } from "./conteudo.ts";
import type { CategoriaPessoa, Publicacao } from "./esquemas.ts";

/** Bolsistas ficam com cor própria; as demais categorias são "pesquisadores". */
export type GrupoNo = "pesquisador" | "bolsista";

export type NoRede = {
  slug: string;
  nome: string;
  /** Nome curto exibido no gráfico (primeiro e último nome). */
  rotulo: string;
  grupo: GrupoNo;
  publicacoes: number;
  x: number;
  y: number;
  raio: number;
  /** Posição do nome (se omitida, fica centralizado acima da bolinha). */
  rotuloX?: number;
  rotuloY?: number;
  ancora?: "start" | "middle" | "end";
};

export type ArestaRede = { a: string; b: string; peso: number };

/** Recorte da rede: todas as publicações ou só as de um ano. */
export type PeriodoRede = {
  /** "todos" ou o ano ("2025"). */
  chave: string;
  rotulo: string;
  /** Publicações de cada pessoa no período (só quem publicou nele). */
  publicacoes: Record<string, number>;
  /** Raio da bolinha de cada pessoa no período (cresce com as publicações). */
  raios: Record<string, number>;
  arestas: ArestaRede[];
  /** Pessoas com publicações no período, mas sem coautoria com outro membro. */
  isolados: { slug: string; nome: string }[];
};

export type Rede = {
  largura: number;
  altura: number;
  /** Posições fixas (calculadas com todas as publicações), iguais em todos os períodos. */
  nos: NoRede[];
  periodos: PeriodoRede[];
};

const LARGURA = 1000;
const ALTURA = 760;
const MARGEM = 60;
const ITERACOES = 600;

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e"]);
const SUFIXOS = new Set(["junior", "júnior", "filho", "neto", "sobrinho"]);

/** "Luismar Barbosa da Cruz Junior" → "Luismar Cruz Junior"; "Denise Maria Zezell" → "Denise Zezell". */
export function nomeCurto(nome: string): string {
  const partes = nome.split(/\s+/).filter((p) => !PARTICULAS.has(p.toLowerCase()));
  if (partes.length <= 2) return partes.join(" ");
  const ultima = partes[partes.length - 1];
  if (SUFIXOS.has(ultima.toLowerCase())) return `${partes[0]} ${partes[partes.length - 2]} ${ultima}`;
  return `${partes[0]} ${ultima}`;
}

/** Raio da bolinha a partir do número de publicações (mesma escala em todos os períodos). */
const raioDoNo = (publicacoes: number) => 5 + Math.sqrt(publicacoes) * 2.2;

const grupoDaCategoria = (c: CategoriaPessoa): GrupoNo => (c === "bolsista" ? "bolsista" : "pesquisador");

/** Publicações por pessoa e pares de coautores (peso = artigos juntos) de um conjunto de publicações. */
function contar(publicacoes: Publicacao[]) {
  const contagem = new Map<string, number>();
  const pesos = new Map<string, number>();
  for (const p of publicacoes) {
    const autores = [...new Set(p.pessoas)].sort();
    for (const a of autores) contagem.set(a, (contagem.get(a) ?? 0) + 1);
    for (let i = 0; i < autores.length; i++)
      for (let j = i + 1; j < autores.length; j++) {
        const chave = `${autores[i]}|${autores[j]}`;
        pesos.set(chave, (pesos.get(chave) ?? 0) + 1);
      }
  }
  const arestas: ArestaRede[] = [...pesos]
    .map(([chave, peso]) => {
      const [a, b] = chave.split("|");
      return { a, b, peso };
    })
    .sort((x, y) => x.peso - y.peso || x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
  return { contagem, arestas };
}

export function redeCoautoria(): Rede {
  const conteudo = carregarConteudo();
  // Só pesquisadores entram na rede (pedido do usuário em 2026-11-09): bolsistas ficam de fora
  const pessoas = conteudo.pessoas.filter((p) => p.categoria !== "bolsista");
  const incluidos = new Set(pessoas.map((p) => p.slug));
  const publicacoes = conteudo.publicacoes.map((p) => ({ ...p, pessoas: p.pessoas.filter((s) => incluidos.has(s)) }));
  const geral = contar(publicacoes);

  // Ordem estável: mais publicações primeiro, depois nome
  const nos: NoRede[] = pessoas
    .filter((p) => geral.contagem.has(p.slug))
    .map((p) => {
      const n = geral.contagem.get(p.slug) as number;
      return {
        slug: p.slug,
        nome: p.nome,
        rotulo: nomeCurto(p.nome),
        grupo: grupoDaCategoria(p.categoria),
        publicacoes: n,
        x: 0,
        y: 0,
        raio: raioDoNo(n),
      };
    })
    .sort((a, b) => b.publicacoes - a.publicacoes || a.nome.localeCompare(b.nome, "pt-BR"));

  posicionar(nos, geral.arestas);

  const periodo = (chave: string, rotulo: string, lista: Publicacao[]): PeriodoRede => {
    const { contagem, arestas } = contar(lista);
    const conectados = new Set(arestas.flatMap((a) => [a.a, a.b]));
    return {
      chave,
      rotulo,
      publicacoes: Object.fromEntries(contagem),
      raios: Object.fromEntries([...contagem].map(([slug, n]) => [slug, raioDoNo(n)])),
      arestas,
      isolados: nos.filter((n) => contagem.has(n.slug) && !conectados.has(n.slug)).map((n) => ({ slug: n.slug, nome: n.nome })),
    };
  };
  // Um período por ano que tenha alguma coautoria entre membros
  const anos = [...new Set(publicacoes.map((p) => p.ano))].sort((a, b) => a - b);
  const porAno = anos
    .map((ano) =>
      periodo(
        String(ano),
        String(ano),
        publicacoes.filter((p) => p.ano === ano),
      ),
    )
    .filter((p) => p.arestas.length > 0);
  return {
    largura: LARGURA,
    altura: ALTURA,
    nos,
    periodos: [periodo("todos", "Todos", publicacoes), ...porAno],
  };
}

/** Layout de forças (Fruchterman–Reingold) com gravidade e separação final para evitar sobreposição. */
function posicionar(nos: NoRede[], arestas: ArestaRede[]) {
  const indice = new Map(nos.map((n, i) => [n.slug, i]));
  const k = Math.sqrt(((LARGURA - 2 * MARGEM) * (ALTURA - 2 * MARGEM)) / Math.max(nos.length, 1)) * 0.75;

  // Início determinístico: espiral (os mais publicados no centro)
  nos.forEach((n, i) => {
    const angulo = i * 2.399963; // ângulo áureo
    const raio = 12 * Math.sqrt(i + 1);
    n.x = Math.cos(angulo) * raio;
    n.y = Math.sin(angulo) * raio;
  });

  let temperatura = LARGURA / 8;
  for (let it = 0; it < ITERACOES; it++) {
    const dx = new Float64Array(nos.length);
    const dy = new Float64Array(nos.length);
    // Repulsão entre todos os pares
    for (let i = 0; i < nos.length; i++)
      for (let j = i + 1; j < nos.length; j++) {
        const vx = nos[i].x - nos[j].x;
        const vy = nos[i].y - nos[j].y;
        const d = Math.max(Math.hypot(vx, vy), 0.01);
        const f = (k * k) / d;
        dx[i] += (vx / d) * f;
        dy[i] += (vy / d) * f;
        dx[j] -= (vx / d) * f;
        dy[j] -= (vy / d) * f;
      }
    // Atração pelas arestas (mais forte quanto mais artigos juntos)
    for (const a of arestas) {
      const i = indice.get(a.a) as number;
      const j = indice.get(a.b) as number;
      const vx = nos[i].x - nos[j].x;
      const vy = nos[i].y - nos[j].y;
      const d = Math.max(Math.hypot(vx, vy), 0.01);
      const f = ((d * d) / k) * (1 + Math.log(a.peso) * 0.5);
      dx[i] -= (vx / d) * f;
      dy[i] -= (vy / d) * f;
      dx[j] += (vx / d) * f;
      dy[j] += (vy / d) * f;
    }
    // Gravidade: mantém os componentes soltos perto do centro
    for (let i = 0; i < nos.length; i++) {
      dx[i] -= nos[i].x * 0.04 * k * 0.1;
      dy[i] -= nos[i].y * 0.04 * k * 0.1;
    }
    for (let i = 0; i < nos.length; i++) {
      const d = Math.max(Math.hypot(dx[i], dy[i]), 0.01);
      const passo = Math.min(d, temperatura);
      nos[i].x += (dx[i] / d) * passo;
      nos[i].y += (dy[i] / d) * passo;
    }
    temperatura = Math.max(temperatura * 0.985, 1);
  }

  ajustarNaArea(nos);

  // Separação: cada pessoa ocupa um retângulo (nome em cima + bolinha); retângulos que se
  // cruzam são afastados na direção de menor sobreposição
  const caixa = (n: NoRede) => {
    const meiaLargura = Math.max(n.rotulo.length * 3.1, n.raio) + 3;
    const topo = n.y - n.raio - 19;
    const base = n.y + n.raio + 2;
    return {
      cx: n.x,
      cy: (topo + base) / 2,
      mx: meiaLargura,
      my: (base - topo) / 2,
    };
  };
  for (let it = 0; it < 300; it++) {
    let mexeu = false;
    for (let i = 0; i < nos.length; i++)
      for (let j = i + 1; j < nos.length; j++) {
        const a = caixa(nos[i]);
        const b = caixa(nos[j]);
        const sobraX = a.mx + b.mx - Math.abs(b.cx - a.cx);
        const sobraY = a.my + b.my - Math.abs(b.cy - a.cy);
        if (sobraX <= 0 || sobraY <= 0) continue;
        mexeu = true;
        if (sobraY < sobraX) {
          const s = (b.cy >= a.cy ? 1 : -1) * (sobraY / 2 + 0.5);
          nos[i].y -= s;
          nos[j].y += s;
        } else {
          const s = (b.cx >= a.cx ? 1 : -1) * (sobraX / 2 + 0.5);
          nos[i].x -= s;
          nos[j].x += s;
        }
      }
    // Mantém tudo dentro da área
    for (const n of nos) {
      const c = caixa(n);
      n.x = Math.min(Math.max(n.x, c.mx + 4), LARGURA - c.mx - 4);
      n.y = Math.min(Math.max(n.y, n.raio + 23), ALTURA - n.raio - 6);
    }
    if (!mexeu) break;
  }
}

/** Estica as posições para ocupar a área do desenho (escalas separadas na horizontal e na vertical). */
function ajustarNaArea(nos: NoRede[]) {
  const xs = nos.map((n) => n.x);
  const ys = nos.map((n) => n.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const escalaX = (LARGURA - 2 * MARGEM) / Math.max(maxX - minX, 1);
  const escalaY = (ALTURA - 2 * MARGEM) / Math.max(maxY - minY, 1);
  for (const n of nos) {
    n.x = (n.x - minX) * escalaX + MARGEM;
    n.y = (n.y - minY) * escalaY + MARGEM;
  }
}

// ---------------------------------------------------------------------------
// Rede de uma pessoa (perfil): ela no centro e os coautores do INTERAS em volta
// ---------------------------------------------------------------------------

const LARGURA_PESSOA = 1000;
const ALTURA_PESSOA = 640;
const RAIO_ANEL = 230;

/**
 * Coautoria de uma pessoa: só as publicações dela, com todos os membros (inclusive bolsistas).
 * A pessoa fica no centro; os coautores, num anel em volta (mais artigos juntos primeiro, a
 * partir do topo, no sentido horário), com o nome do lado de fora. Linhas entre coautores
 * (artigos que eles fizeram juntos com a pessoa) também aparecem.
 * O tamanho de cada bolinha é o número de artigos com a pessoa (a dela, o total de artigos).
 * Devolve `null` se a pessoa não tem coautoria com outro membro.
 */
export function redeDaPessoa(slug: string): Rede | null {
  const conteudo = carregarConteudo();
  const porSlug = new Map(conteudo.pessoas.map((p) => [p.slug, p]));
  const publicacoes = conteudo.publicacoes.filter((p) => p.pessoas.includes(slug));
  const { contagem, arestas } = contar(publicacoes);
  const coautores = [...contagem.keys()].filter((s) => s !== slug && porSlug.has(s));
  if (coautores.length === 0) return null;

  const pesoCom = new Map(arestas.filter((a) => a.a === slug || a.b === slug).map((a) => [a.a === slug ? a.b : a.a, a.peso]));
  coautores.sort((a, b) => (pesoCom.get(b) ?? 0) - (pesoCom.get(a) ?? 0) || porSlug.get(a)!.nome.localeCompare(porSlug.get(b)!.nome, "pt-BR"));

  const cx = LARGURA_PESSOA / 2;
  const cy = ALTURA_PESSOA / 2;
  const pessoa = porSlug.get(slug)!;
  const publicacoesNo: Record<string, number> = { [slug]: contagem.get(slug) ?? 0 };
  const nos: NoRede[] = [
    {
      slug,
      nome: pessoa.nome,
      rotulo: nomeCurto(pessoa.nome),
      grupo: grupoDaCategoria(pessoa.categoria),
      publicacoes: publicacoesNo[slug],
      x: cx,
      y: cy,
      raio: raioDoNo(publicacoesNo[slug]),
    },
  ];
  coautores.forEach((s, i) => {
    const p = porSlug.get(s)!;
    const n = pesoCom.get(s) ?? 0;
    publicacoesNo[s] = n;
    const angulo = -Math.PI / 2 + (2 * Math.PI * i) / coautores.length;
    const raio = raioDoNo(n);
    const [cos, sin] = [Math.cos(angulo), Math.sin(angulo)];
    const x = cx + RAIO_ANEL * cos;
    const y = cy + RAIO_ANEL * sin;
    // Nome do lado de fora do anel, alinhado conforme o lado
    const distancia = raio + 8;
    nos.push({
      slug: s,
      nome: p.nome,
      rotulo: nomeCurto(p.nome),
      grupo: grupoDaCategoria(p.categoria),
      publicacoes: n,
      x,
      y,
      raio,
      rotuloX: x + distancia * cos,
      rotuloY: y + distancia * sin + (sin > 0.3 ? 10 : Math.abs(sin) <= 0.3 ? 4 : 0),
      ancora: cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle",
    });
  });

  return {
    largura: LARGURA_PESSOA,
    altura: ALTURA_PESSOA,
    nos,
    periodos: [
      {
        chave: "todos",
        rotulo: "Todos",
        publicacoes: publicacoesNo,
        raios: Object.fromEntries(nos.map((n) => [n.slug, n.raio])),
        arestas: arestas.filter((a) => porSlug.has(a.a) && porSlug.has(a.b)),
        isolados: [],
      },
    ],
  };
}
