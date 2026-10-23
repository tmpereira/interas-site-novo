# Site do INCT INTERAS — reconstrução em Next.js

Este arquivo orienta o Claude Code na reconstrução e na manutenção do site do
INCT INTERAS (Instituto Nacional de Ciência e Tecnologia das Radiações na
Saúde), hoje em www.interas.org. Leia este arquivo inteiro antes de começar
qualquer etapa.

Idioma de trabalho: **português do Brasil** (conversa, comentários no código,
mensagens de commit e conteúdo do site).

---

## 1. Contexto e motivação

O site atual está no repositório `https://github.com/interas-inct/interaswebsite`
e é feito em **Quarto** (ecossistema R), gerado localmente na pasta `docs/` e
publicado pelo GitHub Pages. Ele funciona, mas é muito trabalhoso de atualizar:

- Cada pessoa da equipe é um arquivo `.qmd` separado (≈ 94 arquivos em 8 pastas),
  cada um com YAML e um bloco de HTML de breadcrumb copiado à mão.
- Cada artigo é um `.qmd` gerado por um script R (`gera_pub_bib2.R`) a partir de
  um `.bib` do Zotero (≈ 368 arquivos). Atualizar exige rodar o R e regerar tudo.
- Cada notícia, vídeo, grupo e patente também é um arquivo `.qmd` próprio.
- É preciso ter R + Quarto instalados e commitar a saída gerada (`docs/`, 58 MB).
- Há 4 cópias de `.bib` acumuladas no repositório.

**Objetivo:** refazer o site em Next.js, mantendo o mesmo visual e o mesmo
conteúdo, com **todo o conteúdo em arquivos JSON**. A manutenção do dia a dia
será feita pelo usuário pedindo ao Claude Code coisas como "extraia os artigos
novos do Lattes deste pesquisador e atualize `publicacoes.json`" ou "inclua esta
pessoa como líder de laboratório". Por isso a base de dados precisa ser
previsível, validada e fácil de ler e editar por máquina.

---

## 2. Decisões já tomadas (não reabrir sem o usuário pedir)

| Tema | Decisão |
|---|---|
| Framework | **Next.js** (App Router, TypeScript) com **exportação estática** (`output: 'export'`). O site final é só HTML/CSS/JS. |
| Conteúdo | **Tudo em JSON**, na pasta `content/`: configurações do site, home, pessoas, publicações, patentes, grupos, vídeos e páginas institucionais. **Única exceção: notícias**, que ficam na pasta `content/noticias/`, **um arquivo Markdown por notícia** (seção 6.5). Nada de YAML nem `.bib` como fonte do site. |
| Quem edita | Apenas o usuário, no **VS Code**, normalmente pedindo ao **Claude Code** para atualizar os JSON. **Não criar CMS, painel /admin nem formulários.** |
| Hospedagem futura | Vercel, plano Hobby, conta pessoal do usuário. **Não configurar deploy agora.** |
| Visual | **Manter o visual atual** (tema Bootswatch *Materia* + `custom.scss`, logos, banner, cores). Toda a parte de estilo fica separada da estrutura e do conteúdo (ver seção 9). |
| Fora do escopo | "INTERAS em números", "Preprints", "Mulheres INTERAS". Não migrar. |
| Versão em inglês | **Última etapa**, só depois que o site em português estiver pronto e aprovado. |
| Ambiente | Tudo desenvolvido e testado **localmente**, numa pasta no computador do usuário, **sem conexão com o GitHub**. Git apenas local (commits sem remoto). Quando o site estiver pronto, o usuário cria um **repositório novo** no GitHub. Publicação e migração do domínio ficam para depois. |
| Banco de dados / backend | Nenhum. Tudo é gerado no build a partir dos JSON do repositório. |

---

## 3. Princípios do projeto

1. **Conteúdo é dado, não código.** Todo conteúdo fica em `content/`
   (`*.json` e `noticias/*.md`). Componentes React nunca contêm texto
   institucional fixo, exceto rótulos de interface.
2. **Uma coleção = um arquivo JSON.** Cada tipo de conteúdo (pessoas,
   publicações, grupos...) é uma lista dentro de um único arquivo. Adicionar
   algo é acrescentar um objeto à lista, nunca criar arquivos novos (exceto
   imagens). **Exceção: notícias**, em que cada notícia é um arquivo `.md`
   dentro de `content/noticias/`.
3. **Textos longos ficam dentro do JSON**, em um campo `conteudo` com
   **Markdown** (string). Nas notícias, o próprio corpo do arquivo `.md` é o
   texto. O site converte o Markdown em HTML no build.
4. **Páginas de detalhe são geradas automaticamente** (`generateStaticParams`)
   a partir dos dados. Ninguém cria página à mão.
5. **Validação no build.** Todos os JSON e os cabeçalhos das notícias são
   validados com **Zod**. Se faltar
   um campo obrigatório, um `id` estiver duplicado, uma categoria for inválida
   ou uma referência apontar para algo inexistente (ex.: grupo com `slug` de
   pessoa que não existe), o build falha com mensagem clara em português
   indicando o arquivo, o item e o campo.
6. **Campos extras são permitidos.** Os esquemas validam só o que é
   obrigatório e aceitam campos adicionais (`.passthrough()`), para que o
   usuário possa enriquecer os dados (citações, fator de impacto, Qualis,
   ORCID...) sem alterar código.
7. **Simplicidade.** Poucas dependências. Nada de CMS, banco, autenticação,
   API routes ou recursos que exijam servidor.
8. **Breadcrumbs, menus e listagens são componentes**, nunca HTML repetido no
   conteúdo.

---

## 4. Stack técnica

- Next.js (versão estável mais recente) + TypeScript + App Router
- `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`
- **Bootstrap 5 + Bootswatch Materia** (via npm) + **Sass**
- **Bootstrap Icons** (o site atual usa ícones `bi-*`)
- `zod` (v4) para validar os JSON; os JSON Schemas (seção 6.0) são gerados pelo
  próprio Zod (`z.toJSONSchema`), sem pacote extra
- Scripts em `scripts/*.ts` rodam direto no Node 24 (`node scripts/x.ts`, sem
  `tsx`). Por isso o `package.json` tem `"type": "module"` e os imports entre
  arquivos `.ts` usam a extensão (`./esquemas.ts`)
- `remark` + `remark-gfm` + `rehype` para converter os campos `conteudo` e o
  corpo das notícias (Markdown) em HTML
