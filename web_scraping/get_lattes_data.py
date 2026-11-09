#!/usr/bin/env python3
"""
Baixa os currículos Lattes de todos os pesquisadores com o scriptLattes e
atualiza o site com o que vier neles.

Etapas:
  1. Ativa o venv do scriptLattes (source scriptLattes/scriptLattes/venv/bin/activate)
     e roda o scriptLattes (lista de pesquisadores em
     scriptLattes/interas/teste-02.list). Antes, apaga o cache de currículos,
     senão o scriptLattes reaproveita os HTMLs antigos e nada é atualizado.
  2. Lê os JSON gerados (um por pesquisador) e atualiza:
       - content/publicacoes.json  artigos em periódicos novos; nos que já existem,
                                   acrescenta a pessoa em `pessoas` e completa campos vazios
       - content/alunos.json       orientações (IC, mestrado, doutorado, pós-doc) novas;
                                   em andamento que foram concluídas passam a "concluida"
       - content/periodicos.json   periódicos novos e contagens/anos recalculados
       - content/patentes.json     patentes, softwares e marcas (a partir de --desde), lidos
                                   do HTML do currículo no cache (o JSON do scriptLattes vem
                                   sem eles); nas existentes, só acrescenta `pessoas`
       - content/pessoas.json      o link `lattes`, quando difere do ID do .list do
                                   scriptLattes (o .list é a referência dos IDs), e a `foto`:
                                   baixa a foto do Lattes (link "servletrecuperafoto" do HTML
                                   no cache) para public/fotos/pessoas/<slug>.jpg; fotos
                                   colocadas à mão (sem `foto_fonte` "lattes-...") não são tocadas
  3. Atualiza as métricas de TODOS os artigos com DOI pelo OpenAlex (citações,
     fator de impacto "proxy JCR" e países/colaboração internacional), toda vez.
     Métricas de outra fonte (fonte_metricas que não começa com "openalex") não
     são tocadas. Chave opcional da API: variável OPENALEX_API_KEY.
  4. Reordena os arquivos como o site espera e roda `npm run validar`.
  5. Grava um relatório em web_scraping/relatorio-lattes-<data>.md.

Regras (CLAUDE.md, seção 11.1): nunca sobrescreve campo preenchido, nunca inclui
duplicata (DOI; sem DOI, título normalizado + ano) e não inventa dados.

Uso (a partir da raiz do projeto ou de qualquer pasta):
  python3 web_scraping/get_lattes_data.py                  # baixa tudo e atualiza o site
  python3 web_scraping/get_lattes_data.py --pular-download # usa os JSON já gerados
  python3 web_scraping/get_lattes_data.py --simular        # só mostra o que mudaria
  python3 web_scraping/get_lattes_data.py --desde 2023     # artigos e patentes só a partir de 2023
  python3 web_scraping/get_lattes_data.py --ambiente meu_env          # outro ambiente conda
  python3 web_scraping/get_lattes_data.py --ambiente caminho/do/venv  # ou um venv
  python3 web_scraping/get_lattes_data.py --comando "python scriptLattes.py interas/teste-02.config"
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_SCRIPTLATTES = RAIZ / "web_scraping" / "scriptLattes"
CONFIG_PADRAO = "interas/teste-02.config"
VENV_PADRAO = "web_scraping/scriptLattes/scriptLattes/venv"
PASTA_JSON_PADRAO = PASTA_SCRIPTLATTES / "interas" / "lattes" / "json"
CONTENT = RAIZ / "content"

HOJE = dt.date.today().isoformat()
FONTE = f"lattes-{HOJE}"

# Chaves de orientação do scriptLattes -> nível em alunos.json (as demais são ignoradas).
NIVEIS = {
    "iniciacao_cientifica": "iniciacao-cientifica",
    "mestrado": "mestrado",
    "doutorado": "doutorado",
    "pos_doutorado": "pos-doutorado",
}

# Palavras puladas ao montar o id (mesmo padrão das chaves do Zotero já usadas no site).
PALAVRAS_VAZIAS = {"the", "a", "an", "in", "on", "of", "and", "for", "to", "o", "os", "as", "um", "uma", "el", "la", "los", "las"}


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def sem_acento(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c))


def normaliza(s: str) -> str:
    """Texto para comparação: minúsculas, sem acento, só letras e números."""
    return re.sub(r"[^a-z0-9]+", " ", sem_acento(s).lower()).strip()


def normaliza_doi(d: str | None) -> str | None:
    d = (d or "").strip()
    d = re.sub(r"^(https?://)?(dx\.)?doi\.org/", "", d, flags=re.I)
    d = re.sub(r"^doi:\s*", "", d, flags=re.I)
    return d if re.match(r"^10\.\d{4,}/\S+$", d) else None


def vazio_para_none(v):
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def ler_json(caminho: Path):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def gravar_json(caminho: Path, dados) -> None:
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(json.dumps(dados, ensure_ascii=False, indent=2) + "\n")


def maiusculo(s: str) -> bool:
    letras = [c for c in s if c.isalpha()]
    return len(letras) > 1 and all(c.isupper() for c in letras)


def capitaliza_palavra(p: str) -> str:
    return "-".join(x[:1].upper() + x[1:].lower() for x in p.split("-"))


def formata_autor(autor: str) -> str:
    """'PERES, D. L. P. M. O.' -> 'Peres, D. L. P. M. O.' (só mexe no que está todo em maiúsculas)."""
    autor = re.sub(r"\s+", " ", autor).strip()
    if "," not in autor:
        return autor
    sobrenome, prenomes = [x.strip() for x in autor.split(",", 1)]
    if maiusculo(sobrenome):
        sobrenome = " ".join(capitaliza_palavra(p) for p in sobrenome.split())
    # Prenomes: só palavras inteiras (>2 letras, sem ponto); iniciais ficam como estão.
    prenomes = " ".join(
        capitaliza_palavra(p) if maiusculo(p) and len(p) > 2 and "." not in p else p
        for p in prenomes.split()
    )
    return f"{sobrenome}, {prenomes}" if prenomes else sobrenome


def separa_autores(texto: str) -> list[str]:
    return [formata_autor(a) for a in (texto or "").split(";") if a.strip()]


def slug_id(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", sem_acento(s).lower()).strip("_")


def gera_id(autores: list[str], titulo: str, ano: int, usados: set[str]) -> str:
    sobrenome = slug_id(autores[0].split(",")[0]) if autores else "sem_autor"
    palavras = [w for w in normaliza(titulo).split() if w not in PALAVRAS_VAZIAS]
    primeira = palavras[0] if palavras else "artigo"
    base = f"{sobrenome}_{primeira}_{ano}"
    if not re.match(r"^[a-z0-9]", base):
        base = "x" + base
    novo, sufixo = base, ord("a")
    while novo in usados:
        novo = f"{base}{chr(sufixo)}"
        sufixo += 1
    usados.add(novo)
    return novo


def chave_periodico(nome: str | None) -> str:
    n = normaliza(nome or "")
    return re.sub(r"\s+(online|print|impresso|impressa)$", "", n)


# ---------------------------------------------------------------------------
# 1. Rodar o scriptLattes
# ---------------------------------------------------------------------------

def encontrar_conda() -> str | None:
    for cand in (os.environ.get("CONDA_EXE"), shutil.which("conda"),
                 "/opt/anaconda3/bin/conda", str(Path.home() / "anaconda3/bin/conda"),
                 str(Path.home() / "miniconda3/bin/conda")):
        if cand and Path(cand).exists():
            return cand
    return None


def comando_no_ambiente(ambiente: str, comando: str) -> tuple[list[str], dict]:
    """Monta a linha (e as variáveis de ambiente) que ativa o ambiente e roda o comando nele.

    `ambiente` pode ser a pasta de um venv (ex.: web_scraping/scriptLattes/scriptLattes/venv)
    ou o nome de um ambiente conda (ex.: base).
    """
    env = dict(os.environ)
    pasta = Path(ambiente).expanduser()
    if not pasta.is_absolute():
        pasta = RAIZ / pasta
    if (pasta / "bin" / "python").exists():  # venv
        # Faz o mesmo que `source venv/bin/activate`, mas com o caminho real da pasta: o
        # activate deste venv tem gravado o caminho de onde ele foi criado (um disco externo).
        env["VIRTUAL_ENV"] = str(pasta)
        env["PATH"] = f"{pasta / 'bin'}{os.pathsep}{env.get('PATH', '')}"
        env.pop("PYTHONHOME", None)
        return ["bash", "-c", comando], env
    conda = encontrar_conda()
    if not conda:
        sys.exit(f"Não achei um venv nem o conda em '{ambiente}'. Indique o ambiente com --ambiente.")
    # Mesmo efeito de `conda activate <ambiente>`; --no-capture-output mostra o progresso ao vivo.
    return [conda, "run", "--no-capture-output", "-n", ambiente, "bash", "-c", comando], env


def rodar_scriptlattes(comando: str | None, ambiente: str, usar_cache: bool, pasta_json: Path) -> None:
    if not usar_cache:
        cache = PASTA_SCRIPTLATTES / "cache"
        if cache.exists():
            n = sum(1 for _ in cache.iterdir())
            print(f"Apagando o cache de currículos ({n} arquivos) para baixar tudo de novo...")
            shutil.rmtree(cache)
        cache.mkdir(exist_ok=True)
    if pasta_json.exists():
        shutil.rmtree(pasta_json)  # evita JSON antigo de quem saiu da lista

    comando = comando or f"python scriptLattes.py {CONFIG_PADRAO}"
    args, env = comando_no_ambiente(ambiente, comando)
    print(f"Ativando o ambiente '{ambiente}' e rodando: {comando} (na pasta {PASTA_SCRIPTLATTES})")
    r = subprocess.run(args, cwd=PASTA_SCRIPTLATTES, env=env)
    if r.returncode != 0:
        sys.exit(f"\nO scriptLattes terminou com erro (código {r.returncode}). Nada foi alterado no site.")
    if not pasta_json.exists() or not any(pasta_json.glob("*.json")):
        sys.exit(f"\nO scriptLattes terminou, mas não há JSON em {pasta_json}. Nada foi alterado no site.")


# ---------------------------------------------------------------------------
# 2. Ler os JSON e atualizar o conteúdo
# ---------------------------------------------------------------------------

def ler_lista_scriptlattes(config: Path) -> list[tuple[str, str]]:
    """Lê o .list indicado em `global-arquivo_de_entrada` do .config: [(id_lattes, nome), ...]."""
    lista = None
    for linha in config.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\s*global-arquivo_de_entrada\s*=\s*(\S+)", linha)
        if m:
            lista = (PASTA_SCRIPTLATTES / m.group(1)).resolve()
    if not lista or not lista.exists():
        sys.exit(f"Não achei o arquivo de entrada (.list) indicado em {config}.")
    membros = []
    for linha in lista.read_text(encoding="utf-8").splitlines():
        partes = [x.strip() for x in linha.split(",")]
        if partes and re.fullmatch(r"\d{16}", partes[0]):
            membros.append((partes[0], partes[1] if len(partes) > 1 else ""))
    return membros


def mapear_pessoas(pessoas: list[dict], membros: list[tuple[str, str]], rel: list[str]) -> tuple[dict[str, str], list]:
    """id Lattes (do .list do scriptLattes) -> slug de pessoas.json.

    O .list do scriptLattes é a referência dos IDs. Procura a pessoa pelo ID do
    link `lattes`; se não achar, pelo nome. Quando acha pelo nome e o link em
    pessoas.json é outro, corrige o link para o ID do .list.
    """
    por_lattes = {}
    for p in pessoas:
        m = re.search(r"(\d{16})", p.get("lattes") or "")
        if m:
            por_lattes[m.group(1)] = p
    por_nome = {normaliza(p["nome"]): p for p in pessoas}

    mapa, correcoes = {}, []
    for lid, nome in membros:
        if lid in por_lattes:
            mapa[lid] = por_lattes[lid]["slug"]
        elif normaliza(nome) in por_nome:
            p = por_nome[normaliza(nome)]
            mapa[lid] = p["slug"]
            novo = f"http://lattes.cnpq.br/{lid}"
            correcoes.append((p, p.get("lattes"), novo))
            rel.append(f"- {p['nome']}: Lattes corrigido em pessoas.json, de {p.get('lattes')} para {novo} "
                       "(ID do arquivo .list do scriptLattes).")
        else:
            rel.append(f"- {nome} ({lid}): **não está em pessoas.json**; currículo ignorado.")
    return mapa, correcoes


def atualizar_publicacoes(curriculos, mapa, desde, periodicos, rel, resumo):
    arq = CONTENT / "publicacoes.json"
    dados = ler_json(arq)
    pubs = dados["publicacoes"]

    # DOI é comparado sem diferenciar maiúsculas (CLAUDE.md, seção 6.2).
    por_doi = {normaliza_doi(p.get("doi")).lower(): p for p in pubs if normaliza_doi(p.get("doi"))}
    por_titulo = {(normaliza(p["titulo"]), p["ano"]): p for p in pubs}
    ids = {p["id"] for p in pubs}

    por_issn = {}
    por_nome_per = {}
    for per in periodicos:
        for i in per.get("issn") or []:
            por_issn[i.replace("-", "").upper()] = per["nome"]
        por_nome_per[chave_periodico(per["nome"])] = per["nome"]

    # Junta os artigos de todos os currículos (um artigo de vários membros aparece uma vez).
    artigos: dict = {}
    for cv in curriculos:
        slug = mapa.get(cv["informacoes_pessoais"]["id_lattes"])
        if not slug:
            continue
        for a in cv["producao_bibliografica"].get("artigos_periodicos", []):
            ano = a.get("ano")
            if not isinstance(ano, int) or ano < desde:
                continue
            doi = normaliza_doi(a.get("doi"))
            k = doi.lower() if doi else ("titulo", normaliza(a["titulo"]), ano)
            reg = artigos.setdefault(k, {"dados": a, "doi": doi, "pessoas": []})
            if slug not in reg["pessoas"]:
                reg["pessoas"].append(slug)

    novos, alterados = [], []
    sem_doi, periodico_novo = [], Counter()
    for k, reg in artigos.items():
        a, doi = reg["dados"], reg["doi"]
        ano = a["ano"]
        existente = (por_doi.get(doi.lower()) if doi else None) or por_titulo.get((normaliza(a["titulo"]), ano))

        issn = (a.get("issn") or "").replace("-", "").upper()
        nome_per = por_issn.get(issn) or por_nome_per.get(chave_periodico(a.get("revista"))) or vazio_para_none(a.get("revista"))

        if existente:
            mudancas = []
            for s in reg["pessoas"]:
                if s not in existente["pessoas"]:
                    existente["pessoas"].append(s)
                    mudancas.append(f"+pessoa {s}")
            for campo, valor in (("doi", doi), ("volume", vazio_para_none(a.get("volume"))),
                                 ("numero", vazio_para_none(a.get("numero"))),
                                 ("paginas", vazio_para_none(a.get("paginas"))),
                                 ("periodico", nome_per)):
                if existente.get(campo) is None and valor:
                    if campo == "doi" and valor.lower() in por_doi:
                        continue  # DOI já usado por outro registro
                    existente[campo] = valor
                    mudancas.append(f"{campo} preenchido")
                    if campo == "doi":
                        por_doi[valor.lower()] = existente
            if mudancas:
                alterados.append((existente["id"], mudancas))
            continue

        autores = separa_autores(a.get("autores"))
        qualis = vazio_para_none(a.get("qualis"))
        nova = {
            "id": gera_id(autores, a["titulo"], ano, ids),
            "tipo": "artigo",
            "titulo": re.sub(r"\s+", " ", a["titulo"]).strip(),
            "autores": autores,
            "ano": ano,
            "data": f"{ano}-01-01",
            "periodico": nome_per,
            "volume": vazio_para_none(a.get("volume")),
            "numero": vazio_para_none(a.get("numero")),
            "paginas": vazio_para_none(a.get("paginas")),
            "doi": doi,
            "url": None,
            "resumo": None,
            "palavras_chave": [],
            "pessoas": sorted(reg["pessoas"]),
            "grupos": [],
            "citacoes": None,
            "fator_impacto": None,
            "qualis": qualis,
            "colaboracao_internacional": None,
            "fonte": FONTE,
        }
        if issn:
            nova["issn"] = a["issn"]
        pubs.append(nova)
        novos.append(nova)
        if doi:
            por_doi[doi.lower()] = nova
        por_titulo[(normaliza(nova["titulo"]), ano)] = nova
        if not doi:
            sem_doi.append(nova)
        if nome_per and chave_periodico(nome_per) not in por_nome_per:
            periodico_novo[nome_per] += 1

    resumo["artigos_lattes"] = len(artigos)
    resumo["artigos_novos"] = len(novos)
    resumo["artigos_alterados"] = len(alterados)
    resumo["artigos_ja_existiam"] = len(artigos) - len(novos)

    rel.append(f"\n## Publicações (artigos a partir de {desde})\n")
    rel.append(f"- Artigos distintos nos currículos: {len(artigos)}")
    rel.append(f"- Já estavam no site: {len(artigos) - len(novos)} (alterados: {len(alterados)})")
    rel.append(f"- Novos: {len(novos)} (sem DOI: {len(sem_doi)})")
    porano = Counter(n["ano"] for n in novos)
    if porano:
        rel.append("- Novos por ano: " + ", ".join(f"{a}: {porano[a]}" for a in sorted(porano)))
    if novos:
        rel.append("\n### Artigos novos\n")
        for n in sorted(novos, key=lambda x: (-x["ano"], x["id"])):
            rel.append(f"- `{n['id']}` ({n['ano']}) {n['titulo']} — *{n['periodico'] or 's/ periódico'}*"
                       + ("" if n["doi"] else " — **sem DOI**"))
    if alterados:
        rel.append("\n### Artigos existentes alterados\n")
        for i, m in sorted(alterados):
            rel.append(f"- `{i}`: {', '.join(m)}")
    if sem_doi:
        rel.append("\n### Novos sem DOI (conferir se não são duplicatas com título diferente)\n")
        for n in sem_doi:
            rel.append(f"- `{n['id']}` ({n['ano']}) {n['titulo']}")
    if periodico_novo:
        rel.append("\n### Periódicos que não estavam em periodicos.json (nome como veio do Lattes)\n")
        for nome, c in sorted(periodico_novo.items()):
            rel.append(f"- {nome} ({c})")
    return dados


def atualizar_alunos(curriculos, mapa, rel, resumo):
    arq = CONTENT / "alunos.json"
    dados = ler_json(arq)
    alunos = dados["alunos"]

    def chave(orientador, nome, nivel):
        return (orientador, normaliza(nome), nivel)

    existentes = defaultdict(list)
    for a in alunos:
        existentes[chave(a["orientador"], a["nome"], a["nivel"])].append(a)

    novos, concluidos = [], []
    vistos = set()
    for cv in curriculos:
        slug = mapa.get(cv["informacoes_pessoais"]["id_lattes"])
        if not slug:
            continue
        for sit_lattes, por_nivel in cv["orientacoes"].items():
            situacao = "concluida" if sit_lattes == "concluidas" else "em-andamento"
            for nivel_lattes, lista in por_nivel.items():
                nivel = NIVEIS.get(nivel_lattes)
                if not nivel:
                    continue
                for o in lista:
                    nome = re.sub(r"\s+", " ", o.get("orientando") or "").strip()
                    if not nome:
                        continue
                    ano_ini = o.get("ano_inicio") if isinstance(o.get("ano_inicio"), int) else None
                    ano_fim = o.get("ano_conclusao") if isinstance(o.get("ano_conclusao"), int) else None
                    marca = (slug, normaliza(nome), nivel, situacao, ano_ini, ano_fim)
                    if marca in vistos:
                        continue
                    vistos.add(marca)

                    k = chave(slug, nome, nivel)
                    regs = existentes.get(k, [])
                    if any(r["situacao"] == situacao for r in regs):
                        continue  # já está no site
                    andamento = [r for r in regs if r["situacao"] == "em-andamento"]
                    if situacao == "concluida" and andamento:
                        r = andamento[0]
                        r["situacao"] = "concluida"
                        r["ano_conclusao"] = ano_fim
                        for campo, valor in (("titulo", vazio_para_none(o.get("titulo"))), ("ano_inicio", ano_ini)):
                            if r.get(campo) is None and valor:
                                r[campo] = valor
                        concluidos.append(r)
                        continue
                    novo = {
                        "nome": nome,
                        "orientador": slug,
                        "nivel": nivel,
                        "situacao": situacao,
                        "titulo": vazio_para_none(o.get("titulo")),
                        "ano_inicio": ano_ini,
                        "ano_conclusao": ano_fim if situacao == "concluida" else None,
                        "instituicao": vazio_para_none(o.get("instituicao")),
                        "fonte": FONTE,
                    }
                    novos.append(novo)
                    existentes[k].append(novo)

    # Insere cada novo logo depois do último do mesmo orientador+nível (mantém o arquivo agrupado).
    for n in novos:
        pos = None
        for i, a in enumerate(alunos):
            if a["orientador"] == n["orientador"] and a["nivel"] == n["nivel"]:
                pos = i
        if pos is None:
            for i, a in enumerate(alunos):
                if a["orientador"] == n["orientador"]:
                    pos = i
        alunos.insert(len(alunos) if pos is None else pos + 1, n)

    resumo["alunos_novos"] = len(novos)
    resumo["alunos_concluidos"] = len(concluidos)
    rel.append("\n## Alunos\n")
    rel.append(f"- Novos: {len(novos)}")
    rel.append(f"- Passaram de em andamento para concluída: {len(concluidos)}")
    if novos:
        rel.append("\n### Alunos novos\n")
        for n in novos:
            rel.append(f"- {n['nome']} — {n['nivel']}, {n['situacao']} "
                       f"({n['ano_conclusao'] or n['ano_inicio'] or 's/ ano'}), orientação: {n['orientador']}")
    if concluidos:
        rel.append("\n### Concluídos\n")
        for r in concluidos:
            rel.append(f"- {r['nome']} — {r['nivel']} ({r['ano_conclusao']}), orientação: {r['orientador']}")
    return dados


def atualizar_periodicos(periodicos_dados, pubs, rel, resumo):
    """Acrescenta periódicos novos e recalcula quantidade e anos a partir de publicacoes.json."""
    lista = periodicos_dados["periodicos"]
    por_chave = {chave_periodico(p["nome"]): p for p in lista}
    slugs = {p["slug"] for p in lista}
    contagem = defaultdict(list)
    issns = defaultdict(set)
    for p in pubs:
        if p.get("periodico"):
            contagem[chave_periodico(p["periodico"])].append(p["ano"])
            if p.get("issn"):
                issns[chave_periodico(p["periodico"])].add(p["issn"])
    novos = 0
    for k, anos in contagem.items():
        per = por_chave.get(k)
        if not per:
            nome = next(p["periodico"] for p in pubs if p.get("periodico") and chave_periodico(p["periodico"]) == k)
            slug = re.sub(r"[^a-z0-9]+", "-", sem_acento(nome).lower()).strip("-")
            while slug in slugs:
                slug += "-2"
            slugs.add(slug)
            per = {"slug": slug, "nome": nome, "abreviacao": None, "issn": sorted(issns[k]),
                   "editora": None, "fonte": FONTE}
            lista.append(per)
            por_chave[k] = per
            novos += 1
        else:
            for i in issns[k]:
                if i not in per["issn"]:
                    per["issn"] = sorted(per["issn"] + [i])
        per["quantidade_publicacoes"] = len(anos)
        per["primeiro_ano"] = min(anos)
        per["ultimo_ano"] = max(anos)
    resumo["periodicos_novos"] = novos
    rel.append(f"\n## Periódicos\n\n- Novos em periodicos.json: {novos} (contagens recalculadas)")
    return periodicos_dados


def contexto_ssl():
    """Certificados para HTTPS. O Python do python.org no macOS vem sem eles instalados;
    usa o certifi, se houver, ou o arquivo de certificados do próprio sistema."""
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    for arq in ("/etc/ssl/cert.pem", "/opt/homebrew/etc/openssl@3/cert.pem", "/usr/local/etc/openssl@3/cert.pem"):
        if os.path.exists(arq):
            return ssl.create_default_context(cafile=arq)
    return ssl.create_default_context()


# ---------------------------------------------------------------------------
# Patentes e registros (lidos do HTML do currículo: o scriptLattes não os extrai)
# ---------------------------------------------------------------------------

PALAVRAS_VAZIAS_PT = {"de", "da", "do", "das", "dos", "para", "em", "e", "com", "a", "o", "as", "os",
                      "por", "na", "no", "nas", "nos", "um", "uma", "ao", "aos", "the", "of", "for", "and"}


def _texto_html(s: str) -> str:
    import html as _html
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = _html.unescape(s).replace("\xa0", " ")
    return re.sub(r"[ \t]+", " ", s).strip()


def _data_br(texto: str, rotulo: str) -> str | None:
    m = re.search(rotulo + r":\s*(\d{2})/(\d{2})/(\d{4})", texto)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def ler_patentes_do_cv(html_cv: str) -> list[dict]:
    """Itens da seção "Patentes e registros" do HTML do Lattes."""
    i = html_cv.find('name="PatentesRegistros"')
    if i < 0:
        return []
    j = html_cv.find('<div class="title-wrapper">', i)
    secao = html_cv[i:j if j > 0 else None]
    itens = []
    for parte in secao.split('<div class="inst_back"><b>')[1:]:
        for m in re.finditer(r'<span class="transform">(.*?)</span></div>', parte, re.S):
            t = _texto_html(m.group(1))
            plano = re.sub(r"\s+", " ", t)
            mt = re.search(r'título:\s*"([^"]+)"', plano)
            mn = re.search(r"Número do registro:\s*([^,]+),", plano)
            mi = re.search(r"Instituição de registro:\s*(.+?)\.(?:\s|$)", plano)
            mf = re.search(r"Instituição\(ões\) financiadora\(s\):\s*(.+?)\.?\s*$", plano)
            mk = re.search(r"Patente:\s*(.+?)\.", plano)
            ma = re.search(r"\.\s+(\d{4})[.,]", plano)
            if not mt:
                continue
            itens.append({
                "titulo": mt.group(1).strip().strip("'\"").strip(),
                "autores": separa_autores(plano.split(" . ", 1)[0]) if " . " in plano else [],
                "ano": int(ma.group(1)) if ma else None,
                "tipo_lattes": mk.group(1).strip() if mk else "",
                "numero": mn.group(1).strip() if mn else None,
                "instituicao": mi.group(1).strip() if mi else None,
                "financiadora": mf.group(1).strip() if mf else None,
                "deposito": _data_br(plano, "Depósito"),
                "concessao": _data_br(plano, "Concessão"),
                "registro": _data_br(plano, "data de registro"),
            })
    return itens


def chave_numero(numero: str | None) -> str | None:
    n = re.sub(r"[^0-9A-Za-z]", "", numero or "").upper()
    n = re.sub(r"^BR", "", n)
    return n or None


def mesmo_numero(a: str | None, b: str | None) -> bool:
    """Igual, ou um é o outro truncado (o Lattes às vezes corta o dígito final)."""
    if not a or not b:
        return False
    curto, longo = sorted((a, b), key=len)
    return len(curto) >= 9 and longo.startswith(curto)


def atualizar_patentes(membros, mapa, desde, rel, resumo):
    arq = CONTENT / "patentes.json"
    dados = ler_json(arq)
    patentes = dados["patentes"]
    cache = PASTA_SCRIPTLATTES / "cache"

    # Junta os itens de todos os currículos.
    juntos: list[dict] = []
    sem_cache = []
    for lid, nome in membros:
        slug = mapa.get(lid)
        if not slug:
            continue
        arq_cv = cache / lid
        if not arq_cv.exists():
            sem_cache.append(nome)
            continue
        for it in ler_patentes_do_cv(arq_cv.read_text(encoding="utf-8", errors="replace")):
            anos = [it["ano"]] + [int(d[:4]) for d in (it["deposito"], it["concessao"], it["registro"]) if d]
            if max((a for a in anos if a), default=0) < desde:
                continue
            k = chave_numero(it["numero"])
            igual = next((x for x in juntos if (k and mesmo_numero(k, x["_k"])) or
                          (not k and normaliza(x["titulo"]) == normaliza(it["titulo"]))), None)
            if igual:
                if slug not in igual["_pessoas"]:
                    igual["_pessoas"].append(slug)
                for c in ("deposito", "concessao", "registro", "financiadora"):
                    igual[c] = igual[c] or it[c]
                if it["numero"] and len(it["numero"]) > len(igual["numero"] or ""):
                    igual["numero"], igual["_k"] = it["numero"], k
                continue
            juntos.append({**it, "_k": k, "_pessoas": [slug]})

    ids = {p["id"] for p in patentes}
    novas, alteradas = [], []
    for it in juntos:
        existente = next((p for p in patentes if (it["_k"] and mesmo_numero(it["_k"], chave_numero(p.get("numero"))))
                          or normaliza(p["titulo"]) == normaliza(it["titulo"])), None)
        if existente:
            add = [s for s in it["_pessoas"] if s not in existente["pessoas"]]
            if add:
                existente["pessoas"] = existente["pessoas"] + add
                alteradas.append((existente["id"], add))
            continue

        tl = it["tipo_lattes"].lower()
        inpi = (it["instituicao"] or "").upper().startswith("INPI")
        instituicao = it["instituicao"] or "INPI - Instituto Nacional da Propriedade Industrial"
        status = "Concedida" if it["concessao"] else "Depósito"
        if "programa de computador" in tl:
            tipo, orgao, cats, titulo_det = "software", "INPI - Programa de Computador", ["Software", "INPI"], "Registro"
        elif "marca" in tl:
            tipo, orgao, cats, titulo_det = "marca", instituicao, ["Marca Registrada", "INPI"], "Registro"
        elif "modelo de utilidade" in tl:
            tipo, orgao, cats, titulo_det = ("modelo-utilidade", f"INPI - Modelo de Utilidade ({status})",
                                             ["Modelo de Utilidade", status], "Patente")
        elif "privilégio de inovação" in tl or "patente" in tl or not tl:
            tipo, orgao, cats, titulo_det = ("patente", f"INPI - Privilégio de Inovação ({status})",
                                             ["Privilégio de Inovação", status], "Patente")
        else:
            tipo, orgao, cats, titulo_det = "outro", instituicao, [it["tipo_lattes"] or "Outro"], "Registro"
        if not inpi and it["instituicao"]:
            orgao = it["instituicao"]

        data = it["concessao"] or it["deposito"] or it["registro"] or f"{it['ano']}-01-01"
        palavras = [w for w in re.sub(r"[^a-z0-9]+", " ", sem_acento(it["titulo"]).lower()).split()
                    if w not in PALAVRAS_VAZIAS_PT]
        base = f"p{data[:4]}-" + "-".join(palavras[:3] or ["registro"])
        novo_id, n = base, 2
        while novo_id in ids:
            novo_id, n = f"{base}-{n}", n + 1
        ids.add(novo_id)

        fmt = lambda d: f"{d[8:10]}/{d[5:7]}/{d[:4]}"
        linhas = [f"### Detalhes do{'a' if titulo_det == 'Patente' else ''} {titulo_det}", "",
                  f"- **{'Autores' if tipo == 'software' else 'Inventores'}:** " + "; ".join(it["autores"])]
        if it["numero"]:
            linhas.append(f"- **Número do Registro:** {it['numero']}")
        if it["deposito"]:
            linhas.append(f"- **Data de Depósito:** {fmt(it['deposito'])}")
        if it["concessao"]:
            linhas.append(f"- **Data de Concessão:** {fmt(it['concessao'])}")
        if it["registro"]:
            linhas.append(f"- **Data de Registro:** {fmt(it['registro'])}")
        linhas.append(f"- **Instituição:** {instituicao}")
        if it["financiadora"]:
            linhas.append(f"- **Instituição(ões) financiadora(s):** {it['financiadora']}")

        nova = {
            "id": novo_id,
            "titulo": it["titulo"],
            "tipo": tipo,
            "autores": it["autores"],
            "numero": it["numero"],
            "orgao": orgao,
            "data": data,
            "categorias": cats,
            "pessoas": sorted(it["_pessoas"]),
            "conteudo": "\n".join(linhas),
            "fonte": FONTE,
        }
        patentes.append(nova)
        novas.append(nova)

    resumo["patentes_novas"] = len(novas)
    resumo["patentes_alteradas"] = len(alteradas)
    rel.append(f"\n## Patentes e registros (a partir de {desde}, lidos do HTML do Lattes)\n")
    rel.append(f"- Itens distintos nos currículos: {len(juntos)}")
    rel.append(f"- Novos: {len(novas)} · já existentes que ganharam pessoas: {len(alteradas)}")
    if sem_cache:
        rel.append(f"- Sem HTML no cache (não lidos): {', '.join(sem_cache)}")
    if novas:
        rel.append("\n### Registros novos\n")
        for p in sorted(novas, key=lambda x: x["data"], reverse=True):
            rel.append(f"- `{p['id']}` ({p['data']}, {p['tipo']}) {p['titulo']} — nº {p['numero'] or 's/ número'}")
    if alteradas:
        rel.append("\n### Existentes alterados\n")
        for i, add in alteradas:
            rel.append(f"- `{i}`: +pessoas {', '.join(add)}")
    return dados


# ---------------------------------------------------------------------------
# Fotos (link "servletrecuperafoto" do HTML do currículo no cache)
# ---------------------------------------------------------------------------

PASTA_FOTOS = RAIZ / "public" / "fotos" / "pessoas"


def _baixar(url: str) -> bytes:
    import time
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": "interas-site/1.0 (fotos do Lattes)"})
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60, context=contexto_ssl()) as r:
                return r.read()
        except Exception:
            if tentativa == 2:
                raise
            time.sleep(2 * (tentativa + 1))
    return b""


def _extensao_imagem(dados: bytes) -> str | None:
    """Formato pelo conteúdo (o CNPq responde 'image/gif' mesmo quando é JPEG)."""
    if dados[:3] == b"\xff\xd8\xff":
        return "jpg"
    if dados[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if dados[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    return None


def atualizar_fotos(pessoas: list[dict], membros, mapa, simular: bool, rel, resumo) -> bool:
    """Baixa a foto do Lattes de cada pesquisador e grava em public/fotos/pessoas/<slug>.<ext>.

    Só troca a foto de quem não tem foto ou cuja foto já veio do Lattes (`foto_fonte`
    começando com "lattes"); fotos colocadas à mão não são tocadas. Imagem idêntica
    para várias pessoas é tratada como a figura padrão de "sem foto" do Lattes.
    Devolve True se pessoas.json mudou.
    """
    import hashlib
    import html as _html

    cache = PASTA_SCRIPTLATTES / "cache"
    por_slug = {p["slug"]: p for p in pessoas}
    baixadas: dict[str, tuple[bytes, str]] = {}
    sem_link, falhas, protegidas = [], [], []
    for lid, _nome in membros:
        slug = mapa.get(lid)
        if not slug:
            continue
        p = por_slug[slug]
        if p.get("foto") and not str(p.get("foto_fonte") or "").startswith("lattes"):
            protegidas.append(p["nome"])
            continue
        arq_cv = cache / lid
        html_cv = arq_cv.read_text(encoding="utf-8", errors="replace") if arq_cv.exists() else ""
        m = re.search(r'src="([^"]*servletrecuperafoto[^"]*)"', html_cv)
        if not m:
            sem_link.append(p["nome"])
            continue
        url = _html.unescape(m.group(1))
        if url.startswith("/"):
            url = "http://servicosweb.cnpq.br" + url
        try:
            dados = _baixar(url)
        except Exception as e:
            falhas.append(f"{p['nome']} ({e})")
            continue
        ext = _extensao_imagem(dados)
        if not ext or len(dados) < 1000:
            falhas.append(f"{p['nome']} (resposta não é imagem)")
            continue
        baixadas[slug] = (dados, ext)

    # A figura padrão do Lattes ("sem foto") é a mesma imagem para todos.
    hashes = Counter(hashlib.sha1(d).hexdigest() for d, _ in baixadas.values())
    padrao = {h for h, n in hashes.items() if n > 1}

    novas, trocadas, iguais, sem_foto = [], [], 0, []
    for slug, (dados, ext) in baixadas.items():
        p = por_slug[slug]
        if hashlib.sha1(dados).hexdigest() in padrao:
            sem_foto.append(p["nome"])
            continue
        caminho = f"/fotos/pessoas/{slug}.{ext}"
        destino = PASTA_FOTOS / f"{slug}.{ext}"
        if p.get("foto") == caminho and destino.exists() and destino.read_bytes() == dados:
            iguais += 1
            continue
        (trocadas if p.get("foto") else novas).append(p["nome"])
        if not simular:
            PASTA_FOTOS.mkdir(parents=True, exist_ok=True)
            antiga = RAIZ / "public" / (p.get("foto") or "").lstrip("/")
            if p.get("foto") and antiga != destino and antiga.exists():
                antiga.unlink()  # foto antiga do Lattes com outra extensão
            destino.write_bytes(dados)
        p["foto"] = caminho
        p["foto_fonte"] = FONTE

    resumo["fotos_novas"] = len(novas)
    resumo["fotos_trocadas"] = len(trocadas)
    rel.append("\n## Fotos (Lattes)\n")
    rel.append(f"- Novas: {len(novas)} · trocadas (foto mudou no Lattes): {len(trocadas)} · iguais: {iguais}")
    if novas:
        rel.append("- Com foto nova: " + ", ".join(sorted(novas)))
    if trocadas:
        rel.append("- Foto trocada: " + ", ".join(sorted(trocadas)))
    if protegidas:
        rel.append("- Não tocadas (foto colocada à mão): " + ", ".join(sorted(protegidas)))
    if sem_foto or sem_link:
        rel.append("- Sem foto no Lattes: " + ", ".join(sorted(sem_foto + sem_link)))
    if falhas:
        rel.append("- Falha no download: " + "; ".join(falhas))
    return bool(novas or trocadas)


def openalex_get(caminho: str, parametros: dict) -> dict:
    """GET na API do OpenAlex (só biblioteca padrão), com 3 tentativas."""
    import time
    import urllib.parse
    import urllib.request

    chave = os.environ.get("OPENALEX_API_KEY")
    if chave:
        parametros = {**parametros, "api_key": chave}
    url = f"https://api.openalex.org/{caminho}?" + urllib.parse.urlencode(parametros, safe=":|/,")
    req = urllib.request.Request(url, headers={"User-Agent": "interas-site/1.0 (atualizacao de metricas)"})
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60, context=contexto_ssl()) as r:
                time.sleep(0.2)
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # rede, 429, 5xx
            if tentativa == 2:
                raise RuntimeError(f"OpenAlex falhou em {caminho}: {e}") from e
            time.sleep(2 * (tentativa + 1))
    return {}


def atualizar_metricas(pubs: list[dict], rel: list[str], resumo: dict) -> None:
    """Citações, "JCR" (proxy: 2yr_mean_citedness da revista) e países, pelo OpenAlex.

    Atualiza TODA vez todos os artigos com DOI cujas métricas vêm do OpenAlex ou
    ainda não existem. Métricas de outra fonte (ex.: JCR oficial digitado à mão,
    com `fonte_metricas` diferente de openalex-*) não são tocadas.
    """
    fonte = f"openalex-{HOJE}"
    alvo = {}
    protegidos = 0
    for p in pubs:
        doi = normaliza_doi(p.get("doi"))
        if not doi:
            continue
        fm = p.get("fonte_metricas")
        if fm and not str(fm).startswith("openalex"):
            protegidos += 1
            continue
        alvo[doi.lower()] = p

    print(f"\nBuscando métricas no OpenAlex para {len(alvo)} artigos...")
    obras = {}
    dois = list(alvo)
    for i in range(0, len(dois), 50):
        lote = dois[i:i + 50]
        d = openalex_get("works", {"filter": "doi:" + "|".join(lote), "per-page": 50,
                                   "select": "doi,cited_by_count,primary_location,authorships"})
        for w in d.get("results", []):
            obras[normaliza_doi(w.get("doi")).lower()] = w
        print(f"  {min(i + 50, len(dois))}/{len(dois)}")

    fontes_ids = set()
    for w in obras.values():
        src = (w.get("primary_location") or {}).get("source") or {}
        if src.get("id"):
            fontes_ids.add(src["id"].rsplit("/", 1)[-1])
    impacto = {}
    fl = sorted(fontes_ids)
    for i in range(0, len(fl), 50):
        d = openalex_get("sources", {"filter": "openalex:" + "|".join(fl[i:i + 50]), "per-page": 50,
                                     "select": "id,summary_stats"})
        for s in d.get("results", []):
            v = (s.get("summary_stats") or {}).get("2yr_mean_citedness")
            if isinstance(v, (int, float)):
                impacto[s["id"].rsplit("/", 1)[-1]] = round(float(v), 3)

    atualizados, nao_achados, mudou_cit = 0, [], 0
    for doi, p in alvo.items():
        w = obras.get(doi)
        if not w:
            nao_achados.append(p["id"])
            continue
        cit = w.get("cited_by_count")
        if isinstance(cit, int):
            if p.get("citacoes") is not None and p["citacoes"] != cit:
                mudou_cit += 1
            p["citacoes"] = cit
        src = (w.get("primary_location") or {}).get("source") or {}
        fi = impacto.get((src.get("id") or "").rsplit("/", 1)[-1])
        if fi is not None:
            p["fator_impacto"] = fi
        paises = sorted({inst["country_code"] for a in w.get("authorships", [])
                         for inst in a.get("institutions", []) if inst.get("country_code")})
        if paises:
            p["paises"] = paises
            p["colaboracao_internacional"] = any(c != "BR" for c in paises)
        p["fonte_metricas"] = fonte
        atualizados += 1

    resumo["metricas_atualizadas"] = atualizados
    resumo["metricas_nao_encontradas"] = len(nao_achados)
    rel.append(f"\n## Métricas (OpenAlex, {HOJE})\n")
    rel.append(f"- Artigos atualizados: {atualizados} (citações que mudaram: {mudou_cit})")
    rel.append("- `fator_impacto` é um proxy do JCR: média de citações em 2 anos da revista (2yr_mean_citedness).")
    if protegidos:
        rel.append(f"- Não tocados (métricas de outra fonte): {protegidos}")
    if nao_achados:
        rel.append(f"- DOI não encontrado no OpenAlex ({len(nao_achados)}): " + ", ".join(f"`{i}`" for i in sorted(nao_achados)))


def ordenar_com_node(simular: bool) -> None:
    """Ordena publicações e periódicos com as mesmas regras do site (localeCompare do JS)."""
    if simular:
        return
    codigo = r"""
