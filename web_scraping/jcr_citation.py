import requests
import time
import csv

# 4 DOIs de exemplo para teste
dos_teste = [
    "10.1016/j.saa.2026.127720",
    "10.1016/j.radphyschem.2026.113792",
    "10.1016/j.optmat.2026.118013",
    "10.1016/j.saa.2026.127558",
    "10.1016/j.mseb.2026.119285",
    "10.1016/j.bjorl.2026.101780",
    "10.1016/j.jaridenv.2026.105604",
    "10.1088/2057-1976/ae43ef",
    "10.1016/j.nxmate.2026.101760",
    "10.1016/j.cocom.2025.e01181",
    "10.1016/j.physb.2026.418404",
    "10.1016/j.marpolbul.2026.119221",
    "10.1021/acs.analchem.5c07289",
    "10.1007/s12020-025-04510-6",
    "10.1007/s10967-026-10781-8",
    "10.1080/10739149.2025.2513279",
    "10.1016/j.mucimm.2026.03.007",
    "10.1016/j.compag.2025.111392",
    "10.1111/php.70000",
    "10.1007/s00428-026-04399-0",
    "10.1016/j.apradiso.2025.112381",
    "10.1016/j.radmeas.2026.107624",
    "10.1016/j.marpolbul.2025.119148",
    "10.1007/s43630-026-00851-x",
    "10.1016/j.nucmedbio.2026.109610",
    "10.3390/ijms27052230",
    "10.1002/lary.70128",
    "10.1002/lsm.70091",
    "10.1007/s10967-025-10555-8",
    "10.1016/j.ijrobp.2025.09.011",
    "10.1088/1742-6596/3183/1/012001",
    "10.1364/AO.579461",
    "10.1111/jop.70113",
    "10.3390/microplastics5010013",
    "10.1021/acsomega.5c10219",
    "10.1016/j.saa.2025.126717",
    "10.1016/j.bjorl.2025.101710",
    "10.1155/sci5/6254270",
    "10.1039/D5NA00927H",
    "10.1007/s10103-025-04780-6",
    "10.1016/j.oraloncology.2025.107764",
    "10.1016/j.apradiso.2025.112217",
    "10.1007/s00784-025-06662-1",
    "10.1016/j.apradiso.2025.112141",
    "10.1016/j.triboint.2025.110977",
    "10.1002/lio2.70296",
    "10.1016/j.jlumin.2025.121540",
    "10.1016/j.pdpdt.2025.105252",
    "10.1017/S1047951125110792",
    "10.1016/j.ijcchd.2025.100631",
    "10.1016/j.radphyschem.2025.113032",
    "10.3390/ma18235367",
    "10.1175/BAMS-D-23-0161.1",
    "10.1007/s10103-025-04735-x",
    "10.1140/epjs/s11734-025-02054-4",
    "10.1007/s10967-025-10502-7",
    "10.1016/j.bjorl.2025.101715",
    "10.1016/j.bbrc.2025.152842",
    "10.1016/j.saa.2025.126296",
    "10.1016/j.bjorl.2025.101659",
    "10.1016/j.hlc.2025.07.009",
    "10.1007/s10103-025-04713-3",
    "10.3390/rs17203483",
    "10.1177/00034894251342422",
    "10.1016/j.apradiso.2025.111942",
    "10.1016/j.lfs.2025.123836",
    "10.1007/s13538-025-01843-5",
    "10.1016/j.oraloncology.2025.107615",
    "10.1016/j.cattod.2025.115376",
    "10.1016/j.niox.2025.08.001",
    "10.1016/j.nxmate.2025.101149",
    "10.1016/j.oraloncology.2025.107634",
    "10.1007/s11082-025-08439-y",
    "10.31744/einstein_journal/2025AO1768",
    "10.1016/j.bjorl.2025.101632",
    "10.1007/s12668-025-01932-4",
    "10.1111/jop.70008",
    "10.1111/jop.70028",
    "10.3390/atmos16091022",
    "10.1038/s41598-025-16060-y",
    "10.1002/rcm.10063",
    "10.1038/s41598-025-08542-w",
    "10.1016/j.oraloncology.2025.107420",
    "10.1016/j.dib.2025.111741",
    "10.1016/j.jpba.2025.116844",
    "10.1016/j.critrevonc.2025.104742",
    "10.1016/j.jallcom.2025.182830",
    "10.1007/s11701-025-02546-4",
    "10.1021/acsomega.5c01385",
    "10.1016/j.bjorl.2025.101613",
    "10.1016/j.foodchem.2025.143970",
    "10.1016/j.bjorl.2025.101641",
    "10.1016/j.bjorl.2025.101598",
    "10.1016/j.bjorl.2025.101645",
    "10.1016/j.bjorl.2025.101610",
    "10.1016/j.bjorl.2025.101638",
    "10.1016/j.ceramint.2025.03.172",
    "10.1016/j.bjorl.2025.101640",
    "10.1016/j.radphyschem.2025.112701",
    "10.1016/j.bjorl.2025.101597",
    "10.1016/j.bjorl.2025.101614",
    "10.1016/j.bjorl.2025.101639",
    "10.1016/j.bjorl.2025.101608",
    "10.1113/JP287815",
    "10.31744/einstein_journal/2025AO1715",
    "10.1016/j.cocom.2025.e01032",
    "10.1177/15330338251317304",
    "10.1080/14680629.2025.2489028",
    "10.1021/acsomega.4c10784",
    "10.1200/GO-25-00207",
    "10.3390/mi16050550",
    "10.1007/s10103-025-04434-7",
    "10.3390/pr13041112",
    "10.1021/acsomega.4c08648",
    "10.1007/s12551-025-01283-0",
    "10.3389/feart.2025.1549385",
    "10.1089/thy.2024.0486",
    "10.1186/s12884-024-06941-x",
    "10.3390/plants14071005",
    "10.1186/s41181-025-00334-x",
    "10.3390/microplastics4010012",
    "10.1177/00037028241281388",
    "10.1002/cctc.202401874",
    "10.1016/j.joen.2024.12.007",
    "10.1111/jerd.13439",
    "10.1021/acsanm.4c06747",
    "10.1021/acs.jproteome.4c00707",
    "10.1038/s44161-025-00610-8",
    "10.1007/s10103-025-04291-4",
    "10.1007/s10967-024-09878-9",
    "10.1016/j.marpolbul.2024.117449",
    "10.1088/2057-1976/ad8acc",
    "10.3390/mi16020171",
    "10.1186/s11671-024-04141-2",
    "10.31744/einstein_journal/2025AO1007",
    "10.1038/s41598-025-86434-9",
    "10.1007/s10549-024-07607-0",
    "10.1016/j.bjorl.2024.101515",
    "10.1016/j.bjorl.2024.101510",
    "10.1039/D4NR03626C",
    "10.1016/j.marpolbul.2024.117335",
    "10.1590/1678-7757-2025-0103",
    "10.21577/0103-5053.20250011",
    "10.1016/j.marpolbul.2024.117286",
    "10.1155/amse/8059229",
    "10.1590/1413-81232025301.04962023",
    "10.1016/j.foodcont.2024.110798",
    "10.1016/j.clinsp.2025.100836",
    "10.1016/j.jenvman.2024.123498",
    "10.1016/j.jphotobiol.2024.113077",
    "10.1016/j.heliyon.2024.e41381",
    "10.55028/revens.v5i9.21701",
    "10.5281/ZENODO.14540221",
    "10.1080/10408398.2023.2245038",
    "10.36661/2595-4520.2024v7n4.14428",
    "10.3390/antibiotics13121157",
    "10.3390/jcm13237317",
    "10.2174/2666145417666230823091126",
    "10.1002/masy.202400061",
    "10.1016/j.marpolbul.2024.117025",
    "10.1016/j.scitotenv.2024.177479",
    "10.1016/j.apradiso.2024.111548",
    "10.2174/2666145417666230726153437",
    "10.1016/j.oraloncology.2024.107098",
    "10.1371/journal.pntd.0012612",
    "10.3390/ijms252211856",
    "10.1016/j.ajic.2024.06.006",
    "10.1016/j.radphyschem.2024.112083",
    "10.1016/j.radphyschem.2024.112012",
    "10.1016/j.radphyschem.2024.112000",
    "10.1016/j.optmat.2024.116210",
    "10.1016/j.radphyschem.2024.112016",
    "10.1016/j.radphyschem.2024.112103",
    "10.3390/photonics11100937",
    "10.1016/j.radphyschem.2024.111897",
    "10.1055/s-0044-1779010",
    "10.1007/s13538-024-01513-y",
    "10.1016/j.jallcom.2024.175583",
    "10.1016/j.radphyschem.2024.111965",
    "10.1016/j.ijcha.2024.101499",
    "10.3390/photonics11100898",
    "10.29384/rbfm.2024.v18.19849001804",
    "10.31744/einstein_journal/2024CE1147",
    "10.3389/froh.2024.1481890",
    "10.22600/1518-8795.ienci2024v29n2p84",
    "10.1002/jbio.202400066",
    "10.1016/j.saa.2024.124320",
    "10.1016/j.radmeas.2024.107250",
    "10.1016/j.radmeas.2024.107261",
    "10.31744/einstein_journal/2024EDS3",
    "10.1016/j.jlumin.2024.120655",
    "10.1016/j.biopha.2024.116881",
    "10.1002/cre2.926",
    "10.1007/s13538-024-01512-z",
    "10.1007/s11468-023-02109-z",
    "10.1016/j.radmeas.2024.107217",
    "10.1016/j.marpolbul.2024.116695",
    "10.1016/j.apr.2024.102179",
    "10.55905/cuadv16n7-141",
    "10.33448/rsd-v13i7.46230"
]