- `gray-matter` para ler o cabeçalho (front matter) das notícias
- Busca/filtro de publicações no cliente, sem biblioteca pesada (filtro simples
  em JS é suficiente para ~400 itens)
- Somente nos scripts de migração (`scripts/migracao/`): `yaml` para ler os
  `.qmd` antigos, e `@retorquere/bibtex-parser` para ler o `.bib`
  antigo. Essas bibliotecas não são usadas pelo site.

Antes de instalar, confira as versões atuais dos pacotes; não fixe versões de
memória.

---

## 5. Estrutura de pastas alvo

```
/
├── CLAUDE.md
├── content/                    # TODA a base de dados do site
│   ├── site.json               # título, menu, anúncio, rodapé, redes, Google Analytics
│   ├── home.json               # hero, apresentação e blocos de destaque da página inicial
│   ├── pessoas.json            # toda a equipe
│   ├── publicacoes.json        # todas as publicações
│   ├── patentes.json           # patentes, softwares e marcas (INPI)
│   ├── grupos.json             # grupos e laboratórios
│   ├── noticias/               # UMA notícia por arquivo Markdown
│   │   └── <aaaa-mm-dd>-<slug>.md
│   ├── videos.json             # produções audiovisuais
│   ├── paginas.json            # páginas institucionais (sobre, áreas de pesquisa, contato)
│   └── schemas/                # JSON Schemas gerados a partir do Zod (não editar à mão)
├── public/
│   ├── images/                 # imagens institucionais (logo, banner, home)
│   ├── images/grupos/
│   ├── fotos/pessoas/<slug>.jpg
│   ├── noticias/<id>/...       # imagens das notícias
│   ├── videos/...              # capas dos vídeos
│   └── arquivos/               # PDFs e outros anexos
├── src/
│   ├── app/                    # rotas (ver seção 7)
│   ├── components/             # Navbar, Footer, Breadcrumb, CardPessoa, ListaPublicacoes...
│   ├── lib/
│   │   ├── esquemas.ts         # esquemas Zod de todas as coleções (fonte única)
│   │   └── conteudo.ts         # funções que leem e validam os JSON e as notícias
│   └── styles/                 # TODO o estilo do site (ver seção 9)
├── scripts/
│   ├── migracao/               # scripts de migração ÚNICA do Quarto → content/ (seção 8)
│   ├── validar.ts              # `npm run validar`: valida todos os JSON sem fazer build
│   └── gerar-schemas.ts        # `npm run schemas`: regenera content/schemas/
├── .vscode/settings.json       # associa cada JSON ao seu schema (autocompletar e erros no editor)
└── _legado/                    # clone do repositório antigo, SÓ LEITURA, no .gitignore
```

---

## 6. Formatos de dados (esquemas)

Use estes formatos como ponto de partida. Ajuste se a migração revelar campos
que não estão previstos, mas avise o usuário e atualize esta seção.

### 6.0 Convenções gerais de todos os JSON

- Codificação UTF-8, indentação de **2 espaços**, chaves em português,
  `snake_case` (ex.: `fator_impacto`, `palavras_chave`).
- Cada arquivo de coleção é um objeto com uma lista dentro, por exemplo
  `{ "pessoas": [ ... ] }`. Isso permite incluir `"$schema"` no topo do arquivo.
- Todo item tem um identificador estável: `id` (publicações, notícias) ou
  `slug` (pessoas, grupos, vídeos, páginas). Ele vira a URL e **nunca muda**
  depois de criado. Slugs em minúsculas, sem acentos, com hífens.
- Datas no formato `AAAA-MM-DD`.
- Campos sem valor: `null` (não omitir campos obrigatórios; campos opcionais
  podem ser omitidos).
- Textos longos: campo `conteudo` com Markdown. Quebras de linha como `\n`.
  Sem HTML com `style=` nem classes visuais dentro do conteúdo.
- Caminhos de imagem relativos a `public/`, começando com `/`.
- Ordem estável dentro de cada arquivo (definida em cada coleção abaixo), para
  que os diffs no Git fiquem limpos.
- `src/lib/esquemas.ts` é a fonte única dos formatos. Os arquivos em
  `content/schemas/` são gerados a partir dele (`npm run schemas`) e o
  `.vscode/settings.json` os associa aos JSON, para que o VS Code mostre
  autocompletar e erros enquanto se edita.

### 6.1 `content/pessoas.json`

```json
{
  "$schema": "./schemas/pessoas.schema.json",
  "pessoas": [
    {
      "slug": "denise-maria-zezell",
      "nome": "Denise Maria Zezell",
      "categoria": "coordenacao",
      "cargo": "Coordenadora",
      "ordem": 1,
      "foto": "/fotos/pessoas/denise-maria-zezell.jpeg",
      "instituicao": {
        "nome": "Instituto de Pesquisas Energéticas e Nucleares - IPEN",
        "url": "http://www.ipen.br"
      },
      "grupos": ["lab-biofotonica"],
      "lattes": "http://lattes.cnpq.br/0751040282401769",
      "scholar": "https://scholar.google.com/citations?user=T-7bPc0AAAAJ",
      "orcid": null,
      "areas": "Prop. Óticas e Espectrosc. da Mat. Condens; ...",
      "atuacao": "Gerenciar o INCT, coordenação geral e dos subprojetos; ...",
      "ativo": true
    }
  ]
}
```

- Ordem no arquivo: por categoria (na ordem da tabela abaixo), depois `ordem`,
  depois nome.
- `ordem: null` = ordem alfabética pelo nome. No site antigo todos tinham o
  mesmo `sortby`, então a migração deixou `null` para todos.
- `grupos`: na migração, só foi preenchido quando a página do grupo tinha link
  para o perfil da pessoa (coordenadores e poucos membros).
- `ativo: false` mantém a pessoa no histórico sem exibi-la na página da equipe.
- O `lattes` é o identificador usado nas atualizações via Lattes (seção 11).

Categorias válidas (na ordem de exibição da página "Coordenação e Equipe"):

| chave | título da seção | pasta antiga | qtd. aprox. |
|---|---|---|---|
| `coordenacao` | Coordenação | `pessoas/coordenacao` | 2 |
| `comite-gestor` | Comitê Gestor | `pessoas/membro-do-comite-gestor` | 4 |
| `pesquisador` | Pesquisadores | `pessoas/pesquisador` | 17 |
| `colaborador` | Colaboradores | `pessoas/colaborador` | 6 |
| `equipe-estrangeira` | Equipe Estrangeira | `pessoas/equipe-estrangeira` | 9 |
| `lider-laboratorio` | Líderes de Laboratórios Associados | `pessoas/lider-de-laboratorio-associado` | 9 |
| `apoio-tecnico` | Apoio Técnico | `pessoas/apoio-tecnico` | 2 |
| `bolsista` | Bolsistas | `pessoas/bolsista` | 44 |