import { readFileSync, writeFileSync } from 'node:fs';
const ler = (f) => JSON.parse(readFileSync(f, 'utf8'));
const gravar = (f, d) => writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
const p = ler('content/publicacoes.json');
p.publicacoes.sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
gravar('content/publicacoes.json', p);
const t = ler('content/patentes.json');
t.patentes.sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
gravar('content/patentes.json', t);
const r = ler('content/periodicos.json');
r.periodicos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
gravar('content/periodicos.json', r);
"""
    subprocess.run(["node", "--input-type=module", "-e", codigo], cwd=RAIZ, check=True)


# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="Baixa os Lattes com o scriptLattes e atualiza o site.")
    ap.add_argument("--comando", help="linha de comando do scriptLattes (roda dentro de web_scraping/scriptLattes)")
    ap.add_argument("--ambiente", default=VENV_PADRAO,
                    help="ambiente Python ativado antes do scriptLattes: pasta de um venv ou nome "
                         "de um ambiente conda (padrão: web_scraping/scriptLattes/scriptLattes/venv)")
    ap.add_argument("--pular-download", action="store_true", help="não roda o scriptLattes; usa os JSON que já existem")
    ap.add_argument("--usar-cache", action="store_true", help="não apaga o cache (reaproveita currículos já baixados)")
    ap.add_argument("--pasta-json", type=Path, default=PASTA_JSON_PADRAO, help="pasta com os JSON do scriptLattes")
    ap.add_argument("--desde", type=int, default=2020,
                    help="ano mínimo dos artigos e patentes incluídos (padrão: 2020)")
    ap.add_argument("--sem-metricas", action="store_true",
                    help="não consulta o OpenAlex (citações, fator de impacto e países)")
    ap.add_argument("--simular", action="store_true", help="não grava nada; só mostra o relatório")
    args = ap.parse_args()

    if not args.pular_download:
        rodar_scriptlattes(args.comando, args.ambiente, args.usar_cache, args.pasta_json)

    arquivos = sorted(glob.glob(str(args.pasta_json / "*.json")))
    if not arquivos:
        sys.exit(f"Nenhum JSON em {args.pasta_json}.")
    curriculos = [ler_json(Path(f)) for f in arquivos]

    rel = [f"# Atualização a partir do Lattes — {HOJE}\n",
           f"Currículos lidos: {len(curriculos)} (pasta `{os.path.relpath(args.pasta_json, RAIZ)}`)\n",
           "## Pessoas\n"]
    resumo: dict = {}
    pessoas_dados = ler_json(CONTENT / "pessoas.json")
    membros = ler_lista_scriptlattes(PASTA_SCRIPTLATTES / CONFIG_PADRAO)
    mapa, correcoes = mapear_pessoas(pessoas_dados["pessoas"], membros, rel)
    resumo["lattes_corrigidos_em_pessoas"] = len(correcoes)
    if len(rel) == 3:
        rel.append("- Todos os IDs do .list batem com os links Lattes de pessoas.json.")
    ids_json = {cv["informacoes_pessoais"]["id_lattes"] for cv in curriculos}
    for lid, nome in membros:
        if lid not in ids_json:
            rel.append(f"- {nome} ({lid}): está no .list, mas o scriptLattes não gerou o JSON.")

    periodicos = ler_json(CONTENT / "periodicos.json")
    pubs = atualizar_publicacoes(curriculos, mapa, args.desde, periodicos["periodicos"], rel, resumo)
    alunos = atualizar_alunos(curriculos, mapa, rel, resumo)
    periodicos = atualizar_periodicos(periodicos, pubs["publicacoes"], rel, resumo)
    patentes = atualizar_patentes(membros, mapa, args.desde, rel, resumo)
    fotos_mudaram = atualizar_fotos(pessoas_dados["pessoas"], membros, mapa, args.simular, rel, resumo)
    if not args.sem_metricas:
        atualizar_metricas(pubs["publicacoes"], rel, resumo)

    print("\nResumo:")
    for k, v in resumo.items():
        print(f"  {k}: {v}")

    if args.simular:
        print("\n(simulação: nada foi gravado)\n")
        print("\n".join(rel))
        return

    for p, _, novo in correcoes:
        p["lattes"] = novo
    if correcoes or fotos_mudaram:
        gravar_json(CONTENT / "pessoas.json", pessoas_dados)
    gravar_json(CONTENT / "publicacoes.json", pubs)
    gravar_json(CONTENT / "patentes.json", patentes)
    gravar_json(CONTENT / "alunos.json", alunos)
    gravar_json(CONTENT / "periodicos.json", periodicos)
    ordenar_com_node(args.simular)

    relatorio = RAIZ / "web_scraping" / f"relatorio-lattes-{HOJE}.md"
    relatorio.write_text("\n".join(rel) + "\n", encoding="utf-8")
    print(f"\nRelatório: {os.path.relpath(relatorio, RAIZ)}")

    print("\nValidando o conteúdo (npm run validar)...")
    r = subprocess.run(["npm", "run", "validar"], cwd=RAIZ)
    if r.returncode != 0:
        sys.exit("A validação falhou. Veja as mensagens acima (os arquivos já foram gravados; use git diff/checkout para revisar).")


if __name__ == "__main__":
    main()
