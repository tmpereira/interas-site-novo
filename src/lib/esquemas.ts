// Esquemas Zod de todas as coleções de content/ — fonte única dos formatos.
// Os JSON Schemas de content/schemas/ são gerados a partir daqui (`npm run schemas`).
// Formatos documentados na seção 6 do CLAUDE.md.
//
// Regras gerais:
// - Objetos aceitam campos extras (z.looseObject), para enriquecer os dados sem mudar código.
// - Campos obrigatórios sem valor usam `null`; campos opcionais podem ser omitidos.
// - Referências entre coleções (slugs de pessoas, grupos, temas) são conferidas em conteudo.ts.

import { z } from "zod";

z.config(z.locales.ptBR());

// ---------------------------------------------------------------------------
// Tipos básicos
// ---------------------------------------------------------------------------

/** Identificador de URL: minúsculas, sem acentos, palavras separadas por hífen. */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "deve ter só minúsculas sem acento, números e hífens (ex.: maria-da-silva)");

/** Id de publicação/patente: como o slug, mas também aceita "_" (chaves BibTeX). */
export const idRegistro = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "deve ter só minúsculas sem acento, números, hífens e '_' (ex.: silva_laser_2024)");

/** Data no formato AAAA-MM-DD, conferindo se o dia existe. */
export const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "deve estar no formato AAAA-MM-DD")
  .refine((d) => {
    const dt = new Date(`${d}T00:00:00Z`);
    return !Number.isNaN(dt.getTime()) && dt.toISOString().startsWith(d);
  }, "não é uma data válida");

/** Caminho de arquivo dentro de public/, começando com "/". */
export const caminhoPublico = z
  .string()
  .regex(/^\/[^\s]+$/, "deve ser um caminho dentro de public/, começando com '/' e sem espaços (ex.: /images/logo.png)");

/** Endereço externo completo (http/https). */
export const url = z.url({ protocol: /^https?$/, error: "deve ser um endereço completo começando com http:// ou https://" });