A ordem acima é a real da listagem antiga (`pessoas/coord-equipe.qmd`). Os
títulos das seções ficam em `site.json` (`categorias_pessoas`, lista de
`{ chave, titulo }` na ordem de exibição); a validação exige um título para
cada categoria.

### 6.2 `content/publicacoes.json`

```json
{
  "$schema": "./schemas/publicacoes.schema.json",
  "publicacoes": [
    {
      "id": "abreu_frenectomia_2024",
      "tipo": "artigo",
      "titulo": "Frenectomia lingual com laser de alta potência em paciente com transtorno do espectro autista - relato de caso",
      "autores": ["Abreu, Darlene Felix De", "Batista, Roberta M.", "Moraes, Marcia Cristina Dias De"],
      "ano": 2024,
      "data": "2024-01-01",
      "periodico": "Cadernos de Odontologia",
      "volume": "6",
      "numero": "1",
      "paginas": null,
      "doi": "10.29327/2442440.6.1-12",
      "url": null,
      "resumo": "O transtorno do espectro autista (TEA)...",
      "palavras_chave": [],
      "pessoas": ["denise-maria-zezell"],
      "grupos": [],
      "citacoes": null,
      "fator_impacto": null,
      "qualis": null,
      "fonte": "bib-2026-04-15"
    }
  ]
}
```

- `id`: na migração, a chave BibTeX original (ex.: `abreu_frenectomia_2024`).
  Para artigos novos, seguir o mesmo padrão `sobrenome_primeirapalavra_ano`
  (minúsculas, sem acentos) e garantir que seja único.
- Ordem no arquivo: `data` decrescente, depois `id`.
- `tipo`: `artigo`, `livro`, `capitulo`, `trabalho-evento`, `outro`.
- `pessoas`: slugs de `pessoas.json` dos membros do INTERAS que são autores.
  Preencher quando for possível identificar com segurança; permite listar as
  publicações de cada pessoa no perfil dela.
- `grupos`: slugs de `grupos.json` (substitui o antigo `gpesqlab`). Links de
  preprint/materiais, se existirem, entram como `preprint` e `materiais`.
- **Métricas** (`citacoes`, `fator_impacto`, `qualis`) começam como `null`. A
  página de publicações as exibe **quando preenchidas** e permite ordenar e
  filtrar por elas; quando estão todas vazias, não aparecem. Outros campos
  (ex.: `jcr_quartil`, `area`) podem ser criados livremente.
- `fonte`: de onde o registro veio (ex.: `bib-2026-04-15`, `lattes-2026-11-03`).
- **Duplicatas:** antes de incluir um artigo, verificar se já existe pelo DOI
  (comparação sem diferenciar maiúsculas e sem prefixo `https://doi.org/`) e,
  sem DOI, por título normalizado + ano. Nunca incluir duas vezes.
- **Nunca sobrescrever** campos preenchidos manualmente (métricas, `pessoas`,
  `grupos`) ao atualizar um registro existente.

Geração inicial (migração, seção 8):
- Fonte: o `.bib` mais recente do repositório antigo
  (`INTERAS_20260415_ate202604.bib`, 356 entradas: 354 `@article`, 2 `@misc`).
- **Descartar o campo `file`** (contém caminhos locais do Zotero, ex.:
  `/home/mario/Zotero/storage/...`).
- Converter LaTeX residual para texto (sobrescrito, subscrito, `\&`, `\%`,
  chaves soltas), como fazia a função `sanitize_for_yaml` do script R antigo.
  Não alterar a capitalização de títulos sem perguntar.
- `titulo` e `resumo` podem conter itálico em Markdown (ex.:
  `*Neisseria gonorrhoeae*`), vindo do `<i>` do BibTeX; o site renderiza esses
  campos como Markdown em linha.
- Diferença 368 × 356 (investigada): a pasta antiga de artigos tem exatamente
  as 356 chaves do `.bib`; o "368" era a listagem de `/publicacoes/` do site no
  ar, que somava 356 artigos + 11 patentes (+ índice). Nenhum artigo faltando.

### 6.3 `content/patentes.json`

```json
{
  "patentes": [
    {
      "id": "p2023-software-focal",
      "titulo": "Software FOCAL",
      "tipo": "software",
      "autores": ["Telles, L. F. K.", "Oliveira, L. S. S.", "Santos Filho, M. L.", "Souza, D. N."],
      "numero": "512023003626-9",
      "orgao": "INPI - Programa de Computador",
      "data": "2023-11-24",
      "categorias": ["Software", "INPI"],
      "pessoas": [],
      "conteudo": null
    }
  ]
}
```

- `tipo`: `patente`, `software`, `marca`, `modelo-utilidade`, `outro`.
- Ordem: `data` decrescente. Origem: `_legado/publicacoes/patentes/*.qmd`
  (11 registros); o `id` é o nome do arquivo antigo.

### 6.4 `content/grupos.json`

```json
{
  "grupos": [
    {
      "slug": "lab-biofotonica",
      "titulo": "Laboratório de Biofotônica Aplicada",
      "resumo": "Nosso laboratório busca gerar conhecimento científico...",
      "imagem": "/images/grupos/lab_biofotonica_g.jpeg",
      "temas": ["diagnostico", "terapias", "dados", "inteligencia-artificial", "formacao"],
      "instituicao": "IPEN-CNEN",
      "site": "https://biophotonics.my.canva.site/",
      "coordenacao": ["denise-maria-zezell"],
      "abas": [
        { "titulo": "Membros do Laboratório", "conteudo": "#### Coordenação\n\n..." }
      ],
      "conteudo": "## Sobre o Laboratório\n\nCom sede no Instituto..."
    }
  ]
}
```

- Os grupos antigos usam `::: {.panel-tabset}`; cada aba vira um item de
  `abas`, exibido com um componente de abas.
- `coordenacao` são slugs de `pessoas.json` e viram links para os perfis.
  Links internos antigos (`/pessoas/...qmd`) viram links para a nova rota.
- `temas` válidos ficam definidos em `site.json` (`temas_grupos`, com `slug` e
  `rotulo`). Temas encontrados nos grupos antigos: `diagnostico`, `terapias`,
  `dados`, `inteligencia-artificial`, `formacao`, `computacao-cientifica`
  (`moleculas` não é usado por nenhum grupo).