# Cache das revistas já consultadas (id da source -> 2yr_mean_citedness)
cache_revistas = {}

def buscar_impacto_revista(id_fonte):
    # A "source" que vem dentro de /works é resumida e não traz summary_stats;
    # é preciso consultar /sources/{id} separadamente.
    if not id_fonte:
        return ""
    if id_fonte in cache_revistas:
        return cache_revistas[id_fonte]
    id_curto = id_fonte.rsplit("/", 1)[-1]
    try:
        resposta = requests.get(f"https://api.openalex.org/sources/{id_curto}?select=summary_stats")
        valor = resposta.json().get("summary_stats", {}).get("2yr_mean_citedness", "") if resposta.status_code == 200 else ""
        if isinstance(valor, float):
            valor = round(valor, 3)
    except Exception as e:
        print(f"Erro ao buscar a revista {id_fonte}: {e}")
        valor = ""
    cache_revistas[id_fonte] = valor
    time.sleep(0.2)
    return valor

def extrair_dados_artigo(doi):
    url = f"https://api.openalex.org/works/https://doi.org/{doi}"
    
    try:
        resposta = requests.get(url)
        if resposta.status_code != 200:
            return {"DOI": doi, "Revista": "Não encontrado", "Proxy_JCR": "", "Citacoes": "", "Paises": ""}

        dados = resposta.json()
        
        # 1. Total de Citações
        citacoes = dados.get("cited_by_count", 0)
        
        # 2. Informações da Revista
        local_principal = dados.get("primary_location", {})
        fonte = local_principal.get("source", {}) if local_principal else {}
        
        revista = fonte.get("display_name", "Desconhecida") if fonte else "Desconhecida"
        fator_impacto = buscar_impacto_revista(fonte.get("id")) if fonte else ""
        
        # 3. Colaborações entre Países
        paises = set()
        for autoria in dados.get("authorships", []):
            for instituicao in autoria.get("institutions", []):
                codigo_pais = instituicao.get("country_code")
                if codigo_pais:
                    paises.add(codigo_pais)
                    
        paises_formatados = ", ".join(sorted(paises)) if paises else "Indisponível"
        
        return {
            "DOI": doi,
            "Revista": revista,
            "Proxy_JCR": fator_impacto,
            "Citacoes": citacoes,
            "Paises": paises_formatados
        }
        
    except Exception as e:
        print(f"Erro ao processar o DOI {doi}: {e}")
        return {"DOI": doi, "Revista": "Erro", "Proxy_JCR": "", "Citacoes": "", "Paises": ""}

# Nome do arquivo que será gerado
nome_arquivo_csv = "./web_scraping/analise_artigos.csv"

# Criação e escrita no arquivo CSV
print("Iniciando a coleta de dados e geração do CSV...")

with open(nome_arquivo_csv, mode='w', newline='', encoding='utf-8-sig') as arquivo:
    # Definindo as colunas
    colunas = ["DOI", "Revista", "Proxy_JCR", "Citacoes", "Paises"]
    
    # Configuramos o delimitador como ';' para abrir direto no Excel do Brasil
    escritor = csv.DictWriter(arquivo, fieldnames=colunas, delimiter=';')
    
    # Escreve a linha de cabeçalho
    escritor.writeheader()
    
    # Processa cada DOI e escreve a linha correspondente no arquivo
    for doi in dos_teste:
        print(f"Buscando dados para: {doi}")
        dados = extrair_dados_artigo(doi)
        escritor.writerow(dados)
        
        # Pausa para respeitar os limites da API
        time.sleep(0.5)

print(f"\nPronto! O arquivo '{nome_arquivo_csv}' foi salvo com sucesso. Você já pode abri-lo no Excel.")