/** Link: rota interna ("/videos/", "/grupos/?tema=x", "#ancora") ou endereço externo. */
export const link = z.union([z.string().regex(/^[/#]/), url], {
  error: "deve ser uma rota interna começando com '/' ou '#', ou um endereço http(s)",
});

/** Texto em Markdown (sem HTML com style= nem classes visuais). */
export const markdown = z.string();

/** DOI sem o prefixo https://doi.org/ (ex.: 10.1000/xyz). */
export const doi = z
  .string()
  .regex(/^10\.\d{4,}\/\S+$/, "deve começar com '10.' e não incluir o prefixo https://doi.org/");

const texto = z.string().min(1, "não pode ficar vazio");

// ---------------------------------------------------------------------------
// Pessoas — content/pessoas.json
// ---------------------------------------------------------------------------

/** Na ordem de exibição da página antiga "Coordenação e Equipe". */
export const CATEGORIAS_PESSOA = [
  "coordenacao",
  "comite-gestor",
  "pesquisador",
  "colaborador",
  "equipe-estrangeira",
  "lider-laboratorio",
  "apoio-tecnico",
  "bolsista",
] as const;

export const categoriaPessoa = z.enum(CATEGORIAS_PESSOA);

export const pessoa = z.looseObject({
  slug,
  nome: texto,
  categoria: categoriaPessoa,
  cargo: texto.nullable(),
  /** Posição dentro da categoria (menor primeiro); null = depois dos numerados, por nome. */
  ordem: z.number().int().nullable(),
  foto: caminhoPublico.nullable(),
  instituicao: z.looseObject({ nome: texto, url: url.nullable() }).nullable(),
  /** Slugs de grupos.json. */
  grupos: z.array(slug),
  lattes: url.nullable(),
  scholar: url.nullable(),
  orcid: url.nullable(),
  areas: z.string().nullable(),
  atuacao: z.string().nullable(),
  /** false = mantém no histórico, mas não aparece na página da equipe. */
  ativo: z.boolean(),
});

export const arquivoPessoas = z.looseObject({
  $schema: z.string().optional(),
  pessoas: z.array(pessoa),
});

// ---------------------------------------------------------------------------
// Publicações — content/publicacoes.json
// ---------------------------------------------------------------------------

export const TIPOS_PUBLICACAO = ["artigo", "livro", "capitulo", "trabalho-evento", "outro"] as const;

export const publicacao = z.looseObject({
  id: idRegistro,
  tipo: z.enum(TIPOS_PUBLICACAO),
  titulo: texto,
  autores: z.array(texto),
  ano: z.number().int().min(1900).max(2100),
  data,
  periodico: z.string().nullable(),
  volume: z.string().nullable(),
  numero: z.string().nullable(),
  paginas: z.string().nullable(),
  doi: doi.nullable(),
  url: url.nullable(),
  resumo: z.string().nullable(),
  palavras_chave: z.array(z.string()),
  /** Slugs de pessoas.json (membros do INTERAS que são autores). */
  pessoas: z.array(slug),
  /** Slugs de grupos.json. */
  grupos: z.array(slug),
  citacoes: z.number().int().min(0).nullable(),
  fator_impacto: z.number().min(0).nullable(),
  qualis: z.string().nullable(),
  /** Origem do registro, ex.: "bib-2026-04-15" ou "lattes-2026-11-03". */
  fonte: texto,
  preprint: url.nullable().optional(),
  materiais: url.nullable().optional(),
});

export const arquivoPublicacoes = z.looseObject({
  $schema: z.string().optional(),
  publicacoes: z.array(publicacao),
});

// ---------------------------------------------------------------------------
// Patentes, softwares e marcas — content/patentes.json
// ---------------------------------------------------------------------------

export const TIPOS_PATENTE = ["patente", "software", "marca", "modelo-utilidade", "outro"] as const;

export const patente = z.looseObject({
  id: idRegistro,
  titulo: texto,
  tipo: z.enum(TIPOS_PATENTE),
  autores: z.array(texto),
  numero: z.string().nullable(),
  orgao: z.string().nullable(),
  data,
  categorias: z.array(texto),
  /** Slugs de pessoas.json. */
  pessoas: z.array(slug),
  conteudo: markdown.nullable(),
});

export const arquivoPatentes = z.looseObject({
  $schema: z.string().optional(),
  patentes: z.array(patente),
});

// ---------------------------------------------------------------------------
// Grupos e laboratórios — content/grupos.json
// ---------------------------------------------------------------------------

export const abaGrupo = z.looseObject({
  titulo: texto,
  conteudo: markdown,
});

export const grupo = z.looseObject({
  slug,
  titulo: texto,
  resumo: z.string().nullable(),
  imagem: caminhoPublico.nullable(),
  /** Slugs de `temas_grupos` em site.json. */
  temas: z.array(slug),
  instituicao: z.string().nullable(),
  site: url.nullable(),
  /** Slugs de pessoas.json. */
  coordenacao: z.array(slug),
  abas: z.array(abaGrupo),
  conteudo: markdown.nullable(),
});

export const arquivoGrupos = z.looseObject({
  $schema: z.string().optional(),
  grupos: z.array(grupo),
});

// ---------------------------------------------------------------------------
// Vídeos — content/videos.json
// ---------------------------------------------------------------------------

export const linkRotulado = z.looseObject({
  rotulo: texto,
  url: link,
});

export const video = z.looseObject({
  slug,
  titulo: texto,
  data,
  resumo: z.string().nullable(),
  capa: caminhoPublico.nullable(),
  categorias: z.array(texto),
  links: z.array(linkRotulado),
  conteudo: markdown.nullable(),
});

export const arquivoVideos = z.looseObject({
  $schema: z.string().optional(),
  videos: z.array(video),
});

// ---------------------------------------------------------------------------
// Páginas institucionais — content/paginas.json
// ---------------------------------------------------------------------------

export const pagina = z.looseObject({
  slug,
  titulo: texto,
  descricao: z.string().nullable(),
  conteudo: markdown,
});

export const arquivoPaginas = z.looseObject({
  $schema: z.string().optional(),
  paginas: z.array(pagina),
});

// ---------------------------------------------------------------------------
// Notícias — cabeçalho (front matter) de content/noticias/<aaaa-mm-dd>-<slug>.md
// ---------------------------------------------------------------------------

/** Nome do arquivo sem extensão: AAAA-MM-DD-slug. */
export const idNoticia = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/, "o nome do arquivo deve ser AAAA-MM-DD-slug.md (minúsculas, sem acentos, com hífens)");

export const cabecalhoNoticia = z.looseObject({
  titulo: texto,
  data,
  imagem: caminhoPublico,
  autor: z.string().nullable().optional(),
  categorias: z.array(texto).optional(),
  /** Se vazio, a listagem usa o primeiro parágrafo do corpo. */
  resumo: z.string().nullable().optional(),
  destaque: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Página inicial — content/home.json
// ---------------------------------------------------------------------------

export const botao = z.looseObject({
  rotulo: texto,
  link,
});

export const destaque = z.looseObject({
  titulo: texto,
  texto: markdown,
  imagem: caminhoPublico,
  posicao_imagem: z.enum(["esquerda", "direita"]),
  botao: botao.nullable(),
});

export const secaoRecentes = z.looseObject({
  titulo: texto,
  /** Quantos itens mais recentes exibir. */
  quantidade: z.number().int().min(0),
});

export const arquivoHome = z.looseObject({
  $schema: z.string().optional(),
  hero: z.looseObject({
    titulo: texto,
    texto: markdown,
    imagem: caminhoPublico,
  }),
  apresentacao: markdown,
  destaques: z.array(destaque),
  /** Bloco curto abaixo dos destaques (ex.: coordenação), em Markdown. */
  nota: markdown.nullable(),
  noticias: secaoRecentes,
  publicacoes: secaoRecentes,
});

// ---------------------------------------------------------------------------
// Configurações do site — content/site.json
// ---------------------------------------------------------------------------

export const itemMenu = z.looseObject({
  rotulo: texto,
  link,
});

export const entradaMenu = z.union([
  itemMenu,
  z.looseObject({ rotulo: texto, itens: z.array(itemMenu).min(1) }),
]);

export const arquivoSite = z.looseObject({
  $schema: z.string().optional(),
  titulo: texto,
  descricao: z.string().nullable(),
  /** Endereço público do site, usado no sitemap e no Open Graph. */
  url_base: url,
  logo: caminhoPublico,
  logo_alt: texto,
  favicon: caminhoPublico,
  /** Imagem padrão do Open Graph. */
  imagem_compartilhamento: caminhoPublico.nullable(),
  menu: z.array(entradaMenu),
  /** Barra de aviso no topo; o visitante pode fechar (lembrado pelo `id`). */
  anuncio: z
    .looseObject({
      id: slug,
      ativo: z.boolean(),
      icone: z.string().nullable(),
      texto: markdown,
      link: link.nullable(),
    })
    .nullable(),
  rodape: z.looseObject({
    logo: caminhoPublico.nullable(),
    texto: z.string(),
    /** Ícones de redes sociais (nome do ícone bi-*, sem o prefixo). */
    redes: z.array(z.looseObject({ icone: texto, rotulo: texto, url })),
  }),
  google_analytics: z.string().regex(/^G-[A-Z0-9]+$/, "deve ser um ID do Google Analytics (G-XXXXXXX)").nullable(),
  /** Títulos das seções da página da equipe, na ordem de exibição. */
  categorias_pessoas: z.array(z.looseObject({ chave: categoriaPessoa, titulo: texto })),
  /** Temas usados no filtro de grupos. */
  temas_grupos: z.array(z.looseObject({ slug, rotulo: texto })),
});

// ---------------------------------------------------------------------------
// Tipos TypeScript derivados
// ---------------------------------------------------------------------------

export type CategoriaPessoa = z.infer<typeof categoriaPessoa>;
export type Pessoa = z.infer<typeof pessoa>;
export type Publicacao = z.infer<typeof publicacao>;
export type Patente = z.infer<typeof patente>;
export type Grupo = z.infer<typeof grupo>;
export type Video = z.infer<typeof video>;
export type Pagina = z.infer<typeof pagina>;
export type CabecalhoNoticia = z.infer<typeof cabecalhoNoticia>;
export type Noticia = CabecalhoNoticia & { id: string; corpo: string };
export type Home = z.infer<typeof arquivoHome>;
export type Site = z.infer<typeof arquivoSite>;

/** Arquivos JSON de content/ e seus esquemas (usado pela validação e pelo gerador de schemas). */
export const ARQUIVOS_JSON = {
  "site.json": arquivoSite,
  "home.json": arquivoHome,
  "pessoas.json": arquivoPessoas,
  "publicacoes.json": arquivoPublicacoes,
  "patentes.json": arquivoPatentes,
  "grupos.json": arquivoGrupos,
  "videos.json": arquivoVideos,
  "paginas.json": arquivoPaginas,
} as const;