- `site` é o endereço externo do laboratório (também citado no `conteudo`);
  `instituicao` é a sigla da sede, tirada do texto "Com sede no/na ...".
- Ordem: `titulo` alfabético. Origem: `_legado/grupos/*.qmd` (5 grupos).

### 6.5 `content/noticias/` (uma notícia por arquivo Markdown)

Notícias são a única coleção que **não** fica em JSON. Cada notícia é um
arquivo `.md` dentro de `content/noticias/`. Adicionar uma notícia = criar um
arquivo novo nessa pasta; apagar = remover o arquivo.

Exemplo: `content/noticias/2026-05-23-2o-workshop-anual.md`

```markdown
---
titulo: "2º Workshop Anual do INTERAS"
data: 2026-05-23
autor: "Mário O. de Menezes"
categorias: [evento, pesquisa, interas]
imagem: /noticias/2026-05-23-2o-workshop-anual/capa.jpg
resumo: ""
destaque: false
---

# 2º Workshop do INCT das Radiações na Saúde

O avanço científico nacional depende, fundamentalmente, da articulação...
```

- **Nome do arquivo** = `AAAA-MM-DD-slug.md` (minúsculas, sem acentos, com
  hífens). O nome sem a extensão é o `id` da notícia e vira a URL
  `/noticias/<id>/`. Não renomear depois de publicada.
- **Cabeçalho** (entre `---`): `titulo`, `data` e `imagem` obrigatórios;
  `autor`, `categorias`, `resumo` e `destaque` opcionais. Campos extras são
  aceitos. O cabeçalho é validado com Zod como os JSON; erros indicam o nome
  do arquivo e o campo.
- A `data` do cabeçalho deve coincidir com a data do nome do arquivo (o build
  avisa se não coincidir).
- **Corpo**: Markdown padrão (títulos, listas, negrito, links, imagens,
  tabelas). Sem HTML com `style=` nem classes visuais.
- Se `resumo` estiver vazio, usar o primeiro parágrafo do corpo na listagem.
- Imagens da notícia ficam em `public/noticias/<id>/` e são referenciadas no
  corpo como `![descrição](/noticias/<id>/arquivo.jpg)`.
- A listagem ordena por `data` decrescente (a ordem dos arquivos na pasta não
  importa).
- Origem: `_legado/noticias/posts/<pasta>/index.qmd` (13 notícias). Converter
  sintaxe do Quarto (`{target="_blank"}`, `::: {.callout}`, `{{< ... >}}` etc.)
  para Markdown padrão. Links externos abrem em nova aba automaticamente (o
  site antigo usava `link-external-newwindow: true`).

### 6.6 `content/videos.json`

```json
{
  "videos": [
    {
      "slug": "centro-lasers-aplicacoes",
      "titulo": "Centro de Lasers e Aplicações do IPEN-CNEN",
      "data": "2026-04-10",
      "resumo": "Apresentação de algumas pesquisas do CELAP",
      "capa": "/videos/INTERAS_CLA.png",
      "categorias": ["Dosimetria", "Fotônica", "Ótica"],
      "links": [
        { "rotulo": "Servidor Principal (Google Drive)", "url": "https://drive.google.com/file/d/.../view" },
        { "rotulo": "Servidor Alternativo (NextCloud CINAS-IPEN)", "url": "https://cloud.cinas.ipen.br/s/..." }
      ],
      "conteudo": "Este vídeo apresenta algumas pesquisas..."
    }
  ]
}
```

- Ordem: `data` decrescente. Origem: `_legado/videos/videos_arqs/*.qmd`.

### 6.7 `content/paginas.json`

```json
{
  "paginas": [
    { "slug": "sobre-o-interas", "titulo": "Instituto Nacional de Ciência e Tecnologia das Radiações na Saúde", "descricao": "INTERAS", "conteudo": "..." },
    { "slug": "areas-de-pesquisa", "titulo": "Áreas de Pesquisa", "descricao": null, "conteudo": "" },
    {
      "slug": "contato", "titulo": "Contato", "descricao": null, "conteudo": "## Sede do INTERAS\n\n...",
      "cartoes": [ { "titulo": "Secretaria e Contatos", "icone": "people-fill", "conteudo": "**Patrícia Neves**  \n..." } ]
    },
    { "slug": "equipe", "titulo": "COORDENAÇÃO E EQUIPE", "descricao": null, "conteudo": "" },
    { "slug": "grupos", "titulo": "Grupos de Pesquisa do INTERAS", "descricao": null, "conteudo": "Abaixo estão listados..." },
    {
      "slug": "publicacoes", "titulo": "Produção Científica e Tecnológica", "descricao": null, "conteudo": "",
      "titulo_artigos": "Artigos Originais", "titulo_patentes": "Propriedade Intelectual (Patentes e Softwares)"
    },
    { "slug": "noticias", "titulo": "NOTÍCIAS", "descricao": null, "conteudo": "" },
    { "slug": "videos", "titulo": "Produções Audiovisuais", "descricao": "Documentação e Divulgação Científica INTERAS", "conteudo": "Nesta seção..." }
  ]
}
```

- Três páginas institucionais (com rota própria: `/sobre-o-interas/`,
  `/areas-de-pesquisa/`, `/contato/`) e os textos de abertura das páginas de
  listagem (`equipe`, `grupos`, `publicacoes`, `noticias`, `videos`), lidos
  pelas rotas correspondentes da seção 7. Não existe rota genérica `/[slug]/`.
- `descricao` é o subtítulo da página.
- Campos extras usados: `cartoes` no contato (cartões com `titulo`, `icone`
  Bootstrap Icons sem o prefixo `bi-`, e `conteudo` em Markdown);
  `titulo_artigos` e `titulo_patentes` em `publicacoes`.
- Origem: `sobre-o-interas.qmd`, `areas-de-pesquisa.qmd` (só tem título),
  `contato.qmd` (cartões HTML transcritos), `pessoas/coord-equipe.qmd`,
  `grupos.qmd`, `publicacoes/index.qmd`, `noticias/index.qmd`,
  `videos/index.qmd`.

### 6.8 `content/home.json`

```json
{
  "$schema": "./schemas/home.schema.json",
  "hero": { "titulo": "Iluminando o Futuro da Saúde", "texto": "No INTERAS...", "imagem": "/images/..." },
  "apresentacao": "A pandemia de COVID-19 nos mostrou...",
  "destaques": [
    {
      "titulo": "A Luz que Revela",
      "texto": "Utilizamos a luz...",
      "imagem": "/images/luz_que_revela.jpeg",
      "posicao_imagem": "esquerda",
      "botao": { "rotulo": "Veja os grupos que atuam nesse tema", "link": "/grupos/?tema=diagnostico" }
    }
  ],
  "nota": "**Coordenação**: [Denise M. Zezell - IPEN - CNEN](/equipe/denise-maria-zezell/)  \n...",
  "noticias": { "titulo": "Últimas notícias do INTERAS", "quantidade": 3 },
  "publicacoes": { "titulo": "Últimas publicações do INTERAS", "quantidade": 6 }
}
```

- `texto`, `apresentacao` e `nota` são Markdown. `botao` pode ser `null`
  (o destaque "Moléculas Inteligentes" não tem botão). `nota` é o bloco de
  coordenação abaixo dos destaques.
- Origem: `index.qmd`. O HTML com estilo inline da home antiga vira dado aqui
  + classes CSS nos componentes.

### 6.9 `content/site.json`

```json
{
  "$schema": "./schemas/site.schema.json",
  "titulo": "INTERAS",
  "descricao": "Instituto Nacional de Ciência e Tecnologia das Radiações na Saúde",
  "url_base": "https://www.interas.org",
  "logo": "/images/logo_pt_transparente.png",
  "logo_alt": "INCT INTERAS",
  "favicon": "/images/favicon.ico",
  "imagem_compartilhamento": null,
  "menu": [
    { "rotulo": "INCT INTERAS", "itens": [ { "rotulo": "O INCT INTERAS", "link": "/sobre-o-interas/" } ] },
    { "rotulo": "NOTÍCIAS", "link": "/noticias/" }
  ],
  "anuncio": { "id": "news-video2-inst-1-2026", "ativo": true, "icone": "play-btn", "texto": "📢 **Novos Vídeos...**", "link": "/videos/" },
  "rodape": {
    "logo": "/images/3125_bordas_minimas_redim.png",
    "texto": "Copyright 2026 INTERAS",
    "redes": [ { "icone": "github", "rotulo": "GitHub", "url": "https://github.com/..." } ]
  },
  "google_analytics": "G-GSTPFS7CEE",
  "categorias_pessoas": [ { "chave": "coordenacao", "titulo": "COORDENAÇÃO" } ],
  "temas_grupos": [ { "slug": "diagnostico", "rotulo": "Diagnóstico" } ]
}
```

- `menu`: cada entrada é um link (`rotulo` + `link`) ou um submenu (`rotulo` +
  `itens`). Links internos são rotas novas (`/videos/`), não `.qmd`.
- `url_base` e `imagem_compartilhamento` servem ao sitemap e ao Open Graph.
- `anuncio` pode ser `null`; o `id` muda quando o aviso muda, para reaparecer
  para quem fechou o anterior.
- `temas_grupos`: os grupos antigos também usam "computação científica", além
  dos temas da seção 6.4.
- **Corrigir** no rodapé: o link do GitHub aponta para
  `ipencnensp/interaswebsite` (repositório antigo) e o do Twitter aponta só
  para `twitter.com`. Perguntar ao usuário quais links usar.

### 6.10 Validação (`src/lib/conteudo.ts`)

Além do formato de cada campo, `npm run validar` e o build conferem:
- **Erros** (interrompem o build): arquivo ausente ou JSON mal formado; `id`/
  `slug` repetido; referência a pessoa, grupo ou tema inexistente; título
  faltando para alguma categoria de pessoa; `ano` diferente do ano de `data`;
  duas publicações com o mesmo DOI; imagem referenciada que não existe em
  `public/`; nome de arquivo de notícia fora do padrão.
- **Avisos** (não interrompem): itens fora da ordem do arquivo; data do
  cabeçalho da notícia diferente da do nome do arquivo; publicações sem DOI com
  mesmo título e ano.
- As funções de ordenação de cada coleção (`compararPessoas`,
  `compararPublicacoes`...) estão exportadas em `conteudo.ts`; usá-las ao gravar
  os JSON para manter a ordem estável.

---

## 7. Páginas e rotas

| Rota | Conteúdo | Origem antiga |
|---|---|---|
| `/` | Hero, apresentação, blocos de destaque, 6 publicações e 3 notícias mais recentes | `index.qmd` |
| `/sobre-o-interas/` | Página institucional | `sobre-o-interas.qmd` |
| `/equipe/` | Pessoas ativas agrupadas por categoria, em grade com foto (coordenação) ou cartões com nome e cargo | `pessoas/coord-equipe.qmd` |
| `/equipe/[slug]/` | Perfil: foto, cargo, links (Lattes, Scholar, ORCID, instituição), áreas, atuação, grupos e publicações da pessoa | `pessoas/*/*.qmd` |
| `/areas-de-pesquisa/` | Página institucional | `areas-de-pesquisa.qmd` |
| `/grupos/` | Grade de grupos com filtro por tema (aceitar `#category=...` e `?tema=...`) | `grupos.qmd` |
| `/grupos/[slug]/` | Página do grupo, com abas | `grupos/*.qmd` |
| `/publicacoes/` | Artigos (busca por título/autor/periódico, filtro por ano, grupo e métricas, ordenação) + seção de patentes e softwares | `publicacoes/index.qmd` |
| `/publicacoes/[id]/` | Detalhe: título, autores (membros com link), periódico, volume/número, ano, métricas, resumo, botão DOI | `publicacoes/artigos/*.qmd` |
| `/noticias/` | Lista de notícias, mais recentes primeiro, com categorias | `noticias/index.qmd` |
| `/noticias/[id]/` | Notícia | `noticias/posts/*/index.qmd` |
| `/videos/` | Grade de vídeos | `videos/index.qmd` |
| `/videos/[slug]/` | Detalhe do vídeo com links | `videos/videos_arqs/*.qmd` |
| `/contato/` | Página institucional | `contato.qmd` |
| `404` | Página não encontrada | — |

Menu (mesma organização do site antigo), definido em `site.json`:
- **INCT INTERAS** ▸ O INCT INTERAS · Coordenação e Equipe · Áreas de Pesquisa · Grupos e Laboratórios · Contato
- **PRODUÇÃO** ▸ Artigos · Patentes
- **NOTÍCIAS**
- **VÍDEOS**

Breadcrumbs automáticos em todas as páginas internas. `lang="pt-BR"`.
Gerar `sitemap.xml` e metadados (título, descrição, Open Graph com imagem) por
página.

**Mapa de URLs antigas → novas:** gerar durante a migração
`scripts/migracao/redirecionamentos.json` com todas as URLs antigas do site
Quarto (ex.: `/pessoas/bolsista/allan-bereczki.html`) e a nova rota
correspondente. Será usado depois para configurar redirecionamentos na Vercel,
preservando links compartilhados e indexados no Google.

---

## 8. Migração do conteúdo (feita uma única vez)

1. O site antigo **já vem dentro de `_legado/`** na raiz do projeto (cópia do
   repositório `interas-inct/interaswebsite`, sem a pasta `.git` e sem a pasta
   gerada `docs/`). Conferir que `_legado/` contém `_quarto.yml`, `pessoas/`,
   `publicacoes/`, `noticias/`, `grupos/`, `videos/`, `images/` e o `.bib`
   `INTERAS_20260415_ate202604.bib`.
   - Se `_legado/` não existir ou estiver incompleta, baixar com
     `git clone --depth 1 https://github.com/interas-inct/interaswebsite.git _legado`
     e em seguida **apagar `_legado/.git`**, para que a cópia fique desligada
     do GitHub.
   - Garantir que `_legado/` está no `.gitignore`. **Nunca editar nada em
     `_legado/`.**
2. Escrever scripts em `scripts/migracao/` (Node/TypeScript) que leem os `.qmd`
   antigos (front matter YAML + corpo) e geram os JSON de `content/`:
   - pessoas → `pessoas.json` (do YAML: `title`, `subtitle`, `sortby`,
     `about.image`, `about.links`; do corpo: seções "Instituição", "Áreas de
     Atuação", "Atuação no Projeto"; a categoria vem da pasta). Copiar fotos de
     `pessoas/*/fotos/` para `public/fotos/pessoas/`.
   - `.bib` mais recente → `publicacoes.json`.
   - patentes, grupos, vídeos, páginas, home e configurações do site
     (`_quarto.yml`) → JSON correspondentes.
   - cada notícia antiga (`noticias/posts/<pasta>/index.qmd`) → um arquivo
     `content/noticias/<aaaa-mm-dd>-<slug>.md` (seção 6.5), com as imagens da
     pasta movidas para `public/noticias/<id>/`. Pastas antigas sem data
     completa no nome (ex.: `202504-...`) usam a `date` do front matter.
   - imagens usadas (`images/`, `images/grupos/`, capas de vídeos e notícias) →
     `public/`. **Não copiar** imagens que não são referenciadas em lugar nenhum
     (há várias versões duplicadas `.png`/`.jpeg` e `_v2`); listar para o
     usuário as que ficaram de fora.
   - PDFs em `images/` (ex.: `2026-INTERAS-ProgramaPreliminar.pdf`) → verificar
     se são linkados e, se forem, mover para `public/arquivos/`.
   - Depois de gerar pessoas e publicações, tentar preencher `pessoas` em cada
     publicação cruzando nomes de autores com `pessoas.json`. Só marcar
     correspondências seguras; listar as duvidosas no relatório.
3. Rodar `npm run validar` e gerar um **relatório de migração**
   (`scripts/migracao/RELATORIO.md`) com contagens por tipo (antes × depois),
   campos vazios (ex.: pessoas sem foto, sem Lattes, "Áreas de Atuação" vazias
   como `-`), itens com problema e decisões tomadas.
4. Revisar manualmente uma amostra de cada tipo comparando com o site antigo.
5. Depois de aprovada a migração, os scripts não são mais necessários. Podem
   ficar no repositório como histórico, mas o site **não depende** deles.

**Como foi feita:** `npm run migrar` (`scripts/migracao/migrar.ts`) apaga e
regera `content/*.json`, `content/noticias/` e as pastas de `public/` que
produz, a partir de `_legado/`, e grava `RELATORIO.md` e
`redirecionamentos.json`. **Depois que o conteúdo começar a ser editado à mão,
não rodar `npm run migrar` de novo**: ele sobrescreve tudo. Ajustes pontuais
feitos na migração (tabelas R da notícia "pesquisadores influentes" copiadas do
site no ar, cartões do contato, link Elsevier corrigido) estão documentados no
próprio código e no relatório.

Ignorar na migração: `docs/`, `.Rproj`, `gera_pub_bib*.R`, `ejs/`, `.bib`
antigos, `interas-em-numeros.qmd`, qualquer coisa de preprints e
mulheres INTERAS, `.nojekyll`, `CNAME`.

---

## 9. Visual

- Reproduzir o visual atual o mais fielmente possível: tema **Materia** do
  Bootswatch + regras do `custom.scss` e `custom_logo_interas.scss` antigos
  (hero com imagem de fundo e 80vh, blocos com imagem esmaecida à esquerda/
  direita, cartões, cores, tipografia).
- Navbar com logo `logo_pt_transparente.png`, menu à direita, colapsa abaixo de
  `lg`. Rodapé com logo pequena, copyright e ícones.
- Responsivo: conferir em celular (≈ 375px), tablet e desktop.
- Usar o site no ar (www.interas.org) como referência visual durante o
  desenvolvimento. Capturar telas do site antigo e do novo lado a lado nas
  verificações.

### 9.1 Separação total do estilo

Todo o estilo vive em `src/styles/`, separado da estrutura (componentes) e do
conteúdo (`content/`). Organização:

```
src/styles/
├── main.scss            # único ponto de entrada; só importa os demais, na ordem
├── _tokens.scss         # cores, fontes, tamanhos, espaçamentos, sombras, raios, breakpoints
├── _tema.scss           # carrega Bootstrap + Bootswatch Materia, sobrescrevendo variáveis com os tokens
├── _base.scss           # tipografia e elementos HTML gerais
├── _layout.scss         # navbar, rodapé, barra de anúncio, breadcrumbs, containers
└── componentes/
    ├── _hero.scss
    ├── _destaques.scss  # blocos com imagem esmaecida da home
    ├── _cards.scss
    ├── _pessoas.scss
    ├── _publicacoes.scss
    ├── _noticias.scss
    ├── _grupos.scss
    └── _videos.scss
```

Regras:
- **Nenhum valor visual fixo fora de `_tokens.scss`.** Cores, fontes, tamanhos,
  espaçamentos e sombras são sempre referências a tokens. Expor os tokens
  também como **variáveis CSS** (`:root { --cor-primaria: ... }`).
- **Nada de estilo nos componentes React:** sem `style={{...}}`, sem CSS-in-JS,
  sem cores ou tamanhos no TSX. Componentes usam apenas **classes semânticas**
  (ex.: `className="card-pessoa"`, `className="destaque destaque--imagem-esquerda"`),
  definidas nos arquivos SCSS. Classes utilitárias do Bootstrap só para grade e
  espaçamento básico (`row`, `col-*`, `container`).
- **Nada de estilo no conteúdo:** os JSON não contêm HTML com `style=` nem
  classes visuais.
- Imagens de fundo definidas por conteúdo são passadas como variável CSS
  (`--imagem-fundo`) a partir do dado, nunca como regra fixa no componente.
- Um arquivo SCSS por componente visual, com o mesmo nome do componente.
- Manter o resultado visual idêntico ao do site antigo. A organização acima é
  sobre **onde** o estilo fica, não sobre mudar a aparência.

### 9.2 Como o estilo foi portado (etapa 4)

- **Fonte raiz de 17px** (`$tamanho-fonte-raiz` em `_tokens.scss`): o Quarto
  define `--bs-root-font-size: 17px`, e todos os `rem` do site antigo partem
  disso. Sem isso, tudo fica ~6% menor que o original.
- **Classes do Bootstrap nos componentes:** o TSX usa só classes semânticas
  (`.menu-principal`, `.destaque`, `.card-noticia`...). O visual do Bootstrap/
  Materia vem de `@extend` nos arquivos SCSS (ex.: `.destaque__botao { @extend
  .btn; @extend .btn-primary; }`). No TSX só entram `row`, `col-*` e
  espaçamentos (`mb-0`).
- **Cabeçalho:** `position: sticky` (anúncio + navbar). O antigo era `fixed-top`
  com o Headroom do Quarto; o efeito é o mesmo sem JavaScript de deslocamento.
- **Menu:** `Navbar.tsx` é um componente de cliente (abre/fecha submenu e o
  menu do celular; fecha com clique fora, Esc ou ao navegar). Não usa o
  JavaScript do Bootstrap.
- **Barra de anúncio:** começa oculta no HTML e aparece no navegador se o
  visitante ainda não a fechou (`localStorage`, chave `anuncio-fechado-<id>`).
- **Blocos de destaque da home:** os pares (2º, 4º...) têm fundo
  `$cor-fundo-alternativo`. No site antigo só o 2º tinha esse fundo (estilo
  inline em um único bloco); a alternância foi escolhida por ser regra e não
  exceção. Para voltar ao original, trocar `&:nth-child(even)` em
  `_destaques.scss`.
- **Âncoras:** `/publicacoes/#artigos` e `/publicacoes/#patentes` (no site antigo
  eram `#articles` e `#patents`). A página de publicações deve usar esses `id`.
- **Estrutura das páginas:** `main.conteudo-principal` não limita a largura;
  cada página envolve seu conteúdo em `<div className="pagina">` (coluna de
  1135px). As páginas de listagem começam com `<FaixaTitulo>` (faixa azul de
  largura total com o `<h1>`), fora dessa coluna.
- **Equipe (etapa 5):** `/equipe/` mostra só pessoas com `ativo: true`;
  `/equipe/[slug]/` é gerada para todas (inclusive inativas, para não quebrar
  links). O perfil mostra, além do que o site antigo mostrava, os grupos e as
  publicações da pessoa (campos `grupos` e `pessoas` das outras coleções). A
  listagem tem breadcrumb, que o site antigo não tinha (CLAUDE.md, seção 7).
- **Publicações (etapa 6):** `/publicacoes/` tem a seção `#artigos` (lista com
  busca por título/autor/periódico, filtro por ano e ordenação) e a seção
  `#patentes`. Os controles de **grupo, Qualis, citações e fator de impacto só
  aparecem quando algum registro tem esses dados** (hoje todos estão vazios);
  se `grupos` ou as métricas forem preenchidos em `publicacoes.json`, os
  controles surgem sozinhos, com as ordenações "Mais citadas" e "Maior fator de
  impacto". A página de detalhe liga cada autor ao perfil quando ele é da
  equipe (`src/lib/autores.ts`, usando só as pessoas marcadas em `pessoas`) e
  inclui metadados para o Google Acadêmico. As patentes não têm página
  própria: os detalhes do registro ficam num bloco expansível. O bloco
  "Citação" (BibTeX) das páginas antigas não foi portado.
- **Títulos:** o Quarto usa h1 2rem, h2 1,65rem, h3 1,45rem, h4 1,25rem e peso
  600 em h1–h3 (o Materia usa h2 = 2rem e peso 500). Estão nos tokens
  (`$tamanho-h1`...`$peso-titulo`) e valem para todo o site.
- **Notícias, vídeos e grupos (etapa 7):** as três listagens usam o mesmo
  componente de cliente `FiltroPorCategoria` (barra "Categorias" à direita,
  como no Quarto; no celular fica acima da lista). Os itens são renderizados no
  servidor e passados prontos para ele. Em `/grupos/` o filtro aceita os links
  antigos `?tema=diagnostico` e `#category=intelig%C3%AAncia%20artificial`.
  Na notícia, os títulos do corpo descem um nível (o `#` vira `h2`), porque a
  página já tem o seu `<h1>`. Callouts do Quarto viraram citações (`>`), sem
  a cor de fundo. Os grupos usam abas acessíveis (`Abas`: setas, Home e End).
- **Páginas de texto:** `/sobre-o-interas/`, `/areas-de-pesquisa/` e `/contato/`
  usam `PaginaTexto`; o contato mostra os `cartoes` de `paginas.json`. A página
  de Áreas de Pesquisa está vazia (só o título), por decisão do usuário.
- **Ícone de busca da navbar:** o site antigo tinha a busca do Quarto; ela não
  faz parte do escopo (CLAUDE.md, seção 3, princípio 7) e não foi portada.

---

## 10. Etapas de execução

Fazer **uma etapa por vez**, mostrar o resultado ao usuário e esperar
aprovação antes de seguir. Fazer commit ao fim de cada etapa.

1. **Preparação** — conferir `_legado/` (seção 8, passo 1), iniciar Git **local** (`git init`,
   sem remoto), criar o `.gitignore` (com `_legado/`, `node_modules/`, `out/`,
   `.next/`), criar o projeto Next.js na raiz sem apagar o `CLAUDE.md`,
   configurar export estático, Bootstrap/Materia/Sass, ESLint e a estrutura de
   pastas.
2. **Esquemas** — `src/lib/esquemas.ts` com todos os esquemas Zod,
   `npm run validar`, `npm run schemas` e `.vscode/settings.json`.
3. **Migração** — scripts da seção 8, relatório, revisão com o usuário.
4. **Layout base** — navbar, rodapé, barra de anúncio, breadcrumbs, estilos
   portados, página inicial a partir de `home.json`.
5. **Equipe** — listagem por categoria e perfis.
6. **Publicações** — lista com busca/filtros (e métricas quando preenchidas),
   páginas de detalhe, patentes.
7. **Notícias, vídeos, grupos e páginas institucionais.**
8. **Acabamento** — 404, sitemap, metadados/Open Graph, Google Analytics,
   acessibilidade (alt em imagens, contraste, navegação por teclado), mapa de
   redirecionamentos.
9. **Verificação final** — `npm run build` sem erros nem avisos, checagem de
   links internos quebrados, comparação visual com o site antigo, contagens
   batendo com o relatório de migração.
10. **(Depois, só quando o usuário pedir)** versão em inglês.
11. **(Depois, só quando o usuário pedir)** publicação na Vercel, branch nova,
    domínio e redirecionamentos.

---

## 11. Manutenção do site (pedidos do dia a dia ao Claude Code)

Depois de pronto, o usuário vai atualizar o site pedindo ao Claude Code. Siga
estes procedimentos. **Em todos eles:** editar só o que está em `content/` (e
`public/` para imagens), respeitar a ordem de cada arquivo, rodar
`npm run validar` ao final e mostrar ao usuário um resumo do que mudou (itens
incluídos, alterados e ignorados) antes do commit.

### 11.1 Atualizar publicações a partir do Lattes ou de outra fonte

O usuário pode fornecer o currículo Lattes de um pesquisador (XML exportado
pela Plataforma Lattes, PDF ou texto copiado), um `.bib`, uma lista de DOIs ou
outra fonte.

1. Identificar a pessoa em `pessoas.json` (pelo link do Lattes ou pelo nome).
2. Extrair as publicações da fonte. Por padrão, considerar só as que ainda não
   estão na base; se o usuário indicar um período ("os artigos de 2026"),
   respeitar.
3. Para cada uma, checar duplicata (DOI; sem DOI, título normalizado + ano).
   - Se já existe: só acrescentar a pessoa em `pessoas` e completar campos
     vazios (ex.: DOI que faltava). **Nunca sobrescrever** campos preenchidos.
   - Se é nova: criar o registro no formato da seção 6.2, com `fonte`
     indicando a origem e a data.
4. Por padrão incluir apenas **artigos em periódicos**. Outros tipos (eventos,
   capítulos, livros) só se o usuário pedir.
5. Não inventar dados: se faltar DOI, volume ou resumo, deixar `null`. Pode-se
   buscar o DOI ou o resumo em fontes confiáveis (Crossref, site da revista) se
   o usuário autorizar.
6. Relatar: quantas novas, quantas já existiam, quais ficaram sem DOI e
   quaisquer casos duvidosos.

### 11.2 Incluir ou alterar uma pessoa

1. Usar o Lattes (ou os dados fornecidos) para preencher nome, instituição,
   áreas de atuação, link do Lattes e, se houver, ORCID/Scholar.
2. A **categoria e o cargo vêm do usuário** ("vai ser líder de laboratório").
   Se não forem informados, perguntar.
3. Gerar o `slug` a partir do nome, garantindo que seja único.
4. Foto: se o usuário fornecer, salvar em `public/fotos/pessoas/<slug>.jpg`.
5. Se pedido, rodar também o procedimento 11.1 para as publicações da pessoa.
6. Pessoa que saiu do projeto: marcar `"ativo": false` (não apagar, para não
   quebrar links de publicações e grupos), a menos que o usuário peça para
   remover.

### 11.3 Métricas de publicações

Fator de impacto, Qualis, citações e outros indicadores são editados direto em
`publicacoes.json`. Campos novos podem ser criados livremente (a validação os
aceita). Ao preencher em lote, informar a fonte e a data dos valores ao
usuário.

### 11.4 Notícias, vídeos, patentes, grupos e páginas

- **Nova notícia:** criar `content/noticias/<aaaa-mm-dd>-<slug>.md` com o
  cabeçalho da seção 6.5 e o texto em Markdown, e salvar as imagens em
  `public/noticias/<aaaa-mm-dd>-<slug>/`. Se o usuário mandar o texto pronto
  (e-mail, release, documento), manter o conteúdo e só ajustar a formatação
  para Markdown; não reescrever sem pedir.
- **Editar ou remover notícia:** editar ou apagar o arquivo correspondente.
- **Novo vídeo ou patente:** acrescentar em `videos.json` ou `patentes.json`.
- **Grupos e páginas institucionais:** editar `grupos.json` ou `paginas.json`.
- **Aviso no topo do site:** editar `anuncio` em `site.json`.

### 11.5 Comandos

- `npm run dev` — ver o site em `http://localhost:3000`.
- `npm run validar` — conferir todos os JSON e as notícias sem gerar o site.
- `npm run build` — gerar o site. Roda `npm run validar` antes (`prebuild`) e
  falha com mensagem clara se algum dado estiver errado.
- `npm run schemas` — regenerar `content/schemas/` depois de mudar `esquemas.ts`.

---

## 12. Regras de trabalho para o Claude Code

- Não reabrir as decisões da seção 2 por conta própria.
- Não criar CMS, painel administrativo, formulários de edição, banco de dados
  nem funções de servidor.
- Não configurar deploy, Vercel, DNS ou GitHub Actions até o usuário pedir.
- Não adicionar remoto Git nem fazer `push` até o usuário pedir.
- Não modificar o repositório antigo nem nada dentro de `_legado/`.
- Não inventar conteúdo: textos, nomes, cargos e dados vêm do site antigo ou de
  fontes fornecidas pelo usuário. Se algo estiver faltando ou ambíguo,
  perguntar.
- Antes de mudanças estruturais (formato dos JSON, rotas, dependências novas),
  explicar a proposta e esperar o "ok". Se o formato de um JSON mudar,
  atualizar `esquemas.ts`, regenerar os schemas e atualizar a seção 6 deste
  arquivo.
- Ao terminar cada etapa: rodar o build, conferir no navegador e resumir em
  poucas linhas o que foi feito e o que falta.
- Commits pequenos e descritivos, em português.
